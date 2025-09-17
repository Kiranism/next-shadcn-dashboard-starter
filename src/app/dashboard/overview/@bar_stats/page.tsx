import { setTimeout } from 'node:timers/promises';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await setTimeout(1000);
  return <BarGraph />;
}
