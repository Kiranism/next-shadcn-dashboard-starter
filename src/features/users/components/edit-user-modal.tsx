'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { UserRepository } from '@/repositories/users.repository';
import { toUserMessage } from '@/lib/api-client';
import { ROLE_OPTIONS, SECTOR_OPTIONS } from '@/constants/user-options';
import type { UserResponse } from '@/types/api';

const NONE = '__none__';

interface EditUserModalProps {
  user: UserResponse | null;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const mutation = UserRepository.useUpdateOne();
  const deleteMutation = UserRepository.useDeleteOne();

  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [sector, setSector] = useState(user?.sector ?? NONE);
  const [cpf, setCpf] = useState(user?.cpf ?? '');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setSector(user.sector ?? NONE);
      setCpf(user.cpf ?? '');
    }
  }, [user?.id]);

  function handleSave() {
    if (!user) return;
    mutation.mutate(
      {
        id: user.id,
        data: {
          name: name.trim() || undefined,
          role: role || undefined,
          sector: sector === NONE ? null : sector,
          cpf: cpf.trim() || null
        }
      },
      {
        onSuccess: () => {
          toast.success('Usuário atualizado com sucesso');
          onClose();
        },
        onError: (err: Error) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleDelete() {
    if (!user) return;
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success('Usuário desativado com sucesso');
        onClose();
      },
      onError: (err: Error) => toast.error(toUserMessage(err))
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={!!user} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='edit-name'>Nome</Label>
            <Input
              id='edit-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Nome completo'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>Cargo</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder='Selecione um cargo' />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>Setor</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger>
                <SelectValue placeholder='Sem setor' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem setor</SelectItem>
                {SECTOR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='edit-cpf'>CPF</Label>
            <Input
              id='edit-cpf'
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder='000.000.000-00 (opcional)'
            />
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                className='mr-auto'
                disabled={mutation.isPending || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Icons.spinner className='mr-2 size-4 animate-spin' />
                ) : null}
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja desativar <strong>{user?.name}</strong>? O usuário não
                  poderá mais acessar o sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  Desativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant='ghost'
            onClick={onClose}
            disabled={mutation.isPending || deleteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending || deleteMutation.isPending}>
            {mutation.isPending ? <Icons.spinner className='mr-2 size-4 animate-spin' /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
