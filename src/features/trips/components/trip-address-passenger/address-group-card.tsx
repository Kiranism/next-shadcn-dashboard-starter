'use client';

/**
 * One pickup or dropoff address group with optional passenger chips (passenger mode).
 * Layout: stacked sections below `md` for phones; side‑by‑side 1/3 + 2/3 from `md` up.
 * Manual PLZ/street grids use one column on the narrowest screens, four columns from `sm`.
 */
import * as React from 'react';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PassengerBadge } from './passenger-badge';
import { AddPassengerInline } from './add-passenger-inline';
import { PassengerAssignPopover } from './passenger-assign-popover';
import type { PassengerEntry, AddressGroupEntry } from '@/features/trips/types';
import {
  AddressAutocomplete,
  type AddressResult
} from './address-autocomplete';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';

interface AddressGroupCardProps {
  group: AddressGroupEntry;
  mode: 'pickup' | 'dropoff';
  passengers: PassengerEntry[];
  unassignedPassengers?: PassengerEntry[];
  onAddressChange: (result: AddressResult | string) => void;
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
  onWheelchairChange: (passengerUid: string, value: boolean) => void;
  onPassengerNameChange?: (
    passengerUid: string,
    field: 'first_name' | 'last_name',
    value: string
  ) => void;
  onAssignPassenger?: (passengerUid: string) => void;
  searchClients?: (query: string) => Promise<ClientOption[]>;
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
  onManualFieldChange?: (field: keyof AddressGroupEntry, value: string) => void;
  /** When true, only the **address** fields are read-only (billing rule). Fahrgast UI stays usable. */
  isLocked?: boolean;
  /**
   * Pickup mode only: billing locks for "Kundenadresse übernehmen" in AddPassengerInline.
   * Independent of `isLocked` so Abholadresse can be fixed while Ziel (or vice versa) stays editable.
   */
  applyClientAddressPickupLocked?: boolean;
  applyClientAddressDropoffLocked?: boolean;
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
  onWheelchairChange,
  onPassengerNameChange,
  onAssignPassenger,
  searchClients,
  onClientLinked,
  onAddressChoice,
  onManualFieldChange,
  isLocked = false,
  applyClientAddressPickupLocked,
  applyClientAddressDropoffLocked,
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

