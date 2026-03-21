'use client';

/**
 * Inline passenger entry — no popover.
 * - `first`: always visible (required first Fahrgast in a pickup group).
 * - `additional`: collapsed by default; expands to the same fields as the first row.
 */
import * as React from 'react';
import {
  Plus,
  User,
  MapPin,
  Navigation,
  X,
  Accessibility,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ClientAutoSuggest } from '@/components/ui/client-auto-suggest';
import { cn } from '@/lib/utils';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import type { PassengerEntry } from '@/features/trips/types';

export interface AddPassengerInlineProps {
  variant: 'first' | 'additional';
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

export function AddPassengerInline({
  variant,
  pickupGroupUid,
  searchClients,
  onAdd,
  onClientLinked,
  onAddressChoice,
  disabled = false
}: AddPassengerInlineProps) {
  /** Only used when `variant === 'additional'` (collapsible). */
  const [expanded, setExpanded] = React.useState(false);
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

  const finishAdditional = () => {
    if (variant === 'additional') {
      setExpanded(false);
    }
    reset();
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
    finishAdditional();
  };

  const handleAddressChoice = (type: 'pickup' | 'dropoff') => {
    if (pendingAddress && selectedClient && onAddressChoice) {
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
    finishAdditional();
  };

  const canAdd = firstName.trim().length > 0 || lastName.trim().length > 0;

  const formFields = (
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
          className='h-10 text-sm sm:h-8'
        />
      </div>

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
                className='h-9 flex-1 gap-1 text-[10px] sm:h-7'
                onClick={() => handleAddressChoice('pickup')}
              >
                <MapPin className='h-3 w-3 text-emerald-500' />
                Abholadresse
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-9 flex-1 gap-1 text-[10px] sm:h-7'
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
          'flex w-full items-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors sm:py-2',
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
        disabled={!canAdd || disabled}
        className='mt-1 h-10 text-sm sm:h-7 sm:text-xs'
      >
        Hinzufügen
      </Button>
    </div>
  );

  const shellClass =
    'rounded-lg border border-border/80 bg-muted/20 p-3 shadow-sm';

  if (variant === 'first') {
    return (
      <div
        className={cn(shellClass, disabled && 'pointer-events-none opacity-50')}
      >
        <div className='mb-3 flex items-center gap-1.5'>
          <User className='text-muted-foreground h-4 w-4' />
          <span className='text-sm font-semibold'>Erster Fahrgast</span>
          <span className='text-destructive text-xs font-normal'>*</span>
        </div>
        {formFields}
      </div>
    );
  }

  return (
    <Collapsible
      open={expanded}
      onOpenChange={(open) => {
        setExpanded(open);
        if (!open) reset();
      }}
    >
      <CollapsibleTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled}
          className='text-muted-foreground hover:text-foreground flex h-10 w-full items-center justify-between gap-2 text-sm sm:h-8 sm:text-xs'
        >
          <span className='flex items-center gap-2'>
            <Plus className='h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5' />
            Weiteren Fahrgast hinzufügen
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 overflow-hidden'>
        <div
          className={cn(
            shellClass,
            'mt-2',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <div className='mb-3 flex items-center gap-1.5'>
            <User className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-xs font-semibold'>Weiterer Fahrgast</span>
          </div>
          {formFields}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
