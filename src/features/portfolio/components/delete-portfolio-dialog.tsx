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
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { toUserMessage } from '@/lib/api-client';
import type { PortfolioItem } from '@/types/api';

interface DeletePortfolioDialogProps {
  item: PortfolioItem | null;
  onClose: () => void;
}

export function DeletePortfolioDialog({ item, onClose }: DeletePortfolioDialogProps) {
  const deleteMutation = PortfolioRepository.useDelete();

  function handleConfirm() {
    if (!item) return;
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        toast.success('Serviço removido.');
        onClose();
      },
      onError: (err) => toast.error(toUserMessage(err))
    });
  }

  return (
    <AlertDialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
          <AlertDialogDescription>
            O serviço <strong>{item?.name}</strong> será removido permanentemente do portfólio. Esta
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
