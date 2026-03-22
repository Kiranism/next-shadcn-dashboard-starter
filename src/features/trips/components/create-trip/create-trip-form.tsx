'use client';

import * as React from 'react';
import { useForm, useFormState, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { tripsService } from '@/features/trips/api/trips.service';
import { getDrivingMetrics } from '@/lib/google-directions';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { PassengerEntry, AddressGroupEntry } from '@/features/trips/types';
import type { AddressResult } from '../trip-address-passenger';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import { tripFormSchema, type TripFormValues, type ReturnMode } from './schema';
import {
  TripFormSectionsProvider,
  type TripFormSectionsContextType
} from './trip-form-sections-context';
import { CreateTripPayerSection } from './sections/payer-section';
import { CreateTripPickupSection } from './sections/pickup-section';
import { CreateTripDropoffSection } from './sections/dropoff-section';
import { CreateTripScheduleSection } from './sections/schedule-section';
import { CreateTripExtrasSection } from './sections/extras-section';
import { CreateTripFormFooter } from './form-footer';
import {
  normalizeBillingTypeBehavior,
  parseBehaviorProfileRaw
} from '@/features/trips/lib/normalize-billing-type-behavior-profile';
import { useCreateTripDraft } from '@/features/trips/hooks/use-create-trip-draft';
import {
  buildTripFormValuesFromDraft,
  type CreateTripDraftStored
} from '@/features/trips/lib/create-trip-draft';

const FIELD_TO_SECTION: Partial<Record<keyof TripFormValues, string>> = {
  payer_id: 'payer',
  billing_type_id: 'payer',
  scheduled_at: 'schedule',
  return_mode: 'schedule',
  return_date: 'schedule',
  return_time: 'schedule',
  driver_id: 'extras',
  is_wheelchair: 'extras',
  notes: 'extras'
};

function scrollToCreateTripSection(section: string) {
  document
    .querySelector(`[data-create-trip-section="${section}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export interface CreateTripFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onClientSelect?: (client: ClientOption | null) => void;
  /** Fired when RHF or address/passenger state becomes dirty — for close confirmation. */
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * Optional client id to preselect when opening the form
   * globally (e.g. via Cmd+K "Neue Fahrt für [Name]").
   */
  preselectedClientId?: string;
}

export function CreateTripForm({
  onSuccess,
  onCancel,
  onClientSelect,
  onDirtyChange,
  preselectedClientId
}: CreateTripFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const hasInitializedReturnDateRef = React.useRef(false);
  const lastSyncedPanelClientIdRef = React.useRef<string | null>(null);

  // Dynamic multi-passenger state
  const [passengers, setPassengers] = React.useState<PassengerEntry[]>([]);
  const [pickupGroups, setPickupGroups] = React.useState<AddressGroupEntry[]>([
    { uid: crypto.randomUUID(), address: '' }
  ]);
  const [dropoffGroups, setDropoffGroups] = React.useState<AddressGroupEntry[]>(
    [{ uid: crypto.randomUUID(), address: '' }]
  );

  const pickupGroupsRef = React.useRef(pickupGroups);
  const dropoffGroupsRef = React.useRef(dropoffGroups);
  pickupGroupsRef.current = pickupGroups;
  dropoffGroupsRef.current = dropoffGroups;
  const prevBillingTypeIdRef = React.useRef<string | undefined>(undefined);

  // Validation error state
  const [formErrors, setFormErrors] = React.useState<{
    passengers?: string;
    pickupGroups?: Record<string, boolean>;
    dropoffGroups?: Record<string, boolean>;
    unassigned?: boolean;
  }>({});

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema) as any,
    defaultValues: {
      payer_id: '',
      billing_type_id: '',
      scheduled_at: new Date(),
      return_mode: 'none',
      return_date: undefined,
      return_time: '',
      driver_id: '__none__',
      is_wheelchair: false,
      notes: ''
    }
  });

  const { isDirty: rhfDirty } = useFormState({ control: form.control });

  const handleApplyDraft = React.useCallback(
    (draft: CreateTripDraftStored) => {
      form.reset(buildTripFormValuesFromDraft(draft.values));
      setPassengers((draft.passengers as PassengerEntry[]) ?? []);
      const pu = draft.pickupGroups as AddressGroupEntry[];
      const dr = draft.dropoffGroups as AddressGroupEntry[];
      setPickupGroups(
        Array.isArray(pu) && pu.length > 0
          ? pu
          : [{ uid: crypto.randomUUID(), address: '' }]
      );
      setDropoffGroups(
        Array.isArray(dr) && dr.length > 0
          ? dr
          : [{ uid: crypto.randomUUID(), address: '' }]
      );
      setFormErrors({});
      hasInitializedReturnDateRef.current = false;
    },
    [form]
  );

  const {
    showRestoreBanner,
    draftStorageHint,
    applyPendingDraft,
    discardPendingDraft,
    clearDraftStorage
  } = useCreateTripDraft({
    form,
    passengers,
    pickupGroups,
    dropoffGroups,
    isSubmitting,
    onApplyDraft: handleApplyDraft
  });

  const handleRhfInvalid = React.useCallback(
    (errs: FieldErrors<TripFormValues>) => {
      const order: (keyof TripFormValues)[] = [
        'payer_id',
        'billing_type_id',
        'scheduled_at',
        'return_mode',
        'return_date',
        'return_time',
        'driver_id',
        'is_wheelchair',
        'notes'
      ];
      const first =
        order.find((k) => errs[k]) ??
        (Object.keys(errs)[0] as keyof TripFormValues | undefined);
      if (!first) return;
      const section = FIELD_TO_SECTION[first];
      void form.setFocus(first);
      requestAnimationFrame(() => {
        if (section) scrollToCreateTripSection(section);
        const el = document.querySelector(
          `[name="${String(first)}"]`
        ) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [form]
  );

  const watchedPayerId = form.watch('payer_id');
  const watchedBillingTypeId = form.watch('billing_type_id');
  const watchedIsWheelchair = form.watch('is_wheelchair');
  const watchedReturnMode = form.watch('return_mode') as ReturnMode;
  const watchedScheduledAt = form.watch('scheduled_at');

  const {
    payers,
    billingTypes,
    drivers,
    isLoading,
    searchClients,
    searchClientsById
  } = useTripFormData(watchedPayerId || null);

  // ClientTripsPanel (parent): show trips for the active linked client, or the Cmd+K
  // preset when no passenger carries a client_id; clear when all linked passengers are removed.
  React.useEffect(() => {
    if (!onClientSelect) return;

    const firstLinkedId =
      passengers.find((p) => p.client_id)?.client_id ?? null;

    if (firstLinkedId) {
      if (firstLinkedId === lastSyncedPanelClientIdRef.current) return;
      let cancelled = false;
      void searchClientsById(firstLinkedId).then((client) => {
        if (cancelled || !client) return;
        lastSyncedPanelClientIdRef.current = firstLinkedId;
        onClientSelect(client);
      });
      return () => {
        cancelled = true;
      };
    }

    if (preselectedClientId) {
      if (lastSyncedPanelClientIdRef.current === preselectedClientId) return;
      let cancelled = false;
      void searchClientsById(preselectedClientId).then((client) => {
        if (cancelled || !client) return;
        lastSyncedPanelClientIdRef.current = preselectedClientId;
        onClientSelect(client);
      });
      return () => {
        cancelled = true;
      };
    }

    if (lastSyncedPanelClientIdRef.current !== null) {
      lastSyncedPanelClientIdRef.current = null;
      onClientSelect(null);
    }
  }, [passengers, preselectedClientId, onClientSelect, searchClientsById]);

  // Reset billing type when payer changes
  React.useEffect(() => {
    form.setValue('billing_type_id', '');
  }, [watchedPayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBillingType = billingTypes.find(
    (bt) => bt.id === watchedBillingTypeId
  );

  // When Abrechnungsart changes, clear address rows (then the next effect applies new defaults).
  // Passengers, schedule, notes, etc. stay; station strings reset with addresses.
  React.useEffect(() => {
    const current = watchedBillingTypeId || '';
    const prev = prevBillingTypeIdRef.current;

    if (prev !== undefined && prev !== current) {
      const pickupFirstUid =
        pickupGroupsRef.current[0]?.uid ?? crypto.randomUUID();
      const dropFirstUid =
        dropoffGroupsRef.current[0]?.uid ?? crypto.randomUUID();

      setPickupGroups([{ uid: pickupFirstUid, address: '' }]);
      setDropoffGroups([{ uid: dropFirstUid, address: '' }]);
      setPassengers((p) =>
        p.map((row) => ({
          ...row,
          pickup_group_uid: pickupFirstUid,
          pickup_station: '',
          dropoff_group_uid:
            row.dropoff_group_uid != null ? dropFirstUid : null,
          dropoff_station: ''
        }))
      );
      setFormErrors((e) => ({
        ...e,
        pickupGroups: undefined,
        dropoffGroups: undefined,
        unassigned: undefined
      }));
    }

    prevBillingTypeIdRef.current = current;
  }, [watchedBillingTypeId]);

  // Apply all behavior profile rules when billing type changes
  React.useEffect(() => {
    if (!selectedBillingType) return;
    const b = parseBehaviorProfileRaw(
      selectedBillingType.behavior_profile
    ) as Record<string, any>;

    // Address defaults
    const defaultPickup = b.defaultPickup ?? b.default_pickup;
    const defaultDropoff = b.defaultDropoff ?? b.default_dropoff;

    const pickupStreet =
      b.defaultPickupStreet ?? b.default_pickup_street ?? null;
    const pickupStreetNumber =
      b.defaultPickupStreetNumber ?? b.default_pickup_street_number ?? null;
    const pickupZip = b.defaultPickupZip ?? b.default_pickup_zip ?? null;
    const pickupCity = b.defaultPickupCity ?? b.default_pickup_city ?? null;

    const dropoffStreet =
      b.defaultDropoffStreet ?? b.default_dropoff_street ?? null;
    const dropoffStreetNumber =
      b.defaultDropoffStreetNumber ?? b.default_dropoff_street_number ?? null;
    const dropoffZip = b.defaultDropoffZip ?? b.default_dropoff_zip ?? null;
    const dropoffCity = b.defaultDropoffCity ?? b.default_dropoff_city ?? null;

    if (
      defaultPickup ||
      pickupStreet ||
      pickupStreetNumber ||
      pickupZip ||
      pickupCity
    ) {
      const pickupAddress =
        defaultPickup ||
        [
          [pickupStreet, pickupStreetNumber].filter(Boolean).join(' '),
          [pickupZip, pickupCity].filter(Boolean).join(' ')
        ]
          .filter(Boolean)
          .join(', ');

      setPickupGroups((prev) =>
        prev.map((g, i) =>
          i === 0
            ? {
                ...g,
                address: pickupAddress,
                street: pickupStreet ?? g.street,
                street_number: pickupStreetNumber ?? g.street_number,
                zip_code: pickupZip ?? g.zip_code,
                city: pickupCity ?? g.city
              }
            : g
        )
      );
    }

    if (
      defaultDropoff ||
      dropoffStreet ||
      dropoffStreetNumber ||
      dropoffZip ||
      dropoffCity
    ) {
      const dropoffAddress =
        defaultDropoff ||
        [
          [dropoffStreet, dropoffStreetNumber].filter(Boolean).join(' '),
          [dropoffZip, dropoffCity].filter(Boolean).join(' ')
        ]
          .filter(Boolean)
          .join(', ');

      setDropoffGroups((prev) =>
        prev.map((g, i) =>
          i === 0
            ? {
                ...g,
                address: dropoffAddress,
                street: dropoffStreet ?? g.street,
                street_number: dropoffStreetNumber ?? g.street_number,
                zip_code: dropoffZip ?? g.zip_code,
                city: dropoffCity ?? g.city
              }
            : g
        )
      );
    }

    // Return mode auto-selection — normalise legacy values
    const rawPolicy = b.returnPolicy ?? b.return_policy ?? 'none';
    let returnMode: ReturnMode = 'none';
    if (rawPolicy === 'time_tbd' || rawPolicy === 'create_placeholder')
      returnMode = 'time_tbd';
    else if (rawPolicy === 'exact') returnMode = 'exact';
    form.setValue('return_mode', returnMode);
    hasInitializedReturnDateRef.current = false;
  }, [selectedBillingType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Default return date to Hinfahrt date
  React.useEffect(() => {
    if (
      watchedReturnMode !== 'exact' ||
      !watchedScheduledAt ||
      hasInitializedReturnDateRef.current
    )
      return;
    form.setValue(
      'return_date',
      new Date(
        watchedScheduledAt.getFullYear(),
        watchedScheduledAt.getMonth(),
        watchedScheduledAt.getDate()
      ),
      { shouldValidate: true }
    );
    hasInitializedReturnDateRef.current = true;
  }, [watchedReturnMode, watchedScheduledAt, form]);

  const billingBehavior = React.useMemo(
    () => normalizeBillingTypeBehavior(selectedBillingType?.behavior_profile),
    [selectedBillingType]
  );

  const behavior = billingBehavior;

  const isPickupLocked = behavior.lockPickup;
  const isDropoffLocked = behavior.lockDropoff;
  // Hide Rückfahrt block when explicitly locked OR when billing type mandates no return trip
  const isReturnModeLocked =
    behavior.lockReturnMode ||
    (selectedBillingType != null && behavior.returnPolicy === 'none');
  const requirePassenger = billingBehavior.requirePassenger;

  // ── Passenger helpers ──────────────────────────────────────────────────────

  const addPassenger = React.useCallback(
    (
      p: Omit<
        PassengerEntry,
        'pickup_station' | 'dropoff_group_uid' | 'dropoff_station'
      >
    ) => {
      setPassengers((prev) => [
        ...prev,
        {
          ...p,
          pickup_station: '',
          dropoff_group_uid: null,
          dropoff_station: ''
        }
      ]);
      setFormErrors((e) => ({ ...e, passengers: undefined }));
    },
    []
  );

  const removePassenger = React.useCallback((uid: string) => {
    setPassengers((prev) => prev.filter((p) => p.uid !== uid));
  }, []);

  const updatePassengerStation = React.useCallback(
    (
      uid: string,
      field: 'pickup_station' | 'dropoff_station',
      value: string
    ) => {
      setPassengers((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const updatePassengerWheelchair = React.useCallback(
    (uid: string, value: boolean) => {
      setPassengers((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, is_wheelchair: value } : p))
      );
    },
    []
  );

  const updatePassengerName = React.useCallback(
    (uid: string, field: 'first_name' | 'last_name', value: string) => {
      setPassengers((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const assignToDropoff = React.useCallback(
    (passengerUid: string, dropoffGroupUid: string) => {
      setPassengers((prev) =>
        prev.map((p) =>
          p.uid === passengerUid
            ? { ...p, dropoff_group_uid: dropoffGroupUid }
            : p
        )
      );
      setFormErrors((e) => ({ ...e, unassigned: undefined }));
    },
    []
  );

  const unassignFromDropoff = React.useCallback((passengerUid: string) => {
    setPassengers((prev) =>
      prev.map((p) =>
        p.uid === passengerUid ? { ...p, dropoff_group_uid: null } : p
      )
    );
  }, []);

  // ── Pickup group helpers ───────────────────────────────────────────────────

  const addPickupGroup = () => {
    setPickupGroups((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), address: '' }
    ]);
  };

  const removePickupGroup = (uid: string) => {
    if (pickupGroups.length <= 1) return;
    const remaining = pickupGroups.filter((g) => g.uid !== uid);
    const fallback = remaining[0].uid;
    setPassengers((prev) =>
      prev.map((p) =>
        p.pickup_group_uid === uid ? { ...p, pickup_group_uid: fallback } : p
      )
    );
    setPickupGroups(remaining);
  };

  const updatePickupAddress = (uid: string, result: AddressResult | string) => {
    const isString = typeof result === 'string';
    const address = isString ? result : result.address;

    setPickupGroups((prev) =>
      prev.map((g) =>
        g.uid === uid
          ? {
              ...g,
              address,
              street: isString ? g.street : result.street,
              street_number: isString ? g.street_number : result.street_number,
              zip_code: isString ? g.zip_code : result.zip_code,
              city: isString ? g.city : result.city,
              lat: isString ? g.lat : result.lat,
              lng: isString ? g.lng : result.lng
            }
          : g
      )
    );
    setFormErrors((e) => ({
      ...e,
      pickupGroups: { ...e.pickupGroups, [uid]: false }
    }));
    // Sync first dropoff group when prefillDropoffFromPickup is active
    if (behavior.prefillDropoffFromPickup) {
      setDropoffGroups((prev) =>
        prev.map((g, i) =>
          i === 0
            ? {
                ...g,
                address,
                street: isString ? g.street : result.street,
                street_number: isString
                  ? g.street_number
                  : result.street_number,
                zip_code: isString ? g.zip_code : result.zip_code,
                city: isString ? g.city : result.city,
                lat: isString ? g.lat : result.lat,
                lng: isString ? g.lng : result.lng
              }
            : g
        )
      );
    }
  };

  // ── Dropoff group helpers ──────────────────────────────────────────────────

  const addDropoffGroup = () => {
    setDropoffGroups((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), address: '' }
    ]);
  };

  const removeDropoffGroup = (uid: string) => {
    if (dropoffGroups.length <= 1) return;
    setPassengers((prev) =>
      prev.map((p) =>
        p.dropoff_group_uid === uid ? { ...p, dropoff_group_uid: null } : p
      )
    );
    setDropoffGroups((prev) => prev.filter((g) => g.uid !== uid));
  };

  const updateDropoffAddress = (
    uid: string,
    result: AddressResult | string
  ) => {
    const isString = typeof result === 'string';
    const address = isString ? result : result.address;

    setDropoffGroups((prev) =>
      prev.map((g) =>
        g.uid === uid
          ? {
              ...g,
              address,
              street: isString ? g.street : result.street,
              street_number: isString ? g.street_number : result.street_number,
              zip_code: isString ? g.zip_code : result.zip_code,
              city: isString ? g.city : result.city,
              lat: isString ? g.lat : result.lat,
              lng: isString ? g.lng : result.lng
            }
          : g
      )
    );
    setFormErrors((e) => ({
      ...e,
      dropoffGroups: { ...e.dropoffGroups, [uid]: false }
    }));
  };

  // ── Address choice from client selection ──────────────────────────────────

  const handleAddressChoice = React.useCallback(
    (
      payload: {
        address: string;
        street: string;
        street_number: string;
        zip_code: string;
        city: string;
      },
      type: 'pickup' | 'dropoff',
      pickupGroupUid: string
    ) => {
      const result: AddressResult = {
        address:
          payload.address ||
          [
            [payload.street, payload.street_number].filter(Boolean).join(' '),
            [payload.zip_code, payload.city].filter(Boolean).join(' ')
          ]
            .filter(Boolean)
            .join(', '),
        street: payload.street,
        street_number: payload.street_number,
        zip_code: payload.zip_code,
        city: payload.city
      };

      if (type === 'pickup') {
        updatePickupAddress(pickupGroupUid, result);
      } else {
        const firstEmpty = dropoffGroups.find((g) => !g.address.trim());
        const target = firstEmpty ?? dropoffGroups[0];
        if (target) updateDropoffAddress(target.uid, result);
      }
    },
    [dropoffGroups] // eslint-disable-line react-hooks-exhaustive-deps
  );

  const handleManualAddressFieldChange = (
    uid: string,
    type: 'pickup' | 'dropoff',
    field: keyof AddressGroupEntry,
    value: string
  ) => {
    const setter = type === 'pickup' ? setPickupGroups : setDropoffGroups;
    setter((prev) =>
      prev.map((g) => {
        if (g.uid === uid) {
          const updated = { ...g, [field]: value };
          // Re-construct the full address string for backward compatibility/display
          const streetStr = [updated.street, updated.street_number]
            .filter(Boolean)
            .join(' ');
          const cityStr = [updated.zip_code, updated.city]
            .filter(Boolean)
            .join(' ');
          updated.address = [streetStr, cityStr].filter(Boolean).join(', ');
          return updated;
        }
        return g;
      })
    );
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const parallelDirty =
    passengers.length > 0 ||
    pickupGroups.some((g) => g.address.trim().length > 0) ||
    dropoffGroups.some((g) => g.address.trim().length > 0);
  const combinedDirty = rhfDirty || parallelDirty;

  React.useEffect(() => {
    onDirtyChange?.(combinedDirty);
  }, [combinedDirty, onDirtyChange]);

  const unassignedPassengers = passengers.filter((p) => !p.dropoff_group_uid);

  const getPickupGroupPassengers = (groupUid: string) =>
    passengers.filter((p) => p.pickup_group_uid === groupUid);

  const getDropoffGroupPassengers = (groupUid: string) =>
    passengers.filter((p) => p.dropoff_group_uid === groupUid);

  const ensureGroupHasCoords = async (
    group: AddressGroupEntry
  ): Promise<AddressGroupEntry> => {
    if (typeof group.lat === 'number' && typeof group.lng === 'number') {
      return group;
    }

    if (!group.street && !group.address) {
      return group;
    }

    try {
      const response = await fetch('/api/geocode-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: group.street,
          street_number: group.street_number,
          zip_code: group.zip_code,
          city: group.city
        })
      });

      if (!response.ok) {
        return group;
      }

      const data = (await response.json()) as { lat?: number; lng?: number };
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { ...group, lat: data.lat, lng: data.lng };
      }
    } catch {
      // ignore and fall back to original group
    }

    return group;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (values: TripFormValues) => {
    // Custom validation
    const errors: typeof formErrors = {};
    let hasCustomError = false;

    if (requirePassenger && passengers.length === 0) {
      errors.passengers = 'Bitte mindestens einen Fahrgast hinzufügen.';
      hasCustomError = true;
    }

    const pickupGroupErrors: Record<string, boolean> = {};
    pickupGroups.forEach((g) => {
      if (!g.address.trim()) {
        pickupGroupErrors[g.uid] = true;
        hasCustomError = true;
      }
    });
    if (Object.keys(pickupGroupErrors).length > 0)
      errors.pickupGroups = pickupGroupErrors;

    const dropoffGroupErrors: Record<string, boolean> = {};
    dropoffGroups.forEach((g) => {
      if (!g.address.trim()) {
        dropoffGroupErrors[g.uid] = true;
        hasCustomError = true;
      }
    });
    if (Object.keys(dropoffGroupErrors).length > 0)
      errors.dropoffGroups = dropoffGroupErrors;

    if (requirePassenger) {
      const stillUnassigned = passengers.filter((p) => !p.dropoff_group_uid);
      if (stillUnassigned.length > 0) {
        errors.unassigned = true;
        hasCustomError = true;
      }
    }

    if (hasCustomError) {
      setFormErrors(errors);
      toast.error('Bitte alle Pflichtfelder ausfüllen.');
      if (errors.passengers || errors.pickupGroups) {
        scrollToCreateTripSection('pickup');
      } else if (errors.dropoffGroups || errors.unassigned) {
        scrollToCreateTripSection('dropoff');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      let companyId: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('accounts')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id ?? null;
      }

      const resolvedPickupGroups = await Promise.all(
        pickupGroups.map((g) => ensureGroupHasCoords(g))
      );
      const resolvedDropoffGroups = await Promise.all(
        dropoffGroups.map((g) => ensureGroupHasCoords(g))
      );

      const pickupGroupMap = Object.fromEntries(
        resolvedPickupGroups.map((g) => [g.uid, g])
      );
      const dropoffGroupMap = Object.fromEntries(
        resolvedDropoffGroups.map((g) => [g.uid, g])
      );

      // group_id only applies when multiple passengers are bundled together in one dispatch
      const groupId = passengers.length > 1 ? crypto.randomUUID() : null;
      const shouldCreateReturn =
        values.return_mode === 'time_tbd' || values.return_mode === 'exact';

      const returnScheduledAt =
        values.return_mode !== 'exact'
          ? null
          : (() => {
              const date = values.return_date!;
              const [hh, mm] = (values.return_time || '').split(':');
              return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                parseInt(hh || '0', 10),
                parseInt(mm || '0', 10),
                0,
                0
              ).toISOString();
            })();

      const driverId =
        values.driver_id && values.driver_id !== '__none__'
          ? values.driver_id
          : null;

      const baseTrip = {
        payer_id: values.payer_id,
        billing_type_id: values.billing_type_id || null,
        driver_id: driverId,
        notes: values.notes || null,
        status: (getStatusWhenDriverChanges('pending', driverId) ??
          'pending') as 'pending' | 'assigned',
        company_id: companyId,
        created_by: user?.id || null,
        stop_updates: [] as any[]
      };

      let outboundTrips: Awaited<ReturnType<typeof tripsService.createTrip>>[];
      let tripCount: number;

      if (!requirePassenger) {
        // Anonymous mode: create 1 trip using address group addresses directly
        const pickupGroup = resolvedPickupGroups[0];
        const dropoffGroup = resolvedDropoffGroups[0];

        const pickupHasCoords =
          typeof pickupGroup.lat === 'number' &&
          typeof pickupGroup.lng === 'number';
        const dropoffHasCoords =
          typeof dropoffGroup.lat === 'number' &&
          typeof dropoffGroup.lng === 'number';

        let outboundDrivingDistanceKm: number | null = null;
        let outboundDrivingDurationSeconds: number | null = null;

        if (pickupHasCoords && dropoffHasCoords) {
          const metrics = await getDrivingMetrics(
            pickupGroup.lat as number,
            pickupGroup.lng as number,
            dropoffGroup.lat as number,
            dropoffGroup.lng as number
          );

          if (metrics) {
            outboundDrivingDistanceKm = metrics.distanceKm;
            outboundDrivingDurationSeconds = metrics.durationSeconds;
          }
        }

        const outbound = await tripsService.createTrip({
          ...baseTrip,
          is_wheelchair: values.is_wheelchair,
          client_id: null,
          client_name: null,
          client_phone: null,
          scheduled_at: values.scheduled_at.toISOString(),
          pickup_address: pickupGroup.address || '',
          pickup_street: pickupGroup.street || null,
          pickup_street_number: pickupGroup.street_number || null,
          pickup_zip_code: pickupGroup.zip_code || null,
          pickup_city: pickupGroup.city || null,
          pickup_lat: pickupGroup.lat || null,
          pickup_lng: pickupGroup.lng || null,
          pickup_station: null,
          dropoff_address: dropoffGroup.address || '',
          dropoff_street: dropoffGroup.street || null,
          dropoff_street_number: dropoffGroup.street_number || null,
          dropoff_zip_code: dropoffGroup.zip_code || null,
          dropoff_city: dropoffGroup.city || null,
          dropoff_lat: dropoffGroup.lat || null,
          dropoff_lng: dropoffGroup.lng || null,
          dropoff_station: null,
          group_id: null,
          driving_distance_km: outboundDrivingDistanceKm,
          driving_duration_seconds: outboundDrivingDurationSeconds
        } as any);
        outboundTrips = [outbound];
        tripCount = 1;

        if (shouldCreateReturn) {
          let returnDrivingDistanceKm: number | null = null;
          let returnDrivingDurationSeconds: number | null = null;

          if (pickupHasCoords && dropoffHasCoords) {
            const metrics = await getDrivingMetrics(
              dropoffGroup.lat as number,
              dropoffGroup.lng as number,
              pickupGroup.lat as number,
              pickupGroup.lng as number
            );

            if (metrics) {
              returnDrivingDistanceKm = metrics.distanceKm;
              returnDrivingDurationSeconds = metrics.durationSeconds;
            }
          }

          await tripsService.createTrip({
            ...baseTrip,
            is_wheelchair: values.is_wheelchair,
            client_id: null,
            client_name: null,
            client_phone: null,
            driver_id: null,
            scheduled_at: returnScheduledAt,
            pickup_address: dropoffGroup.address || '',
            pickup_street: dropoffGroup.street || null,
            pickup_street_number: dropoffGroup.street_number || null,
            pickup_zip_code: dropoffGroup.zip_code || null,
            pickup_city: dropoffGroup.city || null,
            pickup_lat: dropoffGroup.lat || null,
            pickup_lng: dropoffGroup.lng || null,
            pickup_station: null,
            dropoff_address: pickupGroup.address || '',
            dropoff_street: pickupGroup.street || null,
            dropoff_street_number: pickupGroup.street_number || null,
            dropoff_zip_code: pickupGroup.zip_code || null,
            dropoff_city: pickupGroup.city || null,
            dropoff_lat: pickupGroup.lat || null,
            dropoff_lng: pickupGroup.lng || null,
            dropoff_station: null,
            group_id: null,
            // link_type marks this as the Rückfahrt so the direction can be
            // determined from the trip row alone, without joining the partner.
            link_type: 'return',
            linked_trip_id: outbound.id,
            driving_distance_km: returnDrivingDistanceKm,
            driving_duration_seconds: returnDrivingDurationSeconds
          } as any);
        }
      } else {
        // Passenger mode: each passenger has their own is_wheelchair flag
        outboundTrips = await Promise.all(
          passengers.map((p, idx) => {
            const pickupGroup = pickupGroupMap[p.pickup_group_uid];
            const dropoffGroup = dropoffGroupMap[p.dropoff_group_uid!];

            const pickupHasCoords =
              typeof pickupGroup?.lat === 'number' &&
              typeof pickupGroup?.lng === 'number';
            const dropoffHasCoords =
              typeof dropoffGroup?.lat === 'number' &&
              typeof dropoffGroup?.lng === 'number';

            return tripsService.createTrip({
              ...baseTrip,
              is_wheelchair: p.is_wheelchair,
              client_id: p.client_id || null,
              client_name:
                [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
              client_phone: p.phone || null,
              scheduled_at: values.scheduled_at.toISOString(),
              pickup_address: pickupGroup?.address || '',
              pickup_street: pickupGroup?.street || null,
              pickup_street_number: pickupGroup?.street_number || null,
              pickup_zip_code: pickupGroup?.zip_code || null,
              pickup_city: pickupGroup?.city || null,
              pickup_lat: pickupGroup?.lat || null,
              pickup_lng: pickupGroup?.lng || null,
              pickup_station: p.pickup_station || null,
              dropoff_address: dropoffGroup?.address || '',
              dropoff_street: dropoffGroup?.street || null,
              dropoff_street_number: dropoffGroup?.street_number || null,
              dropoff_zip_code: dropoffGroup?.zip_code || null,
              dropoff_city: dropoffGroup?.city || null,
              dropoff_lat: dropoffGroup?.lat || null,
              dropoff_lng: dropoffGroup?.lng || null,
              dropoff_station: p.dropoff_station || null,
              group_id: groupId,
              stop_order: passengers.length > 1 ? idx + 1 : null,
              // For passenger mode, we currently compute driving distance in the backfill script
              // to avoid excessive synchronous API calls when creating many trips at once.
              driving_distance_km: null,
              driving_duration_seconds: null
            } as any);
          })
        );
        tripCount = passengers.length;

        if (shouldCreateReturn) {
          await Promise.all(
            outboundTrips.map((outbound, idx) => {
              const p = passengers[idx];
              const pickupGroup = pickupGroupMap[p.pickup_group_uid];
              const dropoffGroup = dropoffGroupMap[p.dropoff_group_uid!];

              const pickupHasCoords =
                typeof pickupGroup?.lat === 'number' &&
                typeof pickupGroup?.lng === 'number';
              const dropoffHasCoords =
                typeof dropoffGroup?.lat === 'number' &&
                typeof dropoffGroup?.lng === 'number';

              return (async () => {
                let drivingDistanceKm: number | null = null;
                let drivingDurationSeconds: number | null = null;

                if (pickupHasCoords && dropoffHasCoords) {
                  const metrics = await getDrivingMetrics(
                    dropoffGroup!.lat as number,
                    dropoffGroup!.lng as number,
                    pickupGroup!.lat as number,
                    pickupGroup!.lng as number
                  );

                  if (metrics) {
                    drivingDistanceKm = metrics.distanceKm;
                    drivingDurationSeconds = metrics.durationSeconds;
                  }
                }

                return tripsService.createTrip({
                  ...baseTrip,
                  is_wheelchair: p.is_wheelchair,
                  client_id: p.client_id || null,
                  client_name:
                    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
                    null,
                  client_phone: p.phone || null,
                  driver_id: null,
                  scheduled_at: returnScheduledAt,
                  pickup_address: dropoffGroup?.address || '',
                  pickup_street: dropoffGroup?.street || null,
                  pickup_street_number: dropoffGroup?.street_number || null,
                  pickup_zip_code: dropoffGroup?.zip_code || null,
                  pickup_city: dropoffGroup?.city || null,
                  pickup_lat: dropoffGroup?.lat || null,
                  pickup_lng: dropoffGroup?.lng || null,
                  pickup_station: p.dropoff_station || null,
                  dropoff_address: pickupGroup?.address || '',
                  dropoff_street: pickupGroup?.street || null,
                  dropoff_street_number: pickupGroup?.street_number || null,
                  dropoff_zip_code: pickupGroup?.zip_code || null,
                  dropoff_city: pickupGroup?.city || null,
                  dropoff_lat: pickupGroup?.lat || null,
                  dropoff_lng: pickupGroup?.lng || null,
                  dropoff_station: p.pickup_station || null,
                  group_id: null,
                  // link_type marks this as the Rückfahrt so the direction can
                  // be determined from the trip row alone without joining partner.
                  link_type: 'return',
                  linked_trip_id: outbound.id,
                  driving_distance_km: drivingDistanceKm,
                  driving_duration_seconds: drivingDurationSeconds
                } as any);
              })();
            })
          );
        }
      }

      toast.success(
        shouldCreateReturn
          ? `${tripCount} Hin- und Rückfahrt${tripCount > 1 ? 'en' : ''} erfolgreich erstellt!`
          : `${tripCount} Fahrt${tripCount > 1 ? 'en' : ''} erfolgreich erstellt!`
      );
      clearDraftStorage();
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPayerSelected = !!watchedPayerId;
  const sectionsContext: TripFormSectionsContextType = {
    form,
    isSubmitting,
    onCancel,
    onClientSelect,
    hasInitializedReturnDateRef,
    watchedPayerId,
    watchedBillingTypeId,
    watchedIsWheelchair,
    watchedReturnMode,
    watchedScheduledAt,
    payers,
    billingTypes,
    drivers,
    isLoading,
    searchClients,
    selectedBillingType,
    passengers,
    pickupGroups,
    dropoffGroups,
    formErrors,
    billingBehavior,
    requirePassenger,
    isPickupLocked,
    isDropoffLocked,
    isReturnModeLocked,
    isPayerSelected,
    unassignedPassengers,
    getPickupGroupPassengers,
    getDropoffGroupPassengers,
    addPassenger,
    removePassenger,
    updatePassengerStation,
    updatePassengerWheelchair,
    updatePassengerName,
    assignToDropoff,
    unassignFromDropoff,
    addPickupGroup,
    removePickupGroup,
    updatePickupAddress,
    addDropoffGroup,
    removeDropoffGroup,
    updateDropoffAddress,
    handleAddressChoice,
    handleManualAddressFieldChange
  };

  return (
    <TripFormSectionsProvider value={sectionsContext}>
      <Form
        form={form as any}
        onSubmit={form.handleSubmit(handleSubmit as any, handleRhfInvalid)}
        className='flex min-h-0 flex-1 flex-col gap-0'
      >
        {showRestoreBanner ? (
          <div className='bg-muted/40 border-border space-y-2 border-b px-4 py-3 sm:px-6'>
            <p className='text-foreground text-sm font-medium'>
              Gespeicherter Entwurf
              {draftStorageHint ? ` (${draftStorageHint})` : ''}
            </p>
            <p className='text-muted-foreground text-xs'>
              Nur auf diesem Gerät gespeichert. Daten können personenbezogen
              sein.
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                className='min-h-10 touch-manipulation'
                onClick={applyPendingDraft}
              >
                Fortsetzen
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='min-h-10 touch-manipulation'
                onClick={discardPendingDraft}
              >
                Verwerfen
              </Button>
            </div>
          </div>
        ) : null}
        <CreateTripPayerSection />
        <Separator />
        <CreateTripPickupSection />
        <Separator />
        <CreateTripDropoffSection />
        <Separator />
        <CreateTripScheduleSection />
        <Separator />
        <CreateTripExtrasSection />
        <CreateTripFormFooter />
      </Form>
    </TripFormSectionsProvider>
  );
}
