'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { tripsService } from '@/features/trips/api/trips.service';
import { getDrivingMetrics } from '@/lib/google-directions';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import {
  Navigation,
  CalendarClock,
  CreditCard,
  Car,
  Accessibility,
  StickyNote,
  ChevronRight,
  MapPin,
  Plus,
  Users,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressGroupCard } from './address-group-card';
import { AddressAutocomplete } from './address-autocomplete';
import type { PassengerEntry, AddressGroupEntry } from '@/features/trips/types';
import type { AddressResult } from './address-autocomplete';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';

type ReturnMode = 'none' | 'time_tbd' | 'exact';

const tripFormSchema = z
  .object({
    payer_id: z.string().min(1, 'Kostenträger ist erforderlich'),
    billing_type_id: z.string().optional(),
    scheduled_at: z.date({ error: 'Datum und Uhrzeit sind erforderlich' }),
    return_mode: z.enum(['none', 'time_tbd', 'exact']).default('none'),
    return_date: z.date().optional(),
    return_time: z
      .union([
        z.literal(''),
        z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Bitte ein gültiges Zeitformat verwenden (HH:MM)'
          )
      ])
      .optional(),
    driver_id: z.string().optional(),
    is_wheelchair: z.boolean(),
    notes: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.return_mode === 'exact') {
      if (!data.return_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Datum auswählen.',
          path: ['return_date']
        });
      }
      if (!data.return_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bitte Rückfahrt-Uhrzeit auswählen.',
          path: ['return_time']
        });
      }
    }
  });

type TripFormValues = z.infer<typeof tripFormSchema>;

interface CreateTripFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onClientSelect?: (client: ClientOption | null) => void;
  /**
   * Optional client id to preselect when opening the form
   * globally (e.g. via Cmd+K \"Neue Fahrt für [Name]\").
   */
  preselectedClientId?: string;
}

