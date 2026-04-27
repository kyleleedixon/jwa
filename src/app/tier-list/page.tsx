import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import TierList, { TierGroup } from '@/components/TierList';

export const metadata = { title: 'Tier List — JWA Dinodex' };

export default async function TierListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  let groups: Record<string, TierGroup>;
  try {
    // Dynamic import so Next.js reads the JSON at request time (picks up scrape updates)
    const data = await import('@/data/tierlist.json', { assert: { type: 'json' } });
    groups = data.default as Record<string, TierGroup>;
  } catch {
    groups = {};
  }

  if (Object.keys(groups).length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-lg">Tier list not yet computed.</p>
        <p className="text-sm">Run <code className="bg-slate-800 px-2 py-0.5 rounded">npm run compute-tiers</code> to generate it.</p>
      </div>
    );
  }

  return <TierList groups={groups} />;
}
