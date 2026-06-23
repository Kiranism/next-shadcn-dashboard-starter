'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { MyInterviewSlot } from '@/types/selection-process';

const MEET_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

const TZ = 'America/Sao_Paulo';
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
}

interface Props {
  slot: MyInterviewSlot | null;
  onOpenChange: (open: boolean) => void;
}

export function SendMeetLinkDialog({ slot, onOpenChange }: Props) {
  const [link, setLink] = useState('');
  const mutation = SelectionProcessRepository.useSendMeetLink();

  const isValid = MEET_REGEX.test(link.trim());
  const open = slot !== null;

  function handleClose() {
    setLink('');
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!slot?.booking_id || !isValid) return;
    mutation.mutate(
      { booking_id: slot.booking_id, meet_link: link.trim() },
      {
        onSuccess: () => {
          toast.success('Link do Google Meet enviado ao candidato!');
          handleClose();
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Enviar link do Google Meet</DialogTitle>
          <DialogDescription className='space-y-0.5'>
            {slot?.candidate_name && (
              <span className='block font-medium text-foreground'>{slot.candidate_name}</span>
            )}
            {slot && <span className='block capitalize'>{fmt(slot.starts_at)}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div>
            <label className='text-sm font-medium block mb-1.5'>Link da reunião</label>
            <input
              type='url'
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
              placeholder='https://meet.google.com/abc-defg-hij'
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                link && !isValid && 'border-destructive focus:ring-destructive/40'
              )}
            />
            {link && !isValid && (
              <p className='text-xs text-destructive mt-1.5'>
                Formato inválido. Use: https://meet.google.com/xxx-xxxx-xxx
              </p>
            )}
          </div>

          {/* Preview */}
          {isValid && (
            <div className='flex items-center gap-2.5 rounded-lg bg-muted/50 border px-3 py-2.5'>
              <Icons.video className='size-4 text-primary shrink-0' />
              <span className='text-sm text-muted-foreground truncate'>{link.trim()}</span>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button disabled={!isValid || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 size-4 animate-spin' />
                Enviando…
              </>
            ) : (
              <>
                <Icons.send className='mr-2 size-4' />
                Enviar por e-mail
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
