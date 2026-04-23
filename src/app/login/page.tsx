import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import LoginButton from './LoginButton';

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-1">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            JWA <span className="text-blue-400">Dinodex</span>
          </h1>
          <p className="text-sm text-gray-500">Sign in to access the creature database</p>
        </div>

        {/* Card */}
        <div className="w-full bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 shadow-2xl p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
              {error === 'AccessDenied'
                ? "Your Discord account doesn't have access. Make sure you have the required server role."
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <LoginButton />

          <p className="text-center text-xs text-gray-600">
            Access is restricted to server members with the required role.
          </p>
        </div>
      </div>
    </div>
  );
}
