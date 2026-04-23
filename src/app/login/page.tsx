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

        <LoginButton />
      </div>
    </div>
  );
}
