import Dashboard from '@/components/Dashboard';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';

export default function Home() {
  const creatures = creaturesData as Creature[];
  return <Dashboard creatures={creatures} />;
}
