import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ReembolsoStatusBadge } from '../reembolso-status-badge';
import { ROLE_LABEL, SECTOR_LABEL } from '@/constants/user-options';
import type { Reimbursement, ReimbursementCategory } from '@/types/api';

const CATEGORY_LABEL: Record<ReimbursementCategory, string> = {
  alimentação: 'Alimentação',
  ingresso: 'Ingresso',
  transporte: 'Transporte',
  equipamento: 'Equipamento',
  outro: 'Outro'
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface ReembolsoControleCardProps {
  reimbursement: Reimbursement;
  userName: string;
  userRole: string;
  userSector: string | null;
  isPresidente: boolean;
  onApprove: (r: Reimbursement) => void;
  onReject: (r: Reimbursement) => void;
}

export function ReembolsoControleCard({
  reimbursement,
  userName,
  userRole,
  userSector,
  isPresidente,
  onApprove,
  onReject
}: ReembolsoControleCardProps) {
  const showActions = isPresidente && reimbursement.status === 'pending';

  return (
    <div className='rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-start gap-3'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold'>
          {getInitials(userName)}
        </div>

        <div className='min-w-0 flex-1'>
          {/* Header: name + status */}
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate font-medium leading-tight'>{userName}</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {ROLE_LABEL[userRole] ?? userRole}
                {userSector && <> · {SECTOR_LABEL[userSector] ?? userSector}</>}
              </p>
            </div>
            <ReembolsoStatusBadge status={reimbursement.status} />
          </div>

          {/* Content box */}
          <div className='mt-3 rounded-lg border bg-muted/30 px-3 py-2.5'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <p className='text-sm font-semibold leading-tight'>{reimbursement.title}</p>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'>
                    {CATEGORY_LABEL[reimbursement.category] ?? reimbursement.category}
                  </span>
                </div>
                {reimbursement.description && (
                  <p className='text-muted-foreground mt-1 text-xs leading-relaxed line-clamp-2'>
                    {reimbursement.description}
                  </p>
                )}
              </div>
              <p className='shrink-0 text-base font-bold tabular-nums'>
                {formatBRL(reimbursement.amount_cents)}
              </p>
            </div>

            <div className='mt-2 flex items-center gap-1 text-xs text-muted-foreground'>
              <Icons.calendar className='size-3' />
              <span>{formatDate(reimbursement.created_at)}</span>
            </div>
          </div>

          {/* Attachments */}
          {reimbursement.attachments.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1.5'>
              {reimbursement.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.signed_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted'
                >
                  <Icons.paperclip className='size-3 shrink-0' />
                  <span className='max-w-[120px] truncate'>{att.name}</span>
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
              <Button
                variant='outline'
                className='h-9 flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 sm:flex-none dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                onClick={() => onApprove(reimbursement)}
              >
                <Icons.check className='mr-1.5 size-3.5' />
                Aprovar
              </Button>
              <Button
                variant='outline'
                className='h-9 flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 sm:flex-none dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30'
                onClick={() => onReject(reimbursement)}
              >
                <Icons.close className='mr-1.5 size-3.5' />
                Recusar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
