'use client';

import { LabelList, Pie, PieChart } from 'recharts';

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
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' }
];

const chartConfig = {
  visitors: {
    label: 'Visitors'
  },
  chrome: {
    label: 'Chrome',
    color: 'var(--chart-1)'
  },
  safari: {
    label: 'Safari',
    color: 'var(--chart-2)'
  },
  firefox: {
    label: 'Firefox',
    color: 'var(--chart-3)'
  },
  edge: {
    label: 'Edge',
    color: 'var(--chart-4)'
  },
  other: {
    label: 'Other',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>
          Pie Chart
          <Badge variant='outline'>
            <Icons.trendingUp />
            +5.2%
          </Badge>
        </CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey='visitors' hideLabel />}
            />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey='visitors'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='visitors'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
