import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.id) return false;
      return isAuthorized(profile.id as string);
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
