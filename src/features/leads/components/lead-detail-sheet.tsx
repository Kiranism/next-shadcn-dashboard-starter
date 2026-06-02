'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { LeadInfoSection } from './lead-info-section';
import { LeadContactsSection } from './lead-contacts-section';
import { LeadCommentsSection } from './lead-comments-section';
import { LeadFormSheet } from './lead-form-sheet';
import { LeadsRepository } from '@/repositories/leads.repository';
import { UserRepository } from '@/repositories/users.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { toUserMessage } from '@/lib/api-client';

interface LeadDetailSheetProps {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDetailSheet({ leadId, onClose }: LeadDetailSheetProps) {
  const { profile, rank } = useUserProfile();
  const { data: lead, isLoading } = LeadsRepository.useDetail(leadId);
  const deleteMutation = LeadsRepository.useDelete();
  const { data: creatorUser } = UserRepository.useOne(lead?.created_by ?? '');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDelete = lead && (lead.created_by === profile?.id || rank >= 3);

  function handleDelete() {
    if (!lead) return;
    deleteMutation.mutate(lead.id, {
      onSuccess: () => {
        toast.success('Lead removido.');
        setDeleteOpen(false);
        onClose();
      },
      onError: (err) => toast.error(toUserMessage(err))
    });
  }

  return (
    <>
      <Sheet open={!!leadId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side='right' className='flex w-full flex-col sm:max-w-xl overflow-hidden p-0'>
          {isLoading || !lead ? (
            <>
              <SheetHeader className='sr-only'>
                <SheetTitle>Detalhes do lead</SheetTitle>
              </SheetHeader>
              <div className='space-y-4 p-6'>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
              </div>
            </>
          ) : (
            <>
              <SheetHeader className='shrink-0 flex flex-row items-start justify-between gap-3 border-b px-6 py-4'>
                <div className='min-w-0'>
                  <SheetTitle className='text-lg leading-tight'>{lead.company_name}</SheetTitle>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    onClick={() => setEditOpen(true)}
                    aria-label='Editar lead'
                  >
                    <Icons.edit className='size-4' />
                  </Button>
                  {canDelete && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 text-destructive hover:text-destructive'
                      onClick={() => setDeleteOpen(true)}
                      aria-label='Excluir lead'
                    >
                      <Icons.trash className='size-4' />
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className='flex-1 overflow-y-auto px-6 py-4 space-y-6'>
                <LeadInfoSection lead={lead} />
                <Separator />
                <LeadContactsSection leadId={lead.id} contacts={lead.contacts} />
                <Separator />
                <LeadCommentsSection leadId={lead.id} comments={lead.comments} />
                <Separator />
                <p className='text-xs text-muted-foreground pb-2'>
                  Cadastrado por{' '}
                  <span className='font-medium text-foreground'>
                    {lead.created_by === profile?.id ? profile?.name : (creatorUser?.name ?? '–')}
                  </span>
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {lead && <LeadFormSheet open={editOpen} onOpenChange={setEditOpen} lead={lead} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              O lead <strong>{lead?.company_name}</strong> e todos os seus contatos e comentários
              serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
