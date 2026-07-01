import { Icons } from '@/components/icons';
import { ReembolsoStatusBadge } from './reembolso-status-badge';
import type { Reimbursement, ReimbursementCategory } from '@/types/api';

const categoryConfig: Record<
  ReimbursementCategory,
  { label: string; icon: keyof typeof import('@/components/icons').Icons }
> = {
  ingresso: { label: 'Ingresso', icon: 'calendar' },
  alimentação: { label: 'Alimentação', icon: 'pizza' },
  transporte: { label: 'Transporte', icon: 'arrowRight' },
  equipamento: { label: 'Equipamento', icon: 'billing' },
  outro: { label: 'Outro', icon: 'receipt' }
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

interface ReembolsoCardProps {
  reimbursement: Reimbursement;
}

export function ReembolsoCard({ reimbursement }: ReembolsoCardProps) {
  const cat = categoryConfig[reimbursement.category] ?? {
    label: reimbursement.category,
    icon: 'receipt' as const
  };
  const CategoryIcon = Icons[cat.icon];

  return (
    <div className='rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 min-w-0'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted'>
            <CategoryIcon className='size-4 text-muted-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='truncate font-medium leading-tight'>{reimbursement.title}</p>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {cat.label} · {formatDate(reimbursement.created_at)}
            </p>
          </div>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1.5'>
          <span className='font-semibold tabular-nums'>
            {formatBRL(reimbursement.amount_cents)}
          </span>
          <ReembolsoStatusBadge status={reimbursement.status} />
        </div>
      </div>

      {reimbursement.description && (
        <p className='text-muted-foreground mt-3 text-sm'>{reimbursement.description}</p>
      )}

      {reimbursement.attachments.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {reimbursement.attachments.map((att) => (
            <a
              key={att.id}
              href={att.signed_url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs hover:bg-muted transition-colors'
            >
              <Icons.paperclip className='size-3' />
              {att.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
