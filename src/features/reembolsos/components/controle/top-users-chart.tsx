'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Icons } from '@/components/icons';

interface TopUsersChartProps {
  data: { name: string; total: number }[];
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CustomTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: { payload: { name: string; total: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 shadow-md text-sm'>
      <p className='font-medium'>{item.name}</p>
      <p className='text-muted-foreground'>{formatBRL(item.total)}</p>
    </div>
  );
}

const CHART_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#84cc16',
  '#14b8a6'
];

export function TopUsersChart({ data }: TopUsersChartProps) {
  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
        <Icons.receipt className='size-8 text-muted-foreground' />
        <p className='text-muted-foreground text-sm'>Nenhum reembolso aprovado</p>
      </div>
    );
  }

  return (
    <div className='h-[220px] w-full overflow-x-auto'>
      <ResponsiveContainer width='100%' height={220} minWidth={320}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' className='stroke-border' vertical={false} />
          <XAxis
            dataKey='name'
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => v.split(' ')[0]}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 100000
                ? `R$${(v / 100000).toFixed(0)}k`
                : v >= 100
                  ? `R$${(v / 100).toFixed(0)}`
                  : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
          <Bar dataKey='total' radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
