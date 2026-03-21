'use client';

/**
 * React context: exposes CreateTripForm state/handlers to section components without prop drilling.
 */
import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TripFormValues } from './schema';
import type { ReturnMode } from './schema';
import type { PassengerEntry, AddressGroupEntry } from '@/features/trips/types';
import type { AddressResult } from '../trip-address-passenger';
import type {
  BillingTypeOption,
  ClientOption,
  DriverOption,
  PayerOption
} from '@/features/trips/hooks/use-trip-form-data';
import type { NormalizedBillingTypeBehavior } from '@/features/trips/lib/normalize-billing-type-behavior-profile';

export interface TripFormErrorsState {
  passengers?: string;
  pickupGroups?: Record<string, boolean>;
  dropoffGroups?: Record<string, boolean>;
  unassigned?: boolean;
}

export interface TripFormSectionsContextType {
  form: UseFormReturn<TripFormValues>;
  isSubmitting: boolean;
  onCancel?: () => void;
  onClientSelect?: (client: ClientOption | null) => void;
  hasInitializedReturnDateRef: React.MutableRefObject<boolean>;
  watchedPayerId: string;
  /** Kept for parity with form.watch; sections may use later. */
  watchedBillingTypeId: string | undefined;
  watchedIsWheelchair: boolean;
  watchedReturnMode: ReturnMode;
  watchedScheduledAt: Date | undefined;
  payers: PayerOption[];
  billingTypes: BillingTypeOption[];
  drivers: DriverOption[];
  isLoading: boolean;
  searchClients: (q: string) => Promise<ClientOption[]>;
  selectedBillingType: BillingTypeOption | undefined;
  passengers: PassengerEntry[];
  pickupGroups: AddressGroupEntry[];
  dropoffGroups: AddressGroupEntry[];
  formErrors: TripFormErrorsState;
  /** Normalised from `billing_types.behavior_profile` (same rules as Kostenträger dialog). */
  billingBehavior: NormalizedBillingTypeBehavior;
  requirePassenger: boolean;
  isPickupLocked: boolean;
  isDropoffLocked: boolean;
  isReturnModeLocked: boolean;
  isPayerSelected: boolean;
  unassignedPassengers: PassengerEntry[];
  getPickupGroupPassengers: (groupUid: string) => PassengerEntry[];
  getDropoffGroupPassengers: (groupUid: string) => PassengerEntry[];
  addPassenger: (
    p: Omit<
      PassengerEntry,
      'pickup_station' | 'dropoff_group_uid' | 'dropoff_station'
    >
  ) => void;
  removePassenger: (uid: string) => void;
  updatePassengerStation: (
    uid: string,
    field: 'pickup_station' | 'dropoff_station',
    value: string
  ) => void;
  updatePassengerWheelchair: (uid: string, value: boolean) => void;
  updatePassengerName: (
    uid: string,
    field: 'first_name' | 'last_name',
    value: string
  ) => void;
  assignToDropoff: (passengerUid: string, dropoffGroupUid: string) => void;
  unassignFromDropoff: (passengerUid: string) => void;
  addPickupGroup: () => void;
  removePickupGroup: (uid: string) => void;
  updatePickupAddress: (uid: string, result: AddressResult | string) => void;
  addDropoffGroup: () => void;
  removeDropoffGroup: (uid: string) => void;
  updateDropoffAddress: (uid: string, result: AddressResult | string) => void;
  handleAddressChoice: (
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
  handleManualAddressFieldChange: (
    uid: string,
    type: 'pickup' | 'dropoff',
    field: keyof AddressGroupEntry,
    value: string
  ) => void;
}

const TripFormSectionsContext =
  React.createContext<TripFormSectionsContextType | null>(null);

export function useTripFormSections(): TripFormSectionsContextType {
  const ctx = React.useContext(TripFormSectionsContext);
  if (!ctx) {
    throw new Error('useTripFormSections must be used inside CreateTripForm');
  }
  return ctx;
}

export function TripFormSectionsProvider({
  value,
  children
}: {
  value: TripFormSectionsContextType;
  children: React.ReactNode;
}) {
  return (
    <TripFormSectionsContext.Provider value={value}>
      {children}
    </TripFormSectionsContext.Provider>
  );
}
