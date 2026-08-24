import { auth } from '@clerk/nextjs/server';
import { delay } from '@/constants/mock-api';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await auth.protect();

  await delay(1000);

  return <BarGraph />;
}
