import { signIn, auth } from '@/../auth';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/');

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold text-white">
            JWA <span className="text-blue-400">Dinodex</span>
          </h1>
          <p className="text-sm text-gray-400">Members only</p>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 text-center">
            {error === 'AccessDenied'
              ? "You don't have access. Make sure you're a member with the required role."
              : 'Something went wrong. Please try again.'}
          </div>
        )}

        <form
          action={async () => {
            'use server';
            await signIn('discord', { redirectTo: '/' });
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] transition-colors text-white font-semibold rounded-xl px-4 py-3"
          >
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7 8.07A105.15 105.15 0 0081.47 0a72.06 72.06 0 00-3.36 6.83A97.68 97.68 0 0049 6.83 72.37 72.37 0 0045.64 0a105.89 105.89 0 00-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0032.17 16.15 77.7 77.7 0 006.89-11.11 68.42 68.42 0 01-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0064.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 01-10.87 5.19 77 77 0 006.89 11.1 105.25 105.25 0 0032.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z"/>
            </svg>
            Sign in with Discord
          </button>
        </form>
      </div>
    </div>
  );
}
