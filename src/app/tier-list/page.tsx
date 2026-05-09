import TierList from '@/components/TierList';
import tierlistData from '@/data/tierlist.json';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Tier List — JWA Dinodex' };

export default async function TierListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = tierlistData as any;
  return (
    <TierList
      entries={data.entries}
      level={data.level}
      computedAt={data.computedAt}
    />
  );
}
