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
import { NormsRepository } from '@/repositories/norms.repository';
import { ApiError, toUserMessage } from '@/lib/api-client';
import type { Norm } from '@/types/norms';

interface DeleteNormDialogProps {
  norm: Norm | null;
  onClose: () => void;
}

export function DeleteNormDialog({ norm, onClose }: DeleteNormDialogProps) {
  const deleteMutation = NormsRepository.useDelete();

  function handleConfirm() {
    if (!norm) return;
    deleteMutation.mutate(norm.id, {
      onSuccess: () => {
        toast.success('Norma removida.');
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          toast.error('Não é possível remover esta norma pois existem faltas associadas a ela.');
        } else {
          toast.error(toUserMessage(err));
        }
        onClose();
      }
    });
  }

  return (
    <AlertDialog open={!!norm} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover norma?</AlertDialogTitle>
          <AlertDialogDescription>
            A norma <strong>{norm?.code}</strong> será removida permanentemente do estatuto. Esta
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
