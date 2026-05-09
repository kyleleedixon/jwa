import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import TournamentCompanion from '@/components/TournamentCompanion';

const creatures = creaturesData as Creature[];

export const metadata = { title: 'Tournament Companion — JWA Dinodex' };

export default async function CompanionPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <TournamentCompanion creatures={creatures} />;
}
