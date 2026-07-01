import { Badge } from '@/components/ui/badge';
import type { SelectionProcessApplicationStatus } from '@/types/selection-process';

const config: Record<SelectionProcessApplicationStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800'
  },
  approved: {
    label: 'Aprovado',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
  },
  reproved: {
    label: 'Reprovado',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
  },
  waitlisted: {
    label: 'Lista de espera',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
  }
};

interface ApplicationStatusBadgeProps {
  status: SelectionProcessApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  );
}
