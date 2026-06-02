'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Icons } from '@/components/icons';
import { ContactForm } from './contact-form';
import { LeadsRepository } from '@/repositories/leads.repository';
import { toUserMessage } from '@/lib/api-client';
import type { LeadContact } from '@/types/api';

interface LeadContactsSectionProps {
  leadId: string;
  contacts: LeadContact[];
}

export function LeadContactsSection({ leadId, contacts }: LeadContactsSectionProps) {
  const createContact = LeadsRepository.useCreateContact();
  const updateContact = LeadsRepository.useUpdateContact();
  const deleteContact = LeadsRepository.useDeleteContact();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<LeadContact | null>(null);

  function handleAdd(data: { name: string; role: string; email: string; phone: string }) {
    createContact.mutate(
      {
        leadId,
        payload: {
          name: data.name,
          role: data.role,
          email: data.email || undefined,
          phone: data.phone || undefined
        }
      },
      {
        onSuccess: () => {
          toast.success('Contato adicionado.');
          setShowAddForm(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleUpdate(
    contactId: string,
    data: { name: string; role: string; email: string; phone: string }
  ) {
    updateContact.mutate(
      {
        leadId,
        contactId,
        payload: {
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null
        }
      },
      {
        onSuccess: () => {
          toast.success('Contato atualizado.');
          setEditingId(null);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleDelete(contact: LeadContact) {
    deleteContact.mutate(
      { leadId, contactId: contact.id },
      {
        onSuccess: () => {
          toast.success('Contato removido.');
          setDeletingContact(null);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Contatos</h3>
        <Button
          variant='outline'
          size='sm'
          className='h-7 text-xs'
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
        >
          <Icons.add className='mr-1 size-3' />
          Adicionar
        </Button>
      </div>

      {showAddForm && (
        <ContactForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          isPending={createContact.isPending}
        />
      )}

      {contacts.length === 0 && !showAddForm ? (
        <p className='text-sm text-muted-foreground italic'>Nenhum contato cadastrado.</p>
      ) : (
        <div className='space-y-2'>
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <ContactForm
                key={contact.id}
                contact={contact}
                onSave={(data) => handleUpdate(contact.id, data)}
                onCancel={() => setEditingId(null)}
                isPending={updateContact.isPending}
              />
            ) : (
              <div
                key={contact.id}
                className='group flex items-start justify-between gap-2 rounded-lg border bg-card p-3'
              >
                <div className='min-w-0 space-y-0.5'>
                  <p className='text-sm font-medium'>
                    {contact.name}
                    {contact.role && (
                      <span className='text-muted-foreground font-normal'>, {contact.role}</span>
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
                <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    onClick={() => setEditingId(contact.id)}
                    aria-label='Editar contato'
                  >
                    <Icons.edit className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7 text-destructive hover:text-destructive'
                    onClick={() => setDeletingContact(contact)}
                    aria-label='Remover contato'
                  >
                    <Icons.trash className='size-3.5' />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <AlertDialog open={!!deletingContact} onOpenChange={(v) => !v && setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contato?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingContact?.name} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContact.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContact && handleDelete(deletingContact)}
              disabled={deleteContact.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
