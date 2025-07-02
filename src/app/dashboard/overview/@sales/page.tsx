import { setTimeout } from 'node:timers/promises';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  await setTimeout(3000);
  return <RecentSales />;
}
