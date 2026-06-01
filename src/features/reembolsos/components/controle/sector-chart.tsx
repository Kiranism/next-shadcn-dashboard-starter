'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Icons } from '@/components/icons';
import type { ReimbursementCategory } from '@/types/api';

interface CategoryChartProps {
  data: { category: ReimbursementCategory; total: number }[];
}

const CATEGORY_LABEL: Record<ReimbursementCategory, string> = {
  alimentação: 'Alimentação',
  ingresso: 'Ingresso',
  transporte: 'Transporte',
  equipamento: 'Equipamento',
  outro: 'Outro'
};

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CustomTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: { payload: { category: ReimbursementCategory; total: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 shadow-md text-sm'>
      <p className='font-medium'>{CATEGORY_LABEL[item.category] ?? item.category}</p>
      <p className='text-muted-foreground'>{formatBRL(item.total)}</p>
    </div>
  );
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
        <Icons.receipt className='size-8 text-muted-foreground' />
        <p className='text-muted-foreground text-sm'>Nenhum reembolso aprovado por tipo</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: CATEGORY_LABEL[d.category] ?? d.category
  }));

  return (
    <div className='space-y-3'>
      <div className='h-[180px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              dataKey='total'
              nameKey='label'
              cx='50%'
              cy='50%'
              outerRadius={80}
              innerRadius={46}
              paddingAngle={3}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke='transparent'
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className='flex flex-wrap justify-center gap-x-4 gap-y-1.5'>
        {chartData.map((item, index) => (
          <div key={index} className='flex items-center gap-1.5 text-xs'>
            <span
              className='size-2.5 flex-shrink-0 rounded-full'
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className='text-muted-foreground'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
