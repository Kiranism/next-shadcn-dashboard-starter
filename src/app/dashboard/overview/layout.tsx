'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
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
import {
  StatsCard,
  StatsRowCard
} from '@/features/dashboard/components/stats-card';
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
        <div className='flex flex-row items-center justify-between gap-2'>
          <h2 className='min-w-0 flex-1 text-xl font-bold tracking-tight sm:text-2xl'>
            Hi, Willkommen zurück 👋
          </h2>
          <div className='shrink-0'>
            <CreateTripDialogButton />
          </div>
        </div>
        <div
          className='flex flex-col gap-2 md:hidden'
          role='region'
          aria-label='Kennzahlen heute'
        >
          <StatsRowCard
            title='Fahrten heute'
            value={formatNumber(tripsToday.length)}
            trend={tripsTrend}
            description='Geplante Fahrten für heute'
            isLoading={isLoading}
          />
          <StatsRowCard
            title='Umsatz heute'
            value={formatCurrency(revenueToday)}
            trend={revenueTrend}
            description='Gesamtumsatz der heutigen Fahrten'
            isLoading={isLoading}
          />
        </div>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card hidden grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4'>
          <StatsCard
            className='min-w-0'
            title='Fahrten heute'
            value={formatNumber(tripsToday.length)}
            trend={tripsTrend}
            description='Geplante Fahrten für heute'
            isLoading={isLoading}
          />
          <StatsCard
            className='min-w-0'
            title='Umsatz heute'
            value={formatCurrency(revenueToday)}
            trend={revenueTrend}
            description='Gesamtumsatz der heutigen Fahrten'
            isLoading={isLoading}
          />
          <Card className='@container/card hidden md:block'>
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
          <Card className='@container/card hidden md:block'>
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
            <div className='hidden gap-4 lg:flex lg:flex-col'>
              {React.Children.toArray(bar_stats)}
              {React.Children.toArray(area_stats)}
            </div>
          </div>
          <div className='flex flex-col gap-4 lg:col-span-3'>
            {React.Children.toArray(sales)}
            <div className='hidden lg:block'>
              {React.Children.toArray(pie_stats)}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
