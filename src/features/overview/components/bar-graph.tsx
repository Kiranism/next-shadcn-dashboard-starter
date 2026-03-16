'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrips } from '@/features/trips/hooks/use-trips';
import {
  getHourlyOccupancy,
  getWeeklyOccupancy,
  identifyPeakHours,
  getDayPart,
  type HourlyData,
  type WeeklyData
} from '@/features/dashboard/lib/occupancy-utils';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  count: {
    label: 'Fahrten Aktuell',
    color: 'var(--primary)'
  },
  average: {
    label: 'Durchschnitt (4 Wochen)',
    color: 'var(--muted-foreground)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const { trips, isLoading } = useTrips();
  const [view, setView] = React.useState<'hourly' | 'daily'>('hourly');

  const { data, peakIndices } = React.useMemo(() => {
    if (isLoading || !trips) return { data: [], peakIndices: [] };

    const processedData =
      view === 'hourly' ? getHourlyOccupancy(trips) : getWeeklyOccupancy(trips);

    const peaks = identifyPeakHours(processedData, 3);

    return {
      data: processedData.map((d) => ({
        ...d,
        dayPart: 'hour' in d ? getDayPart(d.hour) : ''
      })),
      peakIndices: peaks
    };
  }, [trips, isLoading, view]);

  if (isLoading) {
    return (
      <Card className='@container/card'>
        <CardHeader className='pb-2'>
          <Skeleton className='h-6 w-1/3' />
          <Skeleton className='h-4 w-1/4' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card h-full'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 border-b px-6 py-5 sm:border-b-0'>
          <CardTitle>Auslastungsanalyse</CardTitle>
          <CardDescription>
            {view === 'hourly'
              ? 'Effiziente Planung basierend auf Tageszeit-Segmenten'
              : 'Wöchentliche Auslastung im Vergleich zum Durchschnitt'}
          </CardDescription>
        </div>
        <div className='flex items-center px-6 py-4 sm:border-l'>
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as any)}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='hourly'>Stündlich</TabsTrigger>
              <TabsTrigger value='daily'>Täglich</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[300px] w-full'
        >
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillCount' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              opacity={0.3}
            />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={0}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
              content={
                <ChartTooltipContent
                  indicator='dashed'
                  labelFormatter={(val, items) => {
                    const item = items[0]?.payload as any;
                    return item?.dayPart ? `${val} (${item.dayPart})` : val;
                  }}
                />
              }
            />
            <Bar
              dataKey='average'
              fill='var(--muted-foreground)'
              fillOpacity={0.15}
              radius={[4, 4, 0, 0]}
              barSize={view === 'hourly' ? 16 : 64}
            />
            <Bar
              dataKey='count'
              radius={[4, 4, 0, 0]}
              barSize={view === 'hourly' ? 16 : 64}
            >
              {data.map((entry, index) => {
                const isPeak = peakIndices.includes(
                  'hour' in entry ? entry.hour : entry.day
                );
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isPeak ? 'var(--chart-2)' : 'url(#fillCount)'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className='text-muted-foreground mt-6 flex flex-wrap gap-4 px-2 text-xs'>
          <div className='flex items-center gap-1.5'>
            <div className='bg-muted-foreground h-3 w-3 rounded-full opacity-30' />
            <span>Normal (4w)</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='bg-primary h-3 w-3 rounded-full' />
            <span>Aktuell</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='h-3 w-3 rounded-full bg-[var(--chart-2)]' />
            <span>Peak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
