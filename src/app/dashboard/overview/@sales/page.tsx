import { recentSalesData } from '@/constants/data';
import { delay } from '@/constants/mock-api';
import { RecentSales } from '@/features/overview/components/recent-sales';
import React from 'react';

async function getSalesInfo() {
  await delay(2000);
  return recentSalesData;
}

export default async function Sales() {
  const sales = await getSalesInfo();
  return <RecentSales />;
}
