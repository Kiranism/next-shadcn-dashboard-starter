'use client';

/**
 * Inline passenger entry — no nested card; sits in the AddressGroupCard column.
 * - `first`: compact always-on block (required first Fahrgast).
 * - `additional`: collapsible row for further passengers.
 * Address apply-from-client (Abhol-/Zieladresse) is gated separately from passenger entry
 * via `disableApplyClientAddressToPickup` / `disableApplyClientAddressToDropoff`.
 */
import * as React from 'react';
import {
  Plus,
  MapPin,
  Navigation,
  X,
  Accessibility,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ClientAutoSuggest } from '@/components/ui/client-auto-suggest';
import { cn } from '@/lib/utils';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import type { PassengerEntry } from '@/features/trips/types';

const compactInput =
  'h-9 min-h-9 text-base py-2 min-w-0 sm:h-7 sm:min-h-0 sm:text-[11px] sm:py-1';

function WheelchairHeaderToggle({
  isWheelchair,
  onToggle,
  disabled
}: {
  isWheelchair: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      disabled={disabled}
      title='Rollstuhl'
      aria-label='Rollstuhl'
      aria-pressed={isWheelchair}
      className={cn(
        'focus-visible:ring-ring shrink-0 rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
        isWheelchair
          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
          : 'text-muted-foreground/50 hover:bg-muted/60 hover:text-rose-400'
      )}
    >
      <Accessibility className='h-4 w-4 sm:h-3.5 sm:w-3.5' />
    </button>
  );
}

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
  /** When true, hide "Abholadresse" in the client-address apply row (pickup fixed by rule). */
  disableApplyClientAddressToPickup?: boolean;
  /** When true, hide "Zieladresse" in the client-address apply row (dropoff fixed by rule). */
  disableApplyClientAddressToDropoff?: boolean;
}

export function AddPassengerInline({
  variant,
  pickupGroupUid,
  searchClients,
  onAdd,
  onClientLinked,
  onAddressChoice,
  disabled = false,
  disableApplyClientAddressToPickup = false,
  disableApplyClientAddressToDropoff = false
}: AddPassengerInlineProps) {
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
    if (type === 'pickup' && disableApplyClientAddressToPickup) return;
    if (type === 'dropoff' && disableApplyClientAddressToDropoff) return;
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

  const labelClass =
    'text-muted-foreground mb-0.5 block text-[10px] leading-none';

  const formFields = (
    <div className='flex flex-col gap-1.5'>
      <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
        <div className='min-w-0'>
          <Label className={labelClass}>Vorname</Label>
          <ClientAutoSuggest
            value={firstName}
            onNameChange={(val) => {
              setFirstName(val);
              if (!val) setPendingAddress(null);
            }}
            onSelect={handleClientSelect}
            searchClients={searchClients}
            placeholder='Suchen…'
            getDisplayValue={(c) => c.first_name || c.company_name || ''}
            inputClassName={compactInput}
            widePopover
          />
        </div>
        <div className='min-w-0'>
          <Label className={labelClass}>Nachname</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canAdd && handleAdd()}
            placeholder='Nachname'
            className={compactInput}
          />
        </div>
      </div>

      {pendingAddress && (
        <div className='bg-muted/30 border-border/60 rounded-md border p-1.5'>
          <div className='mb-1 flex items-start justify-between gap-1'>
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
          <p className='text-foreground mb-1.5 truncate text-[10px]'>
            {pendingAddress}
          </p>
          {disableApplyClientAddressToPickup &&
          disableApplyClientAddressToDropoff ? (
            <p className='text-muted-foreground text-[10px] leading-snug'>
              Abhol- und Zieladresse sind festgelegt — Kundenadresse wird nicht
              übernommen.
            </p>
          ) : (
            <div className='flex gap-1'>
              {!disableApplyClientAddressToPickup && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 gap-0.5 px-1.5 text-[10px] sm:h-6'
                  onClick={() => handleAddressChoice('pickup')}
                >
                  <MapPin className='h-3 w-3 shrink-0 text-emerald-500' />
                  Abholadresse
                </Button>
              )}
              {!disableApplyClientAddressToDropoff && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-7 flex-1 gap-0.5 px-1.5 text-[10px] sm:h-6'
                  onClick={() => handleAddressChoice('dropoff')}
                >
                  <Navigation className='h-3 w-3 shrink-0 text-rose-500' />
                  Zieladresse
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        type='button'
        size='sm'
        onClick={handleAdd}
        disabled={!canAdd || disabled}
        className='h-8 w-full text-xs sm:h-7'
      >
        Hinzufügen
      </Button>
    </div>
  );

  const titleRow = (title: React.ReactNode, showRequired?: boolean) => (
    <div className='flex items-center justify-between gap-2'>
      <div className='text-muted-foreground min-w-0 text-[10px] font-medium'>
        {title}
        {showRequired ? <span className='text-destructive'> *</span> : null}
      </div>
      <WheelchairHeaderToggle
        isWheelchair={isWheelchair}
        onToggle={() => setIsWheelchair((v) => !v)}
        disabled={disabled}
      />
    </div>
  );

  if (variant === 'first') {
    return (
      <div
        className={cn(
          'space-y-1.5',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        {titleRow('Erster Fahrgast', true)}
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
          className='text-muted-foreground hover:text-foreground flex h-8 w-full items-center justify-between gap-2 text-xs sm:h-7'
        >
          <span className='flex min-w-0 items-center gap-1.5'>
            <Plus className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>Weiteren Fahrgast hinzufügen</span>
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 overflow-hidden'>
        <div
          className={cn(
            'border-border/60 mt-1.5 space-y-1.5 border-t pt-2',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          {titleRow('Weiterer Fahrgast')}
          {formFields}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
