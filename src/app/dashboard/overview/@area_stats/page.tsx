import { auth } from '@clerk/nextjs/server';
import { delay } from '@/constants/mock-api';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  await auth.protect();

  await delay(2000);
  return <AreaGraph />;
}
