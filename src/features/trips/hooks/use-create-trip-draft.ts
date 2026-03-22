'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TripFormValues } from '@/features/trips/components/create-trip/schema';
import type { AddressGroupEntry, PassengerEntry } from '@/features/trips/types';
import {
  CREATE_TRIP_DRAFT_SCHEMA_VERSION,
  CREATE_TRIP_DRAFT_STORAGE_KEY,
  buildTripFormValuesFromDraft,
  parseCreateTripDraft,
  type CreateTripDraftStored
} from '@/features/trips/lib/create-trip-draft';

const DEBOUNCE_MS = 400;

function serializeDraftPayload(
  values: TripFormValues,
  passengers: PassengerEntry[],
  pickupGroups: AddressGroupEntry[],
  dropoffGroups: AddressGroupEntry[]
): CreateTripDraftStored {
  return {
    schemaVersion: CREATE_TRIP_DRAFT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    values: {
      payer_id: values.payer_id,
      billing_type_id: values.billing_type_id ?? '',
      scheduled_at: values.scheduled_at.toISOString(),
      return_mode: values.return_mode,
      return_date: values.return_date ? values.return_date.toISOString() : null,
      return_time: values.return_time ?? '',
      driver_id: values.driver_id,
      is_wheelchair: values.is_wheelchair,
      notes: values.notes ?? ''
    },
    passengers,
    pickupGroups,
    dropoffGroups
  };
}

export interface UseCreateTripDraftOptions {
  form: UseFormReturn<TripFormValues>;
  passengers: PassengerEntry[];
  pickupGroups: AddressGroupEntry[];
  dropoffGroups: AddressGroupEntry[];
  isSubmitting: boolean;
  onApplyDraft: (draft: CreateTripDraftStored) => void;
}

export interface UseCreateTripDraftResult {
  showRestoreBanner: boolean;
  draftStorageHint: string | null;
  applyPendingDraft: () => void;
  discardPendingDraft: () => void;
  clearDraftStorage: () => void;
}

export function useCreateTripDraft({
  form,
  passengers,
  pickupGroups,
  dropoffGroups,
  isSubmitting,
  onApplyDraft
}: UseCreateTripDraftOptions): UseCreateTripDraftResult {
  const [showRestoreBanner, setShowRestoreBanner] = React.useState(false);
  const [pendingDraft, setPendingDraft] =
    React.useState<CreateTripDraftStored | null>(null);
  const [draftResolved, setDraftResolved] = React.useState(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(CREATE_TRIP_DRAFT_STORAGE_KEY);
    const parsed = parseCreateTripDraft(raw);
    if (parsed) {
      setPendingDraft(parsed);
      setShowRestoreBanner(true);
      setDraftResolved(false);
    } else {
      setDraftResolved(true);
    }
  }, []);

  const clearDraftStorage = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CREATE_TRIP_DRAFT_STORAGE_KEY);
  }, []);

  const applyPendingDraft = React.useCallback(() => {
    if (!pendingDraft) return;
    onApplyDraft(pendingDraft);
    setShowRestoreBanner(false);
    setPendingDraft(null);
    setDraftResolved(true);
  }, [onApplyDraft, pendingDraft]);

  const discardPendingDraft = React.useCallback(() => {
    clearDraftStorage();
    setShowRestoreBanner(false);
    setPendingDraft(null);
    setDraftResolved(true);
  }, [clearDraftStorage]);

  const watched = form.watch();

  React.useEffect(() => {
    if (!draftResolved || isSubmitting || typeof window === 'undefined') {
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const values = form.getValues();
        const payload = serializeDraftPayload(
          values,
          passengers,
          pickupGroups,
          dropoffGroups
        );
        localStorage.setItem(
          CREATE_TRIP_DRAFT_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch {
        // ignore quota / serialization errors
      }
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    watched,
    passengers,
    pickupGroups,
    dropoffGroups,
    draftResolved,
    isSubmitting,
    form
  ]);

  const draftStorageHint = pendingDraft?.updatedAt
    ? new Date(pendingDraft.updatedAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return {
    showRestoreBanner,
    draftStorageHint,
    applyPendingDraft,
    discardPendingDraft,
    clearDraftStorage
  };
}
