'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useTrips } from '@/features/trips/hooks/use-trips';
import { usePayers } from '@/features/payers/hooks/use-payers';
import { getPayerDistribution } from '@/features/dashboard/lib/payer-utils';
import { Skeleton } from '@/components/ui/skeleton';

export function PieGraph() {
  const { trips, isLoading: tripsLoading } = useTrips();
  const { data: payers, isLoading: payersLoading } = usePayers();

  const chartData = React.useMemo(() => {
    if (!trips || !payers) return [];
    return getPayerDistribution(trips, payers);
  }, [trips, payers]);

  const totalTrips = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: 'Fahrten'
      }
    };
    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill
      };
    });
    return config;
  }, [chartData]);

  const topPayer = chartData[0];

  if (tripsLoading || payersLoading) {
    return (
      <Card className='@container/card'>
        <CardHeader className='pb-2'>
          <Skeleton className='h-6 w-1/3' />
          <Skeleton className='h-4 w-1/4' />
        </CardHeader>
        <CardContent>
          <div className='flex h-[250px] items-center justify-center'>
            <Skeleton className='h-40 w-40 rounded-full' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Kostenträger-Verteilung</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Übersicht der Fahrten nach Versicherung/Kostenträger
            (Gesamtzeitraum)
          </span>
          <span className='@[540px]/card:hidden'>Kostenträger-Verteilung</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey='count'
              nameKey='name'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalTrips.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Gesamt Fahrten
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {topPayer && (
          <div className='flex items-center gap-2 leading-none font-medium'>
            {topPayer.name} ist Spitzenreiter mit{' '}
            {((topPayer.count / totalTrips) * 100).toFixed(1)}%{' '}
            <IconTrendingUp className='text-primary h-4 w-4' />
          </div>
        )}
        <div className='text-muted-foreground leading-none'>
          Basierend auf allen im System erfassten Fahrten
        </div>
      </CardFooter>
    </Card>
  );
}
