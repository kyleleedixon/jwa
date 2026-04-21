import Dashboard from '@/components/Dashboard';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import metaData from '@/data/meta.json';

export default function Home() {
  const creatures = creaturesData as Creature[];
  return <Dashboard creatures={creatures} lastModifiedDate={metaData.lastModifiedDate} />;
}
