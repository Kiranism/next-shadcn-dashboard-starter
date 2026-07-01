import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NormSeverity } from '@/types/norms';

const severityConfig: Record<NormSeverity, { label: string; className: string }> = {
  leve: {
    label: 'Leve',
    className:
      'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  },
  moderada: {
    label: 'Moderada',
    className:
      'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
  },
  grave: {
    label: 'Grave',
    className:
      'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
  },
  desligamento: {
    label: 'Desligamento',
    className: 'border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
  }
};

interface SeverityBadgeProps {
  severity: NormSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
