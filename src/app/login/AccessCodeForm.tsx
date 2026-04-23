'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function AccessCodeForm() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const result = await signIn('credentials', { password: code, redirect: false });
    if (result?.ok) {
      window.location.href = '/';
    } else {
      setError(true);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center w-full"
      >
        Use access code
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="password"
        value={code}
        onChange={e => { setCode(e.target.value); setError(false); }}
        placeholder="Access code"
        autoFocus
        className={`w-full bg-slate-700/60 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 transition-colors ${
          error ? 'border-red-500/60 focus:ring-red-500/40' : 'border-slate-600 focus:ring-blue-500/40'
        }`}
      />
      {error && <p className="text-xs text-red-400 text-center">Incorrect access code.</p>}
      <button
        type="submit"
        disabled={loading || !code}
        className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold rounded-xl px-4 py-2.5 text-sm"
      >
        {loading ? 'Verifying…' : 'Continue'}
      </button>
    </form>
  );
}
