import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
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

      <div className="relative w-full max-w-sm flex flex-col items-center gap-6">
        {/* Alliance logo + title */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/tearex.jpg"
            alt="Tea Rex Alliance"
            width={96}
            height={96}
            className="rounded-full border-2 border-slate-600 shadow-xl"
          />
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              JWA <span className="text-blue-400">Dinodex</span>
            </h1>
            <p className="text-sm text-gray-500">Sign in to access the creature database</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 shadow-2xl p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
              {error === 'AccessDenied'
                ? "Your Discord account doesn't have access. Make sure you have the required alliance role."
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <LoginButton />

          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-700/60">
            <p className="text-center text-xs text-gray-500 font-medium">
              Restricted to alliance members only
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                TeaRex Hunter
              </span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                TeaRex Rogue
              </span>
            </div>
            <p className="text-center text-[11px] text-gray-600 mt-0.5">
              Alliance membership is verified via Discord roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
