# Charts & Analytics Guide

## Table of Contents

1. [Overview Architecture](#overview-architecture)
2. [Parallel Routes Pattern](#parallel-routes-pattern)
3. [Chart Components](#chart-components)
4. [Stats Cards](#stats-cards)
5. [Skeleton Loading](#skeleton-loading)
6. [Adding a New Chart Section](#adding-a-new-chart-section)

---

## Overview Architecture

The analytics dashboard at `/dashboard/overview` uses **Next.js parallel routes** to load multiple chart sections independently. Each chart slot streams in as its data becomes ready — no waterfall, no blocking.

**File structure:**

```
src/app/dashboard/overview/
├── layout.tsx              # Composes all slots into a grid
├── @area_stats/
│   ├── page.tsx            # Async server component (fetches data)
│   ├── loading.tsx         # Skeleton shown while streaming
│   └── error.tsx           # Error boundary if fetch fails
├── @bar_stats/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── @pie_stats/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
└── @sales/
    ├── page.tsx
    ├── loading.tsx
    └── error.tsx

src/features/overview/components/
├── area-graph.tsx          # Client chart component
├── area-graph-skeleton.tsx # Matching skeleton
├── bar-graph.tsx
├── bar-graph-skeleton.tsx
├── pie-graph.tsx
├── pie-graph-skeleton.tsx
├── recent-sales.tsx
└── recent-sales-skeleton.tsx
```

---

## Parallel Routes Pattern

### Layout (`layout.tsx`)

The layout receives each parallel route as a prop and arranges them in a grid:

```tsx
export default function OverviewLayout({
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
  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Overview analytics.'>
      {/* Stats cards row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <Icons.billing className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>$45,231.89</div>
            <p className='text-xs text-muted-foreground'>+20.1% from last month</p>
          </CardContent>
        </Card>
        {/* ...more stat cards */}
      </div>

      {/* Charts grid — each slot loads independently */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-4'>{area_stats}</div>
        <div className='col-span-3'>{sales}</div>
        <div className='col-span-4'>{bar_stats}</div>
        <div className='col-span-3'>{pie_stats}</div>
      </div>
    </PageContainer>
  );
}
```

### Slot Page (`@area_stats/page.tsx`)

Each slot is an async server component that fetches data then renders the chart:

```tsx
import { delay } from '@/constants/mock-api';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStatsPage() {
  await delay(2000); // Simulates API fetch
  return <AreaGraph />;
}
```

### Slot Loading (`@area_stats/loading.tsx`)

```tsx
import { AreaGraphSkeleton } from '@/features/overview/components/area-graph-skeleton';

export default function Loading() {
  return <AreaGraphSkeleton />;
}
```

### Slot Error (`@area_stats/error.tsx`)

```tsx
'use client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

export default function AreaStatsError({ error }: { error: Error }) {
  return (
    <Alert variant='destructive'>
      <Icons.alertCircle className='h-4 w-4' />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Failed to load area stats: {error.message}</AlertDescription>
    </Alert>
  );
}
```

Each slot can fail independently without affecting others.

---

## Chart Components

All chart components are `'use client'` and use **Recharts** wrapped in shadcn's `ChartContainer`.

### Chart Config

Every chart defines a config object mapping data keys to labels and theme colors:

```tsx
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile: { label: 'Mobile', color: 'var(--chart-2)' }
} satisfies ChartConfig;
```

Theme colors `--chart-1` through `--chart-5` are defined in each theme's CSS file and automatically adapt to light/dark mode.

### Area Chart Example

```tsx
'use client';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 }
  // ...more months
];

const chartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile: { label: 'Mobile', color: 'var(--chart-2)' }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <Badge variant='outline'>
          <Icons.trendingUp className='mr-1 h-3 w-3' /> +12.5%
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
            <Area
              dataKey='mobile'
              type='natural'
              fill='var(--color-mobile)'
              stroke='var(--color-mobile)'
              stackId='a'
            />
            <Area
              dataKey='desktop'
              type='natural'
              fill='var(--color-desktop)'
              stroke='var(--color-desktop)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Bar Chart Pattern

Same structure, using `BarChart` + `Bar`:

```tsx
<ChartContainer config={chartConfig}>
  <BarChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey='month' tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey='desktop' fill='var(--color-desktop)' radius={4} />
    <Bar dataKey='mobile' fill='var(--color-mobile)' radius={4} />
  </BarChart>
</ChartContainer>
```

### Pie/Donut Chart Pattern

```tsx
<ChartContainer config={chartConfig}>
  <PieChart>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
    <Pie data={chartData} dataKey='visitors' nameKey='browser' innerRadius={30}>
      <LabelList dataKey='visitors' className='fill-background' />
    </Pie>
  </PieChart>
</ChartContainer>
```

---

## Stats Cards

Stats cards are simple server-rendered `Card` components at the top of the layout — no parallel routes needed since they render instantly:

```tsx
<Card>
  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
    <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
    <Icons.billing className='h-4 w-4 text-muted-foreground' />
  </CardHeader>
  <CardContent>
    <div className='text-2xl font-bold'>$45,231.89</div>
    <p className='text-xs text-muted-foreground'>+20.1% from last month</p>
  </CardContent>
</Card>
```

For dynamic stats that need data fetching, wrap in their own Suspense boundary or parallel route slot.

---

## Skeleton Loading

Each chart has a matching skeleton component. Pattern:

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AreaGraphSkeleton() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <Skeleton className='h-5 w-[140px]' />
        <Skeleton className='h-4 w-[80px]' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-[250px] w-full rounded-md' />
      </CardContent>
    </Card>
  );
}
```

Match the skeleton dimensions to the actual chart for smooth visual transitions.

---

## Adding a New Chart Section

To add a new chart (e.g., line chart for user growth):

### 1. Create the chart component

`src/features/overview/components/line-graph.tsx`:

```tsx
'use client';
import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartConfig = {
  users: { label: 'Users', color: 'var(--chart-3)' }
} satisfies ChartConfig;

const chartData = [
  /* monthly user data */
];

export function LineGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='month' tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey='users' type='monotone' stroke='var(--color-users)' strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### 2. Create matching skeleton

`src/features/overview/components/line-graph-skeleton.tsx`

### 3. Create parallel route slot

```
src/app/dashboard/overview/@line_stats/
├── page.tsx     → async, fetches data, returns <LineGraph />
├── loading.tsx  → returns <LineGraphSkeleton />
├── error.tsx    → error alert
└── default.tsx  → return null (fallback when route doesn't match)
```

`default.tsx` is required for parallel routes — return `null` or a fallback:

```tsx
export default function Default() {
  return null;
}
```

### 4. Add slot to layout

Update `src/app/dashboard/overview/layout.tsx`:

```tsx
export default function OverviewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats,
  line_stats // ← add new slot
}: {
  /* ...types */
}) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
      {/* existing charts */}
      <div className='col-span-4'>{line_stats}</div>
    </div>
  );
}
```

### Available Recharts Components

Common chart types to use with `ChartContainer`:

- `AreaChart` + `Area` — filled area charts (stacked or standalone)
- `BarChart` + `Bar` — vertical/horizontal bars
- `LineChart` + `Line` — line/trend charts
- `PieChart` + `Pie` — pie/donut charts
- `RadarChart` + `Radar` — radar/spider charts
- `RadialBarChart` + `RadialBar` — radial progress bars

All support `ChartTooltip`, `ChartLegend`, and theme-aware colors via `var(--chart-N)`.
