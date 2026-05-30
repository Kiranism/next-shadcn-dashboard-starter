'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { NotificationsRepository } from '@/repositories/notifications.repository';
import { toUserMessage } from '@/lib/api-client';
import { ROLE_OPTIONS, SECTOR_OPTIONS } from '@/constants/user-options';

const ALL = '__all__';

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNotificationDialog({ open, onOpenChange }: SendNotificationDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [titleError, setTitleError] = useState('');

  const mutation = NotificationsRepository.useSendNotification();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTitle('');
      setDescription('');
      setSector(ALL);
      setRole(ALL);
      setTitleError('');
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError('O título é obrigatório.');
      return;
    }
    setTitleError('');

    const target: { sector?: string; role?: string } = {};
    if (sector !== ALL) target.sector = sector;
    if (role !== ALL) target.role = role;

    mutation.mutate(
      { title: title.trim(), description: description.trim() || undefined, target },
      {
        onSuccess: ({ count }) => {
          if (count === 0) {
            toast.info('Nenhum usuário correspondeu ao filtro selecionado.');
          } else {
            toast.success(`Notificação enviada para ${count} usuário${count !== 1 ? 's' : ''}.`);
          }
          handleOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Enviar Notificação</DialogTitle>
          <DialogDescription>
            Crie uma notificação dirigida para um grupo de colaboradores por setor ou cargo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='notif-title'>Título *</Label>
            <Input
              id='notif-title'
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError('');
              }}
              placeholder='Ex.: Reunião geral amanhã às 10h'
              aria-invalid={!!titleError}
            />
            {titleError && <p className='text-destructive text-xs'>{titleError}</p>}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='notif-description'>Descrição</Label>
            <Textarea
              id='notif-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Detalhes adicionais (opcional)'
              rows={3}
              className='resize-none'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Setor</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os setores</SelectItem>
                  {SECTOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label>Cargo</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os cargos</SelectItem>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Icons.spinner className='mr-2 size-4 animate-spin' />
              ) : (
                <Icons.send className='mr-2 size-4' />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
