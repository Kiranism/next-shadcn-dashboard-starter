import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/api';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  nao_contatado: {
    label: 'Não contatado',
    color: 'bg-red-500',
    bg: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
  },
  em_progresso: {
    label: 'Em progresso',
    color: 'bg-amber-500',
    bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  },
  contatado: {
    label: 'Finalizado',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  }
};

interface LeadStatusDotProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusDot({ status, className }: LeadStatusDotProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn('size-3 rounded-full shrink-0', config.color, className)}
      aria-label={config.label}
      role='img'
    />
  );
}

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.color)} aria-hidden />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