  const disableApplyPickup =
    applyClientAddressPickupLocked ?? (isPickup ? isLocked : false);
  const disableApplyDropoff = applyClientAddressDropoffLocked ?? false;

  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-lg border transition-colors',
        hasError && 'border-destructive'
      )}
    >
      {groupLabel && (
        <div className='bg-muted/30 flex items-center justify-between border-b px-3 py-2 sm:py-1.5'>
          <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
            {groupLabel}
          </span>
          {onRemoveGroup && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-destructive h-9 w-9 sm:h-5 sm:w-5'
              onClick={onRemoveGroup}
            >
              <Trash2 className='h-4 w-4 sm:h-3 sm:w-3' />
            </Button>
          )}
        </div>
      )}

      <div className='flex flex-col md:grid md:grid-cols-3 md:divide-x'>
        {/* Passengers: full-width stack on small screens; first column on md+ */}
        <div className='flex min-h-0 flex-col gap-2 border-b p-3 md:col-span-1 md:border-b-0'>
          {/* Section title only on small screens — desktop relies on column width */}
          <div className='flex items-center gap-2 md:hidden'>
            <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
            <span className='text-muted-foreground text-xs font-semibold'>
              Fahrgäste
            </span>
          </div>
          {isPickup && onAddPassenger && searchClients ? (
            <>
              {passengers.map((p) => (
                <PassengerBadge
                  key={p.uid}
                  passenger={p}
                  stationField={stationField}
                  onRemove={() => onRemovePassenger(p.uid)}
                  onStationChange={(value) =>
                    onStationChange(p.uid, stationField, value)
                  }
                  onWheelchairChange={(value) =>
                    onWheelchairChange(p.uid, value)
                  }
                  onFirstNameChange={
                    onPassengerNameChange
                      ? (value) =>
                          onPassengerNameChange(p.uid, 'first_name', value)
                      : undefined
                  }
                  onLastNameChange={
                    onPassengerNameChange
                      ? (value) =>
                          onPassengerNameChange(p.uid, 'last_name', value)
                      : undefined
                  }
                />
              ))}
              {passengers.length === 0 ? (
                <AddPassengerInline
                  variant='first'
                  pickupGroupUid={group.uid}
                  searchClients={searchClients}
                  onAdd={onAddPassenger}
                  onClientLinked={onClientLinked}
                  onAddressChoice={onAddressChoice}
                  disableApplyClientAddressToPickup={disableApplyPickup}
                  disableApplyClientAddressToDropoff={disableApplyDropoff}
                />
              ) : (
                <AddPassengerInline
                  variant='additional'
                  pickupGroupUid={group.uid}
                  searchClients={searchClients}
                  onAdd={onAddPassenger}
                  onClientLinked={onClientLinked}
                  onAddressChoice={onAddressChoice}
                  disableApplyClientAddressToPickup={disableApplyPickup}
                  disableApplyClientAddressToDropoff={disableApplyDropoff}
                />
              )}
            </>
          ) : passengers.length === 0 ? (
            <div className='flex flex-1 items-center justify-center py-3 md:py-2'>
              <p className='text-muted-foreground text-center text-xs leading-relaxed sm:text-[10px]'>
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
                onWheelchairChange={(value) => onWheelchairChange(p.uid, value)}
                onFirstNameChange={
                  onPassengerNameChange
                    ? (value) =>
                        onPassengerNameChange(p.uid, 'first_name', value)
                    : undefined
                }
                onLastNameChange={
                  onPassengerNameChange
                    ? (value) =>
                        onPassengerNameChange(p.uid, 'last_name', value)
                    : undefined
                }
              />
            ))
          )}

          <div className='mt-auto flex flex-col gap-2 pt-1'>
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

        {/* Address fields: full width under passengers on mobile; spans 2 cols on md+ */}
        <div className='flex flex-col justify-center gap-2 p-3 md:col-span-2 md:border-l md:pt-3'>
          <div className='flex items-center gap-2 md:hidden'>
            <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
            <span className='text-muted-foreground text-xs font-semibold'>
              {addressLabel}
            </span>
          </div>
          <div className='flex flex-col gap-2'>
            {/* Street + Nr.: single column & min-h-10 inputs on mobile for touch */}
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-4'>
              <div className='min-w-0 sm:col-span-3'>
                <AddressAutocomplete
                  value={group.street || ''}
                  onChange={(result: AddressResult | string) => {
                    if (typeof result === 'string') {
                      onManualFieldChange?.('street', result);
                      return;
                    }

                    if (result.street) {
                      onAddressChange(result);
                    } else {
                      onManualFieldChange?.('street', result.address);
                    }
                  }}
                  placeholder='Straße'
                  disabled={isLocked}
                  className={cn(hasError && 'border-destructive')}
                />
              </div>
              <div className='sm:col-span-1'>
                <Input
                  value={group.street_number || ''}
                  onChange={(e) =>
                    onManualFieldChange?.('street_number', e.target.value)
                  }
                  placeholder='Nr.'
                  className='h-10 text-sm sm:h-8 sm:text-[11px]'
                  disabled={isLocked}
                />
              </div>
            </div>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-4'>
              <div className='sm:col-span-1'>
                <Input
                  value={group.zip_code || ''}
                  onChange={(e) =>
                    onManualFieldChange?.('zip_code', e.target.value)
                  }
                  placeholder='PLZ'
                  className='h-10 text-sm sm:h-8 sm:text-[11px]'
                  disabled={isLocked}
                />
              </div>
              <div className='min-w-0 sm:col-span-3'>
                <Input
                  value={group.city || ''}
                  onChange={(e) =>
                    onManualFieldChange?.('city', e.target.value)
                  }
                  placeholder='Stadt'
                  className='h-10 text-sm sm:h-8 sm:text-[11px]'
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>
          {hasError && (
            <p className='text-destructive text-xs sm:text-[10px]'>
              Adresse ist erforderlich
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
