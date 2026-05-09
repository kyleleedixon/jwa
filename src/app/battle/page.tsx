import BattleSimulator from '@/components/BattleSimulator';
import creaturesData from '@/data/creatures.json';
import { Creature } from '@/types/creature';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Battle Sim — JWA Dinodex' };

export default async function BattlePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <BattleSimulator creatures={creaturesData as Creature[]} />;
}
