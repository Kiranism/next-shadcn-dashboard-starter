'use client';

import * as React from 'react';
import { Plus, User, MapPin, Navigation, X, Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ClientAutoSuggest } from '@/components/ui/client-auto-suggest';
import { cn } from '@/lib/utils';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import type { PassengerEntry } from '@/features/trips/types';

interface AddPassengerPopoverProps {
  pickupGroupUid: string;
  searchClients: (query: string) => Promise<ClientOption[]>;
  onAdd: (
    passenger: Omit<
      PassengerEntry,
      'pickup_station' | 'dropoff_group_uid' | 'dropoff_station'
    >
  ) => void;
  onClientLinked?: (client: ClientOption | null) => void;
  onAddressChoice?: (
    payload: {
      address: string;
      street: string;
      street_number: string;
      zip_code: string;
      city: string;
    },
    type: 'pickup' | 'dropoff',
    pickupGroupUid: string
  ) => void;
  disabled?: boolean;
}

export function AddPassengerPopover({
  pickupGroupUid,
  searchClients,
  onAdd,
  onClientLinked,
  onAddressChoice,
  disabled = false
}: AddPassengerPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [isWheelchair, setIsWheelchair] = React.useState(false);
  const [selectedClient, setSelectedClient] =
    React.useState<ClientOption | null>(null);
  const [pendingAddress, setPendingAddress] = React.useState<string | null>(
    null
  );

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setIsWheelchair(false);
    setSelectedClient(null);
    setPendingAddress(null);
  };

  const handleClientSelect = (client: ClientOption | null) => {
    setSelectedClient(client);
    if (client) {
      setFirstName(client.first_name || '');
      setLastName(client.last_name || '');
      setPhone(client.phone || '');
      const addr = [
        `${client.street} ${client.street_number}`.trim(),
        `${client.zip_code} ${client.city}`.trim()
      ]
        .filter(Boolean)
        .join(', ');
      setPendingAddress(addr || null);
    } else {
      setPendingAddress(null);
    }
  };

  const handleAdd = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst && !trimmedLast) return;
    onAdd({
      uid: crypto.randomUUID(),
      client_id: selectedClient?.id,
      first_name: trimmedFirst,
      last_name: trimmedLast,
      phone: phone.trim() || undefined,
      pickup_group_uid: pickupGroupUid,
      is_wheelchair: isWheelchair
    });
    if (selectedClient) onClientLinked?.(selectedClient);
    reset();
    setOpen(false);
  };

  const handleAddressChoice = (type: 'pickup' | 'dropoff') => {
    if (pendingAddress && selectedClient && onAddressChoice) {
      // 1) Add the passenger based on the selected client (so the name appears in the Fahrgast list)
      const trimmedFirst = (selectedClient.first_name || '').trim();
      const trimmedLast = (selectedClient.last_name || '').trim();

      onAdd({
        uid: crypto.randomUUID(),
        client_id: selectedClient.id,
        first_name: trimmedFirst || selectedClient.company_name || '',
        last_name: trimmedLast,
        phone: selectedClient.phone || undefined,
        pickup_group_uid: pickupGroupUid,
        is_wheelchair: isWheelchair
      });
      onClientLinked?.(selectedClient);

      // 2) Fill the address fields in the trip form
      onAddressChoice(
        {
          address: pendingAddress,
          street: selectedClient.street,
          street_number: selectedClient.street_number,
          zip_code: selectedClient.zip_code,
          city: selectedClient.city
        },
        type,
        pickupGroupUid
      );
    }
    setPendingAddress(null);
    setOpen(false);
    reset();
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  const canAdd = firstName.trim().length > 0 || lastName.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={disabled}
          className='text-muted-foreground hover:text-foreground h-7 gap-1 text-xs'
        >
          <Plus className='h-3.5 w-3.5' />
          Fahrgast
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 p-3' align='start' side='bottom'>
        <div className='mb-3 flex items-center gap-1.5'>
          <User className='text-muted-foreground h-3.5 w-3.5' />
          <span className='text-xs font-semibold'>Fahrgast hinzufügen</span>
        </div>
        <div className='flex flex-col gap-2'>
          <div>
            <Label className='text-muted-foreground mb-1 block text-[10px]'>
              Vorname
            </Label>
            <ClientAutoSuggest
              value={firstName}
              onNameChange={(val) => {
                setFirstName(val);
                if (!val) setPendingAddress(null);
              }}
              onSelect={handleClientSelect}
              searchClients={searchClients}
              placeholder='Vorname suchen...'
              getDisplayValue={(c) => c.first_name || c.company_name || ''}
            />
          </div>
          <div>
            <Label className='text-muted-foreground mb-1 block text-[10px]'>
              Nachname
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canAdd && handleAdd()}
              placeholder='Nachname...'
              className='h-8 text-sm'
            />
          </div>

          {/* Address choice prompt — shown only when a client with an address is selected */}
          {pendingAddress && (
            <>
              <Separator />
              <div className='bg-muted/40 rounded-md border p-2'>
                <div className='mb-2 flex items-start justify-between gap-1'>
                  <p className='text-muted-foreground text-[10px] font-medium'>
                    Adresse übernehmen?
                  </p>
                  <button
                    type='button'
                    onClick={() => setPendingAddress(null)}
                    className='text-muted-foreground hover:text-foreground shrink-0'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
                <p className='text-foreground mb-2 truncate text-[10px]'>
                  {pendingAddress}
                </p>
                <div className='flex gap-1.5'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 flex-1 gap-1 text-[10px]'
                    onClick={() => handleAddressChoice('pickup')}
                  >
                    <MapPin className='h-3 w-3 text-emerald-500' />
                    Abholadresse
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 flex-1 gap-1 text-[10px]'
                    onClick={() => handleAddressChoice('dropoff')}
                  >
                    <Navigation className='h-3 w-3 text-rose-500' />
                    Zieladresse
                  </Button>
                </div>
              </div>
            </>
          )}

          <button
            type='button'
            onClick={() => setIsWheelchair((v) => !v)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors',
              isWheelchair
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <Accessibility className='h-3.5 w-3.5 shrink-0' />
            <span className='flex-1 text-left'>Rollstuhl</span>
            <span
              className={cn(
                'text-[10px] font-medium',
                isWheelchair ? 'text-rose-500' : 'text-muted-foreground'
              )}
            >
              {isWheelchair ? 'Ja' : 'Nein'}
            </span>
          </button>

          <Button
            type='button'
            size='sm'
            onClick={handleAdd}
            disabled={!canAdd}
            className='mt-1 h-7 text-xs'
          >
            Hinzufügen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
