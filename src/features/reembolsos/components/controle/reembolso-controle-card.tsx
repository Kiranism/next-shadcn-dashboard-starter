import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ReembolsoStatusBadge } from '../reembolso-status-badge';
import { ROLE_LABEL, SECTOR_LABEL } from '@/constants/user-options';
import type { Reimbursement } from '@/types/api';

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
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold'>
          {getInitials(userName)}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{userName}</p>
              <p className='text-muted-foreground text-xs'>
                {ROLE_LABEL[userRole] ?? userRole}
                {userSector && <> · {SECTOR_LABEL[userSector] ?? userSector}</>}
              </p>
            </div>
            <ReembolsoStatusBadge status={reimbursement.status} />
          </div>

          <div className='mt-3 rounded-md border bg-muted/20 px-3 py-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{reimbursement.title}</p>
                {reimbursement.description && (
                  <p className='text-muted-foreground mt-0.5 text-xs line-clamp-2'>
                    {reimbursement.description}
                  </p>
                )}
              </div>
              <span className='shrink-0 font-semibold tabular-nums'>
                {formatBRL(reimbursement.amount_cents)}
              </span>
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>
              Enviado em {formatDate(reimbursement.created_at)}
            </p>
          </div>

          {reimbursement.attachments.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1.5'>
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

          {showActions && (
            <div className='mt-3 flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30'
                onClick={() => onApprove(reimbursement)}
              >
                <Icons.check className='mr-1.5 size-3.5' />
                Aprovar
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30'
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
