import type { Reimbursement } from '@/types/api';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ReembolsoSummaryProps {
  reimbursements: Reimbursement[];
}

export function ReembolsoSummary({ reimbursements }: ReembolsoSummaryProps) {
  const pending = reimbursements.filter((r) => r.status === 'pending').length;
  const approved = reimbursements.filter((r) => r.status === 'approved').length;
  const rejected = reimbursements.filter((r) => r.status === 'rejected').length;
  const totalApprovedCents = reimbursements
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount_cents, 0);

  return (
    <div className='flex gap-3 overflow-x-auto pb-1'>
      <div className='flex shrink-0 items-center gap-2 rounded-lg border bg-yellow-50 px-3 py-2 dark:bg-yellow-900/20'>
        <span className='size-2 rounded-full bg-yellow-400' />
        <span className='text-sm font-medium text-yellow-800 dark:text-yellow-400'>
          {pending} pendente{pending !== 1 ? 's' : ''}
        </span>
      </div>
      <div className='flex shrink-0 items-center gap-2 rounded-lg border bg-green-50 px-3 py-2 dark:bg-green-900/20'>
        <span className='size-2 rounded-full bg-green-500' />
        <span className='text-sm font-medium text-green-800 dark:text-green-400'>
          {approved} aprovado{approved !== 1 ? 's' : ''}
        </span>
      </div>
      <div className='flex shrink-0 items-center gap-2 rounded-lg border bg-red-50 px-3 py-2 dark:bg-red-900/20'>
        <span className='size-2 rounded-full bg-red-500' />
        <span className='text-sm font-medium text-red-800 dark:text-red-400'>
          {rejected} recusado{rejected !== 1 ? 's' : ''}
        </span>
      </div>
      {totalApprovedCents > 0 && (
        <div className='flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2'>
          <span className='text-muted-foreground text-sm'>Total aprovado:</span>
          <span className='text-sm font-semibold text-green-700 dark:text-green-400'>
            {formatBRL(totalApprovedCents)}
          </span>
        </div>
      )}
    </div>
  );
}
