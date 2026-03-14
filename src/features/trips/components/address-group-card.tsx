'use client';

import * as React from 'react';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PassengerBadge } from './passenger-badge';
import { AddPassengerPopover } from './add-passenger-popover';
import { PassengerAssignPopover } from './passenger-assign-popover';
import type { PassengerEntry, AddressGroupEntry } from '@/features/trips/types';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';

interface AddressGroupCardProps {
  group: AddressGroupEntry;
  mode: 'pickup' | 'dropoff';
  passengers: PassengerEntry[];
  unassignedPassengers?: PassengerEntry[];
  onAddressChange: (address: string) => void;
  onRemoveGroup?: () => void;
  onAddPassenger?: (
    passenger: Omit<
      PassengerEntry,
      'pickup_station' | 'dropoff_group_uid' | 'dropoff_station'
    >
  ) => void;
  onRemovePassenger: (uid: string) => void;
  onStationChange: (
    passengerUid: string,
    field: 'pickup_station' | 'dropoff_station',
    value: string
  ) => void;
  onAssignPassenger?: (passengerUid: string) => void;
  searchClients?: (query: string) => Promise<ClientOption[]>;
  onClientLinked?: (client: ClientOption | null) => void;
  isLocked?: boolean;
  groupLabel?: string;
  hasError?: boolean;
}

export function AddressGroupCard({
  group,
  mode,
  passengers,
  unassignedPassengers = [],
  onAddressChange,
  onRemoveGroup,
  onAddPassenger,
  onRemovePassenger,
  onStationChange,
  onAssignPassenger,
  searchClients,
  onClientLinked,
  isLocked = false,
  groupLabel,
  hasError = false
}: AddressGroupCardProps) {
  const isPickup = mode === 'pickup';
  const stationField = isPickup
    ? ('pickup_station' as const)
    : ('dropoff_station' as const);
  const Icon = isPickup ? MapPin : Navigation;
  const iconColor = isPickup ? 'text-emerald-500' : 'text-rose-500';
  const addressLabel = isPickup ? 'Abholadresse *' : 'Zieladresse *';
  const emptyLabel = isPickup
    ? 'Noch kein Fahrgast'
    : 'Noch kein Fahrgast zugewiesen';

  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-lg border transition-colors',
        hasError && 'border-destructive'
      )}
    >
      {groupLabel && (
        <div className='bg-muted/30 flex items-center justify-between border-b px-3 py-1.5'>
          <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
            {groupLabel}
          </span>
          {onRemoveGroup && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-destructive h-5 w-5'
              onClick={onRemoveGroup}
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          )}
        </div>
      )}

      <div className='grid grid-cols-3 divide-x'>
        {/* 1/3 — Passenger column */}
        <div className='col-span-1 flex min-h-[100px] flex-col gap-1.5 p-2'>
          {passengers.length === 0 ? (
            <div className='flex flex-1 items-center justify-center py-2'>
              <p className='text-muted-foreground text-center text-[10px] leading-relaxed'>
                {emptyLabel}
              </p>
            </div>
          ) : (
            passengers.map((p) => (
              <PassengerBadge
                key={p.uid}
                passenger={p}
                stationField={stationField}
                onRemove={() => onRemovePassenger(p.uid)}
                onStationChange={(value) =>
                  onStationChange(p.uid, stationField, value)
                }
              />
            ))
          )}

          <div className='mt-auto pt-1'>
            {isPickup && onAddPassenger && searchClients && (
              <AddPassengerPopover
                pickupGroupUid={group.uid}
                searchClients={searchClients}
                onAdd={onAddPassenger}
                onClientLinked={onClientLinked}
              />
            )}
            {!isPickup &&
              unassignedPassengers.length > 0 &&
              onAssignPassenger && (
                <PassengerAssignPopover
                  unassignedPassengers={unassignedPassengers}
                  onAssign={onAssignPassenger}
                />
              )}
          </div>
        </div>

        {/* 2/3 — Address column */}
        <div className='col-span-2 flex flex-col justify-center gap-1.5 p-3'>
          <label className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
            {addressLabel}
          </label>
          <div className='relative'>
            <Icon
              className={cn(
                'pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2',
                iconColor
              )}
            />
            <Input
              value={group.address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder='Straße, PLZ Ort'
              className={cn('h-9 pl-9', hasError && 'border-destructive')}
              disabled={isLocked}
            />
          </div>
          {hasError && (
            <p className='text-destructive text-[10px]'>
              Adresse ist erforderlich
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
