import Dashboard from '@/components/Dashboard';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import metaData from '@/data/meta.json';
import changelogData from '@/data/changelog.json';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const creatures = creaturesData as Creature[];
  return <Dashboard creatures={creatures} lastModifiedDate={metaData.lastModifiedDate} version={metaData.version} changelog={changelogData} />;
}
