'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LeadContact } from '@/types/api';

interface ContactFormProps {
  contact?: LeadContact;
  onSave: (data: { name: string; role: string; email: string; phone: string }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ContactForm({ contact, onSave, onCancel, isPending }: ContactFormProps) {
  const [name, setName] = useState(contact?.name ?? '');
  const [role, setRole] = useState(contact?.role ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');

  const hasContact = email.trim() || phone.trim();
  const canSubmit = name.trim() && role.trim() && hasContact && !isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({ name: name.trim(), role: role.trim(), email: email.trim(), phone: phone.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3 rounded-lg border bg-muted/30 p-3'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label className='text-xs'>Nome *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Nome do contato'
            className='h-8 text-sm'
            disabled={isPending}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Cargo *</Label>
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder='Diretor, Gerente…'
            className='h-8 text-sm'
            disabled={isPending}
          />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1'>
          <Label className='text-xs'>E-mail</Label>
          <Input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='email@empresa.com'
            className='h-8 text-sm'
            disabled={isPending}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Telefone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='(81) 9 9999-9999'
            className='h-8 text-sm'
            disabled={isPending}
          />
        </div>
      </div>
      {!hasContact && (name || role) && (
        <p className='text-xs text-destructive'>Informe e-mail ou telefone.</p>
      )}
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type='submit' size='sm' disabled={!canSubmit} isLoading={isPending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
