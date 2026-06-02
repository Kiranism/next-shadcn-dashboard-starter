'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhone } from '@/lib/format-phone';
import type { LeadContact } from '@/types/api';

interface ContactFormProps {
  contact?: LeadContact;
  onSave: (data: { name: string; role: string; email: string; phone: string }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

export function ContactForm({ contact, onSave, onCancel, isPending }: ContactFormProps) {
  const [name, setName] = useState(contact?.name ?? '');
  const [role, setRole] = useState(contact?.role ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ? formatPhone(contact.phone) : '');
  const [phoneTouched, setPhoneTouched] = useState(false);

  const phoneProvided = phone.trim().length > 0;
  const phoneValid = !phoneProvided || isValidPhone(phone);
  const hasContact = email.trim() || phoneProvided;
  const canSubmit = name.trim() && role.trim() && hasContact && phoneValid && !isPending;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSave({
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, '')
    });
  }

  const showPhoneError = phoneTouched && phoneProvided && !phoneValid;

  return (
    <div className='space-y-3 rounded-lg border bg-muted/30 p-3'>
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
            onChange={handlePhoneChange}
            onBlur={() => setPhoneTouched(true)}
            placeholder='(81) 99999-9999'
            className={`h-8 text-sm${showPhoneError ? ' border-destructive' : ''}`}
            inputMode='numeric'
            disabled={isPending}
          />
          {showPhoneError && <p className='text-xs text-destructive'>Número inválido.</p>}
        </div>
      </div>
      {!hasContact && (name || role) && (
        <p className='text-xs text-destructive'>Informe e-mail ou telefone.</p>
      )}
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!canSubmit}
          isLoading={isPending}
          onClick={handleSubmit}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
