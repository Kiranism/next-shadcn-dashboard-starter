import { setTimeout } from 'node:timers/promises';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  await setTimeout(2000);
  return <AreaGraph />;
}
