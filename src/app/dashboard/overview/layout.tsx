'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTrendingUp } from '@tabler/icons-react';
import { PendingToursWidget } from '@/features/dashboard/components/pending-tours-widget';
import { useTrips } from '@/features/trips/hooks/use-trips';
import { StatsCard } from '@/features/dashboard/components/stats-card';
import { subDays } from 'date-fns';
import {
  getTripsForDay,
  calculateTotalRevenue,
  calculateTrend,
  formatCurrency,
  formatNumber
} from '@/features/dashboard/lib/stats-utils';
import { CreateTripDialogButton } from '@/features/trips/components/create-trip-dialog-button';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const { trips, isLoading } = useTrips();

  const {
    tripsToday,
    revenueToday,
    tripsYesterday,
    revenueYesterday,
    tripsTrend,
    revenueTrend
  } = React.useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    const tToday = getTripsForDay(trips, today);
    const tYesterday = getTripsForDay(trips, yesterday);

    const rToday = calculateTotalRevenue(tToday);
    const rYesterday = calculateTotalRevenue(tYesterday);

    return {
      tripsToday: tToday,
      revenueToday: rToday,
      tripsYesterday: tYesterday,
      revenueYesterday: rYesterday,
      tripsTrend: calculateTrend(tToday.length, tYesterday.length),
      revenueTrend: calculateTrend(rToday, rYesterday)
    };
  }, [trips]);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Willkommen zurück 👋
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <CreateTripDialogButton />
          </div>
        </div>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <StatsCard
            title='Fahrten heute'
            value={formatNumber(tripsToday.length)}
            trend={tripsTrend}
            description='Geplante Fahrten für heute'
            isLoading={isLoading}
          />
          <StatsCard
            title='Umsatz heute'
            value={formatCurrency(revenueToday)}
            trend={revenueTrend}
            description='Gesamtumsatz der heutigen Fahrten'
            isLoading={isLoading}
          />
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Platzhalter</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                0,00
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +12,5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Platzhalter <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>Platzhalter</div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Wachstumsrate</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                0,00
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +4,5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Platzhalter <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>Platzhalter</div>
            </CardFooter>
          </Card>
        </div>
        <div className='flex flex-col gap-4 lg:grid lg:grid-cols-7 lg:items-start'>
          <div className='flex flex-col gap-4 lg:col-span-4'>
            <PendingToursWidget />
            {bar_stats}
            {area_stats}
          </div>
          <div className='flex flex-col gap-4 lg:col-span-3'>
            {sales}
            {pie_stats}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