export function CreateTripForm({
  onSuccess,
  onCancel,
  onClientSelect,
  preselectedClientId
}: CreateTripFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const hasInitializedReturnDateRef = React.useRef(false);

  // Dynamic multi-passenger state
  const [passengers, setPassengers] = React.useState<PassengerEntry[]>([]);
  const [pickupGroups, setPickupGroups] = React.useState<AddressGroupEntry[]>([
    { uid: crypto.randomUUID(), address: '' }
  ]);
  const [dropoffGroups, setDropoffGroups] = React.useState<AddressGroupEntry[]>(
    [{ uid: crypto.randomUUID(), address: '' }]
  );

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

  // When preselectedClientId is provided (e.g. from Cmd+K),
  // resolve it to a ClientOption once on mount and notify the parent.
  React.useEffect(() => {
    if (!preselectedClientId || !onClientSelect) return;

    let isActive = true;

    const resolveClient = async () => {
      const client = await searchClientsById(preselectedClientId);
      if (client && isActive) {
        onClientSelect(client);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resolveClient();

    return () => {
      isActive = false;
    };
  }, [preselectedClientId, onClientSelect, searchClientsById]);

  // Reset billing type when payer changes
  React.useEffect(() => {
    form.setValue('billing_type_id', '');
  }, [watchedPayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedBillingType = billingTypes.find(
    (bt) => bt.id === watchedBillingTypeId
  );

  // Apply all behavior profile rules when billing type changes
  React.useEffect(() => {
    if (!selectedBillingType?.behavior_profile) return;
    const b = selectedBillingType.behavior_profile as any;

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

  // Normalise behavior profile with backward compat for legacy field names
  const behavior = React.useMemo(() => {
    const b = (selectedBillingType?.behavior_profile || {}) as any;
    const legacyShowPickup = b.showPickupPassenger ?? b.show_pickup_passenger;
    const legacyShowDropoff =
      b.showDropoffPassenger ?? b.show_dropoff_passenger;
    const rawPolicy: string | null = b.returnPolicy ?? b.return_policy ?? null;
    return {
      returnPolicy: rawPolicy as 'none' | 'time_tbd' | 'exact' | null,
      lockPickup: !!(b.lockPickup ?? b.lock_pickup ?? false),
      lockDropoff: !!(b.lockDropoff ?? b.lock_dropoff ?? false),
      // lockReturnMode is also implicitly true when returnPolicy === 'none'
      lockReturnMode: !!(b.lockReturnMode ?? b.lock_return_mode ?? false),
      prefillDropoffFromPickup: !!(
        b.prefillDropoffFromPickup ??
        b.prefill_dropoff_from_pickup ??
        false
      ),
      requirePassenger:
        b.requirePassenger !== undefined
          ? !!b.requirePassenger
          : legacyShowPickup !== false && legacyShowDropoff !== false
    };
  }, [selectedBillingType]);

  const isPickupLocked = behavior.lockPickup;
  const isDropoffLocked = behavior.lockDropoff;
  // Hide Rückfahrt block when explicitly locked OR when billing type mandates no return trip
  const isReturnModeLocked =
    behavior.lockReturnMode ||
    (selectedBillingType != null && behavior.returnPolicy === 'none');
  const requirePassenger = behavior.requirePassenger;

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
          .from('users')
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
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPayerSelected = !!watchedPayerId;

  return (
    <Form
      form={form as any}
      onSubmit={form.handleSubmit(handleSubmit as any)}
      className='flex flex-col gap-0'
    >
      {/* ── Section 1: Kostenträger ── */}
      <div className='px-6 pt-4 pb-4'>
        <div className='mb-3 flex items-center gap-2'>
          <CreditCard className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            Kostenträger
          </span>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <FormField
            control={form.control as any}
            name='payer_id'
            render={({ field }) => (
              <FormItem
                className={cn(
                  watchedPayerId &&
                    billingTypes.length === 0 &&
                    'col-span-2 sm:col-span-1'
                )}
              >
                <FormLabel className='text-xs'>Kostenträger *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className='h-9'>
                      <SelectValue placeholder='Wählen...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {payers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
          {(!watchedPayerId || billingTypes.length > 0) && (
            <FormField
              control={form.control as any}
              name='billing_type_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Abrechnungsart</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchedPayerId}
                  >
                    <FormControl>
                      <SelectTrigger className='h-9'>
                        <SelectValue
                          placeholder={
                            !watchedPayerId
                              ? 'Kostenträger wählen'
                              : 'Wählen...'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billingTypes.map((bt) => (
                        <SelectItem key={bt.id} value={bt.id}>
                          <span className='flex items-center gap-2'>
                            <span
                              className='inline-block h-2 w-2 rounded-full'
                              style={{ backgroundColor: bt.color }}
                            />
                            {bt.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          )}
        </div>
        {selectedBillingType && (
          <div
            className='mt-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium'
            style={{
              backgroundColor: `color-mix(in srgb, ${selectedBillingType.color}, white 85%)`,
              borderLeft: `3px solid ${selectedBillingType.color}`,
              color: selectedBillingType.color
            }}
          >
            <span
              className='inline-block h-1.5 w-1.5 rounded-full'
              style={{ backgroundColor: selectedBillingType.color }}
            />
            {selectedBillingType.name}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Section 2: Abholung ── */}
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
            <Badge
              variant='outline'
              className='ml-auto text-[10px] font-normal'
            >
              Kostenträger wählen
            </Badge>
          )}
        </div>

        {/* Anonymous mode — no passenger UI, just address input */}
        {!requirePassenger ? (
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300'>
              <AlertCircle className='h-3.5 w-3.5 shrink-0' />
              Kein Fahrgastname erforderlich — Fahrt wird anonym erstellt.
            </div>
            {pickupGroups.map((group) => (
              <div key={group.uid} className='flex flex-col gap-2'>
                <div className='grid grid-cols-4 gap-2'>
                  <div className='col-span-3'>
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
                  <div className='col-span-1'>
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
                <div className='grid grid-cols-4 gap-2'>
                  <div className='col-span-1'>
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
                  <div className='col-span-3'>
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
          /* Full passenger mode */
          <div className='flex flex-col gap-3'>
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
                groupLabel={
                  pickupGroups.length > 1
                    ? `Abholadresse ${idx + 1}`
                    : undefined
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

      <Separator />

      {/* ── Section 3: Ziel ── */}
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

        {/* Anonymous mode — single dropoff input */}
        {!requirePassenger ? (
          <div className='flex flex-col gap-3'>
            {dropoffGroups.map((group) => (
              <div key={group.uid} className='flex flex-col gap-2'>
                <div className='grid grid-cols-4 gap-2'>
                  <div className='col-span-3'>
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
                  <div className='col-span-1'>
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
                <div className='grid grid-cols-4 gap-2'>
                  <div className='col-span-1'>
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
                  <div className='col-span-3'>
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
          /* Full passenger mode — unassigned pool + dropoff groups */
          <>
            {unassignedPassengers.length > 0 && (
              <div className='mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
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

            <div className='flex flex-col gap-3'>
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
                    dropoffGroups.length > 1
                      ? `Zieladresse ${idx + 1}`
                      : undefined
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
          </>
        )}
      </div>

      <Separator />

      {/* ── Section 4: Zeit & Route ── */}
      <div className='px-6 py-4'>
        <div className='mb-3 flex items-center gap-2'>
          <CalendarClock className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            Zeit & Route
          </span>
        </div>
        <div className='flex flex-col gap-3'>
          <FormField
            control={form.control as any}
            name='scheduled_at'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>Abfahrtszeit *</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          {/* Rückfahrt block — hidden entirely when locked (mode is set by billing behavior) */}
          {isReturnModeLocked ? (
            watchedReturnMode !== 'none' && (
              <div className='bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-3'>
                <Navigation className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
                <span className='text-muted-foreground text-xs'>
                  {watchedReturnMode === 'time_tbd'
                    ? 'Rückfahrt mit Zeitabsprache wird automatisch erstellt.'
                    : 'Rückfahrt mit genauer Zeit wird automatisch erstellt.'}
                </span>
                <Badge
                  variant='secondary'
                  className='ml-auto text-[9px] font-normal'
                >
                  Gesperrt
                </Badge>
              </div>
            )
          ) : (
            <div className='rounded-lg border p-4'>
              <div className='mb-3 flex items-center gap-2'>
                <Navigation className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                  Rückfahrt
                </span>
              </div>
              <div className='flex flex-col gap-3'>
                <FormField
                  control={form.control as any}
                  name='return_mode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Rückfahrt</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v !== 'exact')
                            hasInitializedReturnDateRef.current = false;
                        }}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className='h-9'>
                            <SelectValue placeholder='Wählen...' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>Keine Rückfahrt</SelectItem>
                          <SelectItem value='time_tbd'>
                            Rückfahrt mit Zeitabsprache
                          </SelectItem>
                          <SelectItem value='exact'>
                            Rückfahrt mit genauer Zeit
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {watchedReturnMode === 'exact' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control as any}
                      name='return_date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Datum</FormLabel>
                          <FormControl>
                            <Input
                              type='date'
                              value={
                                field.value
                                  ? format(field.value, 'yyyy-MM-dd')
                                  : ''
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(
                                  v ? new Date(`${v}T00:00:00`) : undefined
                                );
                              }}
                              className='h-9'
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name='return_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Uhrzeit</FormLabel>
                          <FormControl>
                            <Input
                              type='time'
                              value={field.value || ''}
                              onChange={field.onChange}
                              className='h-9'
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Section 5: Fahrer & Extras ── */}
      <div className='px-6 py-4'>
        <div className='mb-3 flex items-center gap-2'>
          <Car className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
            Fahrer & Extras
          </span>
        </div>
        <div className='flex flex-col gap-3'>
          <FormField
            control={form.control as any}
            name='driver_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>Fahrer (optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger className='h-9'>
                      <SelectValue placeholder='Nicht zugewiesen' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='__none__'>Nicht zugewiesen</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          {/* Global wheelchair only for anonymous mode — in passenger mode it lives on each badge */}
          {!requirePassenger && (
            <FormField
              control={form.control as any}
              name='is_wheelchair'
              render={({ field }) => (
                <FormItem>
                  <div
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                      watchedIsWheelchair
                        ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'
                        : 'hover:bg-muted/40'
                    )}
                    onClick={() => field.onChange(!field.value)}
                  >
                    <div className='flex items-center gap-3'>
                      <Accessibility
                        className={cn(
                          'h-4 w-4 transition-colors',
                          watchedIsWheelchair
                            ? 'text-rose-600'
                            : 'text-muted-foreground'
                        )}
                      />
                      <div>
                        <FormLabel className='cursor-pointer text-sm font-medium'>
                          Rollstuhl
                        </FormLabel>
                        <p className='text-muted-foreground text-[11px]'>
                          Fahrt erfordert Rollstuhlbeförderung
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control as any}
            name='notes'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5 text-xs'>
                  <StickyNote className='h-3.5 w-3.5' />
                  Notizen
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Besondere Hinweise...'
                    className='h-20 resize-none text-sm'
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className='bg-muted/30 flex items-center justify-between border-t px-6 py-4'>
        {passengers.length > 0 && (
          <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Users className='h-3.5 w-3.5' />
            <span>
              {passengers.length} Fahrgast{passengers.length !== 1 ? 'e' : ''}
            </span>
          </div>
        )}
        <div className='ml-auto flex items-center gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type='submit'
            size='sm'
            disabled={isSubmitting}
            className='gap-1.5'
          >
            {isSubmitting ? (
              <>
                <span className='border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
                Erstellt...
              </>
            ) : (
              <>
                {passengers.length > 1
                  ? `${passengers.length} Fahrten erstellen`
                  : 'Fahrt erstellen'}
                <ChevronRight className='h-3.5 w-3.5' />
              </>
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
}
