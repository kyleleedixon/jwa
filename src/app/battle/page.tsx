import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import BattleSimulator from '@/components/BattleSimulator';

const creatures = creaturesData as Creature[];

export const metadata = { title: 'Battle Simulator — JWA Dinodex' };

export default async function BattlePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <BattleSimulator creatures={creatures} />;
}
