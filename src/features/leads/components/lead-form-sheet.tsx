'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
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
import { ViacepAddressFields } from './viacep-address-fields';
import { ContactForm } from './contact-form';
import { LeadsRepository } from '@/repositories/leads.repository';
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { toUserMessage } from '@/lib/api-client';
import { formatCnpj, validateCnpj } from '@/lib/format-cnpj';
import type { Lead, LeadStatus } from '@/types/api';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'nao_contatado', label: 'Não contatado' },
  { value: 'em_progresso', label: 'Em progresso' },
  { value: 'contatado', label: 'Finalizado' }
];

interface AddressState {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface PendingContact {
  localId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

function emptyAddress(): AddressState {
  return {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  };
}

function leadToAddress(lead: Lead): AddressState {
  return {
    cep: lead.address_cep,
    logradouro: lead.address_logradouro,
    numero: lead.address_numero,
    complemento: lead.address_complemento ?? '',
    bairro: lead.address_bairro,
    cidade: lead.address_cidade,
    estado: lead.address_estado
  };
}

interface LeadFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

export function LeadFormSheet({ open, onOpenChange, lead }: LeadFormSheetProps) {
  const isEdit = !!lead;
  const createMutation = LeadsRepository.useCreate();
  const updateMutation = LeadsRepository.useUpdate();
  const createContact = LeadsRepository.useCreateContact();
  const { data: portfolioItems = [] } = PortfolioRepository.useList();

  const [companyName, setCompanyName] = useState(lead?.company_name ?? '');
  const [cnpj, setCnpj] = useState(lead?.cnpj ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? 'nao_contatado');
  const [selectedItems, setSelectedItems] = useState<string[]>(lead?.interest_items ?? []);
  const [address, setAddress] = useState<AddressState>(lead ? leadToAddress(lead) : emptyAddress());

  const [pendingContacts, setPendingContacts] = useState<PendingContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);

  const isPending = createMutation.isPending || updateMutation.isPending || createContact.isPending;
  const canSubmit =
    companyName.trim() &&
    validateCnpj(cnpj) &&
    address.logradouro.trim() &&
    address.numero.trim() &&
    address.bairro.trim() &&
    address.cidade.trim() &&
    address.estado.trim() &&
    (isEdit || pendingContacts.length > 0) &&
    !isPending;

  function handleAddressChange(field: keyof AddressState, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function toggleItem(item: string) {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function handleAddPendingContact(data: {
    name: string;
    role: string;
    email: string;
    phone: string;
  }) {
    setPendingContacts((prev) => [...prev, { localId: crypto.randomUUID(), ...data }]);
    setShowContactForm(false);
  }

  function removePendingContact(localId: string) {
    setPendingContacts((prev) => prev.filter((c) => c.localId !== localId));
  }

  function reset() {
    if (lead) {
      setCompanyName(lead.company_name);
      setCnpj(lead.cnpj);
      setStatus(lead.status);
      setSelectedItems(lead.interest_items);
      setAddress(leadToAddress(lead));
    } else {
      setCompanyName('');
      setCnpj('');
      setStatus('nao_contatado');
      setSelectedItems([]);
      setAddress(emptyAddress());
      setPendingContacts([]);
      setShowContactForm(false);
    }
  }

  function handleOpenChange(v: boolean) {
    if (!isPending) {
      reset();
      onOpenChange(v);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      company_name: companyName.trim(),
      cnpj,
      status,
      interest_items: selectedItems,
      address_cep: address.cep,
      address_logradouro: address.logradouro.trim(),
      address_numero: address.numero.trim(),
      address_complemento: address.complemento.trim() || undefined,
      address_bairro: address.bairro.trim(),
      address_cidade: address.cidade.trim(),
      address_estado: address.estado.trim()
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: lead.id, payload },
        {
          onSuccess: () => {
            toast.success('Lead atualizado.');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } else {
      try {
        const newLead = await createMutation.mutateAsync(payload);
        for (const contact of pendingContacts) {
          await createContact.mutateAsync({
            leadId: newLead.id,
            payload: {
              name: contact.name,
              role: contact.role,
              email: contact.email || undefined,
              phone: contact.phone || undefined
            }
          });
        }
        toast.success('Lead criado.');
        reset();
        onOpenChange(false);
      } catch (err) {
        toast.error(toUserMessage(err as Error));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>{isEdit ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='flex flex-1 flex-col gap-4 overflow-y-auto py-2 px-1'
        >
          {/* Company name */}
          <div className='space-y-1.5'>
            <Label htmlFor='lead-company'>Empresa *</Label>
            <Input
              id='lead-company'
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder='Nome da empresa'
              disabled={isPending}
            />
          </div>

          {/* CNPJ */}
          <div className='space-y-1.5'>
            <Label htmlFor='lead-cnpj'>CNPJ *</Label>
            <Input
              id='lead-cnpj'
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              placeholder='00.000.000/0000-00'
              disabled={isPending}
            />
            {cnpj.length > 0 && !validateCnpj(cnpj) && (
              <p className='text-xs text-destructive'>CNPJ inválido</p>
            )}
          </div>

          {/* Status */}
          <div className='space-y-1.5'>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger disabled={isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interest items */}
          {portfolioItems.length > 0 && (
            <div className='space-y-1.5'>
              <Label>Serviços de interesse</Label>
              <div className='flex flex-wrap gap-2'>
                {portfolioItems.map((item) => {
                  const selected = selectedItems.includes(item.name);
                  return (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => toggleItem(item.name)}
                      disabled={isPending}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contacts — only shown when creating */}
          {!isEdit && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Contatos</Label>
                {!showContactForm && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => setShowContactForm(true)}
                    disabled={isPending}
                  >
                    <Icons.add className='mr-1 size-3' />
                    Adicionar
                  </Button>
                )}
              </div>

              {pendingContacts.length > 0 && (
                <div className='space-y-2'>
                  {pendingContacts.map((contact) => (
                    <div
                      key={contact.localId}
                      className='flex items-start justify-between gap-2 rounded-lg border bg-card p-3'
                    >
                      <div className='min-w-0 space-y-0.5'>
                        <p className='text-sm font-medium'>
                          {contact.name}
                          {contact.role && (
                            <span className='text-muted-foreground font-normal'>
                              , {contact.role}
                            </span>
                          )}
                        </p>
                        {contact.phone && (
                          <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Icons.phone className='size-3' />
                            {contact.phone}
                          </p>
                        )}
                        {contact.email && (
                          <p className='text-xs text-muted-foreground truncate'>{contact.email}</p>
                        )}
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-7 shrink-0 text-destructive hover:text-destructive'
                        onClick={() => removePendingContact(contact.localId)}
                        disabled={isPending}
                        aria-label='Remover contato'
                      >
                        <Icons.trash className='size-3.5' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {showContactForm && (
                <ContactForm
                  onSave={handleAddPendingContact}
                  onCancel={() => setShowContactForm(false)}
                />
              )}

              {pendingContacts.length === 0 && !showContactForm && (
                <p className='text-xs text-destructive'>
                  Adicione pelo menos um contato para criar o lead.
                </p>
              )}
            </div>
          )}

          {/* Address */}
          <ViacepAddressFields
            values={address}
            onChange={handleAddressChange}
            disabled={isPending}
          />
        </form>

        <DialogFooter className='shrink-0 flex gap-2 pt-2 border-t'>
          <Button
            type='button'
            variant='outline'
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type='submit' disabled={!canSubmit} isLoading={isPending} onClick={handleSubmit}>
            {isEdit ? 'Salvar' : 'Criar Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
