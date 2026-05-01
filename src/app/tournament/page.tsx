import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import TournamentOptimizer from '@/components/TournamentOptimizer';

const creatures = creaturesData as Creature[];

export const metadata = { title: 'Tournament Optimizer — JWA Dinodex' };

export default async function TournamentPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <TournamentOptimizer creatures={creatures} />;
}
