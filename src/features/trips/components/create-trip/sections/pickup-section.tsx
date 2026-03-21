'use client';

/** Pickup block: anonymous address rows or AddressGroupCard list in passenger mode. */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AddressAutocomplete,
  AddressGroupCard,
  type AddressResult
} from '../../trip-address-passenger';
import { useTripFormSections } from '../trip-form-sections-context';
import { BillingProfilePickupAddressHint } from '../billing-profile-address-hints';

export function CreateTripPickupSection() {
  const {
    formErrors,
    pickupGroups,
    billingBehavior,
    isPayerSelected,
    updatePickupAddress,
    handleManualAddressFieldChange,
    addPassenger,
    removePassenger,
    updatePassengerStation,
    updatePassengerWheelchair,
    updatePassengerName,
    searchClients,
    onClientSelect,
    handleAddressChoice,
    removePickupGroup,
    addPickupGroup,
    getPickupGroupPassengers
  } = useTripFormSections();

  const requirePassenger = billingBehavior.requirePassenger;
  const isPickupLocked = billingBehavior.lockPickup;
  const isDropoffLocked = billingBehavior.lockDropoff;

  return (
    <div
      className={cn(
        'px-6 py-4 transition-all duration-300',
        !isPayerSelected && 'pointer-events-none opacity-40'
      )}
    >
      <div className='mb-3 flex items-center gap-2'>
        <MapPin className='h-4 w-4 text-emerald-500' />
        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Abholung
        </span>
        {!isPayerSelected && (
          <Badge variant='outline' className='ml-auto text-[10px] font-normal'>
            Kostenträger wählen
          </Badge>
        )}
      </div>

      {!requirePassenger ? (
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300'>
            <AlertCircle className='h-3.5 w-3.5 shrink-0' />
            Kein Fahrgastname erforderlich — Fahrt wird anonym erstellt.
          </div>
          {billingBehavior.hasDefaultPickupAddress && (
            <BillingProfilePickupAddressHint />
          )}
          {pickupGroups.map((group) => (
            <div key={group.uid} className='flex flex-col gap-2'>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-4'>
                <div className='sm:col-span-3'>
                  <AddressAutocomplete
                    value={group.street || ''}
                    onChange={(result: AddressResult | string) => {
                      if (typeof result === 'string') {
                        handleManualAddressFieldChange(
                          group.uid,
                          'pickup',
                          'street',
                          result
                        );
                        return;
                      }

                      if (result.street) {
                        updatePickupAddress(group.uid, result);
                      } else {
                        handleManualAddressFieldChange(
                          group.uid,
                          'pickup',
                          'street',
                          result.address
                        );
                      }
                    }}
                    placeholder='Straße'
                    disabled={isPickupLocked}
                    className={cn(
                      formErrors.pickupGroups?.[group.uid] &&
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
                        'pickup',
                        'street_number',
                        e.target.value
                      )
                    }
                    placeholder='Nr.'
                    className='h-8 text-[11px]'
                    disabled={isPickupLocked}
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
                        'pickup',
                        'zip_code',
                        e.target.value
                      )
                    }
                    placeholder='PLZ'
                    className='h-8 text-[11px]'
                    disabled={isPickupLocked}
                  />
                </div>
                <div className='sm:col-span-3'>
                  <Input
                    value={group.city || ''}
                    onChange={(e) =>
                      handleManualAddressFieldChange(
                        group.uid,
                        'pickup',
                        'city',
                        e.target.value
                      )
                    }
                    placeholder='Stadt'
                    className='h-8 text-[11px]'
                    disabled={isPickupLocked}
                  />
                </div>
              </div>
              {formErrors.pickupGroups?.[group.uid] && (
                <p className='text-destructive mt-1 text-[10px]'>
                  Adresse ist erforderlich
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {billingBehavior.hasDefaultPickupAddress && (
            <BillingProfilePickupAddressHint />
          )}
          {formErrors.passengers && (
            <div className='border-destructive/30 bg-destructive/10 text-destructive mb-1 flex items-center gap-2 rounded-md border px-3 py-2 text-xs'>
              <AlertCircle className='h-3.5 w-3.5 shrink-0' />
              {formErrors.passengers}
            </div>
          )}

          {pickupGroups.map((group, idx) => (
            <AddressGroupCard
              key={group.uid}
              group={group}
              mode='pickup'
              passengers={getPickupGroupPassengers(group.uid)}
              onAddressChange={(address) =>
                updatePickupAddress(group.uid, address)
              }
              onRemoveGroup={
                pickupGroups.length > 1
                  ? () => removePickupGroup(group.uid)
                  : undefined
              }
              onAddPassenger={addPassenger}
              onRemovePassenger={removePassenger}
              onStationChange={updatePassengerStation}
              onWheelchairChange={updatePassengerWheelchair}
              onPassengerNameChange={updatePassengerName}
              searchClients={searchClients}
              onClientLinked={onClientSelect}
              onAddressChoice={handleAddressChoice}
              onManualFieldChange={(field, value) =>
                handleManualAddressFieldChange(
                  group.uid,
                  'pickup',
                  field,
                  value
                )
              }
              isLocked={isPickupLocked}
              applyClientAddressPickupLocked={isPickupLocked}
              applyClientAddressDropoffLocked={isDropoffLocked}
              groupLabel={
                pickupGroups.length > 1 ? `Abholadresse ${idx + 1}` : undefined
              }
              hasError={!!formErrors.pickupGroups?.[group.uid]}
            />
          ))}

          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs'
            onClick={addPickupGroup}
            disabled={!isPayerSelected}
          >
            <Plus className='h-3.5 w-3.5' />
            Weitere Abholadresse
          </Button>
        </div>
      )}
    </div>
  );
}
