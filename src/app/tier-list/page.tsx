import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import TierList from '@/components/TierList';

const creatures = creaturesData as Creature[];

export const metadata = { title: 'Tier List — JWA Dinodex' };

export default async function TierListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <TierList creatures={creatures} />;
}
