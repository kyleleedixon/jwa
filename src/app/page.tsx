import Dashboard from '@/components/Dashboard';
import { Creature } from '@/types/creature';
import creaturesData from '@/data/creatures.json';
import metaData from '@/data/meta.json';
import changelogData from '@/data/changelog.json';
import { auth } from '@/../auth';
import { redirect } from 'next/navigation';
import { decodeShare } from '@/lib/share';
import type { Metadata } from 'next';

const creatures = creaturesData as Creature[];

type Props = { searchParams: Promise<{ share?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { share } = await searchParams;
  if (!share) return { title: 'JWA Dinodex' };

  const state = decodeShare(share);
  const creature = state ? creatures.find(c => c.uuid === state.c) : null;
  if (!creature) return { title: 'JWA Dinodex' };

  const title = `${creature.name} — JWA Dinodex`;
  const description = `Lv ${state!.lv} · ${creature.rarity} ${creature.class}. View this build on the Tea Rex Alliance Dinodex.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: creature.image, width: 256, height: 256, alt: creature.name }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [creature.image],
    },
  };
}

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <Dashboard creatures={creatures} lastModifiedDate={metaData.lastModifiedDate} version={metaData.version} changelog={changelogData} />;
}
