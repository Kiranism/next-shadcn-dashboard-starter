import { PieGraph } from '@/features/overview/components/pie-graph';
import { setTimeout } from 'node:timers/promises';

export default async function Stats() {
  await setTimeout(1000);
  return <PieGraph />;
}
