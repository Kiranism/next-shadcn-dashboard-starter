import { Badge } from '@/components/ui/badge';
import type { ReimbursementStatus } from '@/types/api';

const config: Record<ReimbursementStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
  },
  approved: {
    label: 'Aprovado',
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
  },
  rejected: {
    label: 'Recusado',
    className:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
  }
};

interface ReembolsoStatusBadgeProps {
  status: ReimbursementStatus;
}

export function ReembolsoStatusBadge({ status }: ReembolsoStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  );
}
