import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SeverityBadge } from '@/features/violations/components/severity-badge';
import type { Norm } from '@/types/norms';

interface NormCardProps {
  norm: Norm;
  canEdit: boolean;
  onEdit: (norm: Norm) => void;
  onDelete: (norm: Norm) => void;
}

export function NormCard({ norm, canEdit, onEdit, onDelete }: NormCardProps) {
  return (
    <div className='group flex items-start justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex min-w-0 items-start gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted'>
          <Icons.post className='size-4 text-muted-foreground' />
        </div>
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-mono text-sm font-semibold text-muted-foreground'>
              {norm.code}
            </span>
            <SeverityBadge severity={norm.severity} />
          </div>
          <p className='text-sm leading-relaxed'>{norm.description}</p>
        </div>
      </div>
      {canEdit && (
        <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            onClick={() => onEdit(norm)}
            aria-label='Editar norma'
          >
            <Icons.edit className='size-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 text-destructive hover:text-destructive'
            onClick={() => onDelete(norm)}
            aria-label='Remover norma'
          >
            <Icons.trash className='size-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
