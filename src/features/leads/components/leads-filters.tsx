'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { STATUS_CONFIG } from './lead-status-badge';
import type { LeadStatus } from '@/types/api';

const STATUS_FILTER_OPTIONS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'nao_contatado', label: 'Não contatado' },
  { value: 'em_progresso', label: 'Em progresso' },
  { value: 'finalizado', label: 'Finalizado' }
];

const DOT_COLORS: Record<LeadStatus, string> = {
  nao_contatado: 'bg-red-500',
  em_progresso: 'bg-amber-500',
  finalizado: 'bg-emerald-500'
};

interface LeadsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeStatus: LeadStatus | 'all';
  onStatusChange: (v: LeadStatus | 'all') => void;
  counts: Record<LeadStatus | 'all', number>;
}

export function LeadsFilters({
  search,
  onSearchChange,
  activeStatus,
  onStatusChange,
  counts
}: LeadsFiltersProps) {
  return (
    <div className='space-y-3'>
      {/* Search */}
      <div className='relative'>
        <Icons.search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Buscar por empresa, contato ou serviço…'
          className='pl-9'
        />
      </div>

      {/* Status pills */}
      <div className='flex flex-wrap gap-2'>
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
          const isActive = activeStatus === value;
          const count = counts[value];
          return (
            <button
              key={value}
              onClick={() => onStatusChange(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {value !== 'all' && (
                <span
                  className={cn('size-2 rounded-full', DOT_COLORS[value as LeadStatus])}
                  aria-hidden
                />
              )}
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                  isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
