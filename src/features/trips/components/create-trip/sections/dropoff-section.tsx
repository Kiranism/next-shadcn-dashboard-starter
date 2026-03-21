'use client';

/** Dropoff / Ziel block — mirrors pickup layout patterns for anonymous vs passenger mode. */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navigation, Plus, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AddressAutocomplete,
  AddressGroupCard,
  type AddressResult
} from '../../trip-address-passenger';
import { useTripFormSections } from '../trip-form-sections-context';
import { BillingProfileDropoffAddressHint } from '../billing-profile-address-hints';

export function CreateTripDropoffSection() {
  const {
    formErrors,
    dropoffGroups,
    billingBehavior,
    isPayerSelected,
    unassignedPassengers,
    passengers,
    updateDropoffAddress,
    handleManualAddressFieldChange,
    getDropoffGroupPassengers,
    assignToDropoff,
    unassignFromDropoff,
    removeDropoffGroup,
    addDropoffGroup,
    updatePassengerStation,
    updatePassengerWheelchair,
    updatePassengerName
  } = useTripFormSections();

  const requirePassenger = billingBehavior.requirePassenger;
  const isDropoffLocked = billingBehavior.lockDropoff;

  return (
    <div
      className={cn(
        'px-6 py-4 transition-all duration-300',
        !isPayerSelected && 'pointer-events-none opacity-40'
      )}
    >
      <div className='mb-3 flex items-center gap-2'>
        <Navigation className='h-4 w-4 text-rose-500' />
        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Ziel
        </span>
        {requirePassenger && passengers.length > 0 && (
          <div className='ml-auto flex items-center gap-1.5'>
            <Users className='text-muted-foreground h-3.5 w-3.5' />
            <span className='text-muted-foreground text-[10px]'>
              {passengers.length - unassignedPassengers.length}/
              {passengers.length} zugewiesen
            </span>
          </div>
        )}
      </div>

      {!requirePassenger ? (
        <div className='flex flex-col gap-3'>
          {dropoffGroups.map((group) => (
            <div key={group.uid} className='flex flex-col gap-2'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-4'>
                <div className='sm:col-span-3'>
                  <AddressAutocomplete
                    value={group.street || ''}
                    onChange={(result: AddressResult | string) => {
                      if (typeof result === 'string') {
                        handleManualAddressFieldChange(
                          group.uid,
                          'dropoff',
                          'street',
                          result
                        );
                        return;
                      }

                      if (result.street) {
                        updateDropoffAddress(group.uid, result);
                      } else {
                        handleManualAddressFieldChange(
                          group.uid,
                          'dropoff',
                          'street',
                          result.address
                        );
                      }
                    }}
                    placeholder='Straße'
                    disabled={isDropoffLocked}
                    className={cn(
                      formErrors.dropoffGroups?.[group.uid] &&
                        'border-destructive'
                    )}
                  />
                </div>
                <div className='sm:col-span-1'>
                  <Input
                    value={group.street_number || ''}
                    onChange={(e) =>
                      handleManualAddressFieldChange(
                        group.uid,
                        'dropoff',
                        'street_number',
                        e.target.value
                      )
                    }
                    placeholder='Nr.'
                    className='h-8 text-[11px]'
                    disabled={isDropoffLocked}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-4'>
                <div className='sm:col-span-1'>
                  <Input
                    value={group.zip_code || ''}
                    onChange={(e) =>
                      handleManualAddressFieldChange(
                        group.uid,
                        'dropoff',
                        'zip_code',
                        e.target.value
                      )
                    }
                    placeholder='PLZ'
                    className='h-8 text-[11px]'
                    disabled={isDropoffLocked}
                  />
                </div>
                <div className='sm:col-span-3'>
                  <Input
                    value={group.city || ''}
                    onChange={(e) =>
                      handleManualAddressFieldChange(
                        group.uid,
                        'dropoff',
                        'city',
                        e.target.value
                      )
                    }
                    placeholder='Stadt'
                    className='h-8 text-[11px]'
                    disabled={isDropoffLocked}
                  />
                </div>
              </div>
              {formErrors.dropoffGroups?.[group.uid] && (
                <p className='text-destructive mt-1 text-[10px]'>
                  Adresse ist erforderlich
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {billingBehavior.hasDefaultDropoffAddress && (
            <BillingProfileDropoffAddressHint />
          )}
          {unassignedPassengers.length > 0 && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
              <div className='mb-2 flex items-center gap-1.5'>
                <AlertCircle className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400' />
                <span className='text-[10px] font-semibold text-amber-700 dark:text-amber-300'>
                  Noch nicht zugewiesen
                </span>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {unassignedPassengers.map((p) => {
                  const name =
                    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                    '—';
                  return (
                    <Badge
                      key={p.uid}
                      variant='outline'
                      className='border-amber-300 bg-amber-100 text-[10px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                    >
                      {name}
                    </Badge>
                  );
                })}
              </div>
              <p className='mt-2 text-[10px] text-amber-600 dark:text-amber-400'>
                Bitte alle Fahrgäste einer Zieladresse zuweisen.
              </p>
            </div>
          )}

          {dropoffGroups.map((group, idx) => (
            <AddressGroupCard
              key={group.uid}
              group={group}
              mode='dropoff'
              passengers={getDropoffGroupPassengers(group.uid)}
              unassignedPassengers={unassignedPassengers}
              onAddressChange={(address) =>
                updateDropoffAddress(group.uid, address)
              }
              onRemoveGroup={
                dropoffGroups.length > 1
                  ? () => removeDropoffGroup(group.uid)
                  : undefined
              }
              onRemovePassenger={unassignFromDropoff}
              onStationChange={updatePassengerStation}
              onWheelchairChange={updatePassengerWheelchair}
              onPassengerNameChange={updatePassengerName}
              onAssignPassenger={(passengerUid) =>
                assignToDropoff(passengerUid, group.uid)
              }
              onManualFieldChange={(field, value) =>
                handleManualAddressFieldChange(
                  group.uid,
                  'dropoff',
                  field,
                  value
                )
              }
              isLocked={isDropoffLocked}
              groupLabel={
                dropoffGroups.length > 1 ? `Zieladresse ${idx + 1}` : undefined
              }
              hasError={!!formErrors.dropoffGroups?.[group.uid]}
            />
          ))}

          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs'
            onClick={addDropoffGroup}
            disabled={!isPayerSelected}
          >
            <Plus className='h-3.5 w-3.5' />
            Weitere Zieladresse
          </Button>
        </div>
      )}
    </div>
  );
}
