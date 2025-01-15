import { delay } from '@/constants/mock-api';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await await delay(1000);

  return <BarGraph />;
}
