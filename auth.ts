import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { put } from '@vercel/blob';

const GUILD_ID  = process.env.DISCORD_GUILD_ID!;
const ROLE_IDS  = [process.env.DISCORD_ROLE_ID_1!, process.env.DISCORD_ROLE_ID_2!];
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

async function isAuthorized(userId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` }, cache: 'no-store' }
    );
    if (!res.ok) return false;
    const member = await res.json();
    return (member.roles as string[]).some(r => ROLE_IDS.includes(r));
  } catch {
    return false;
  }
}

async function writeAuditLog(entry: {
  discordId: string;
  name: string;
  avatar?: string;
  authorized: boolean;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const timestamp = new Date().toISOString();
  const key = `audit/${timestamp}-${entry.discordId}.json`;
  await put(key, JSON.stringify({ ...entry, timestamp }), {
    access: 'private',
    addRandomSuffix: false,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { prompt: 'none' } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.id) return false;
      const authorized = await isAuthorized(profile.id as string);
      writeAuditLog({
        discordId: profile.id as string,
        name: (profile.username ?? profile.global_name ?? profile.name ?? '') as string,
        avatar: profile.image_url as string | undefined,
        authorized,
      }).catch(() => {});
      return authorized;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, profile }) {
      if (profile?.id) token.discordId = profile.id;
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
