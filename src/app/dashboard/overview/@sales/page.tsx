import { auth } from '@clerk/nextjs/server';
import { delay } from '@/constants/mock-api';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  await auth.protect();

  await delay(3000);
  return <RecentSales />;
}
