'use client';

import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { toUserMessage } from '@/lib/api-client';
import type { Reimbursement } from '@/types/api';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface StatusUpdateDialogProps {
  reimbursement: Reimbursement | null;
  action: 'approved' | 'rejected' | null;
  onClose: () => void;
}

export function StatusUpdateDialog({ reimbursement, action, onClose }: StatusUpdateDialogProps) {
  const updateMutation = ReembolsosRepository.useUpdateStatus();
  const isOpen = !!reimbursement && !!action;

  function handleConfirm() {
    if (!reimbursement || !action) return;
    updateMutation.mutate(
      { id: reimbursement.id, payload: { status: action } },
      {
        onSuccess: () => {
          toast.success(action === 'approved' ? 'Reembolso aprovado.' : 'Reembolso recusado.');
          onClose();
        },
        onError: (err) => {
          toast.error(toUserMessage(err));
          onClose();
        }
      }
    );
  }

  if (!reimbursement || !action) return null;

  const isApprove = action === 'approved';

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApprove ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-2 text-sm'>
              <p>
                {isApprove
                  ? 'Você está prestes a aprovar a seguinte solicitação de reembolso:'
                  : 'Você está prestes a recusar a seguinte solicitação de reembolso:'}
              </p>
              <div className='rounded-md border bg-muted/40 px-3 py-2'>
                <p className='font-medium text-foreground'>{reimbursement.title}</p>
                <p className='text-muted-foreground'>{formatBRL(reimbursement.amount_cents)}</p>
              </div>
              <p className='text-muted-foreground'>Esta ação não pode ser desfeita.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateMutation.isPending}
            className={
              isApprove
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }
          >
            {isApprove ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
