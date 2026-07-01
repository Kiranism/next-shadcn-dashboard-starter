import { Badge } from '@/components/ui/badge';
import type { CandidateStatus } from '@/types/selection-process';

const config: Record<CandidateStatus, { label: string; className: string }> = {
  active: {
    label: 'Ativo',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
  },
  approved: {
    label: 'Aprovado',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
  },
  eliminated: {
    label: 'Eliminado',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
  }
};

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
}

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  );
}
