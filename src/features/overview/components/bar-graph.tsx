'use client';

import { Bar, BarChart, XAxis } from 'recharts';

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
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 }
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)'
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Bar Chart - Multiple
          <Badge variant='outline'>
            <Icons.trendingDown />
            -5.2%
          </Badge>
        </CardTitle>
        <CardDescription>January - June 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <rect
              x='0'
              y='0'
              width='100%'
              height='85%'
              fill='url(#default-multiple-pattern-dots)'
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' hideLabel />}
            />
            <Bar
              dataKey='desktop'
              color='var(--chart-1)'
              fill='var(--color-desktop)'
              shape={<CustomHatchedBar isHatched={false} />}
              radius={4}
            />
            <Bar
              dataKey='mobile'
              fill='var(--color-mobile)'
              shape={<CustomHatchedBar />}
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    isHatched?: boolean;
  }
) => {
  const { fill, x, y, width, height, dataKey } = props;

  const isHatched = props.isHatched ?? true;

  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke='none'
        fill={isHatched ? `url(#hatched-bar-pattern-${dataKey})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={`hatched-bar-pattern-${dataKey}`}
          x='0'
          y='0'
          width='5'
          height='5'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(-45)'
        >
          <rect width='10' height='10' opacity={0.5} fill={fill}></rect>
          <rect width='1' height='10' fill={fill}></rect>
        </pattern>
      </defs>
    </>
  );
};
const DottedBackgroundPattern = () => {
  return (
    <pattern
      id='default-multiple-pattern-dots'
      x='0'
      y='0'
      width='10'
      height='10'
      patternUnits='userSpaceOnUse'
    >
      <circle
        className='dark:text-muted/40 text-muted'
        cx='2'
        cy='2'
        r='1'
        fill='currentColor'
      />
    </pattern>
  );
};
