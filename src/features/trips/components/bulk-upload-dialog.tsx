'use client';

import * as React from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/file-uploader';
import { tripsService } from '@/features/trips/api/trips.service';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InsertTrip } from '@/features/trips/api/trips.service';
import {
  type ParsedCsvRow,
  type ValidatedTripRow,
  type ValidationIssue,
  type RehydratedTripRow
} from '@/features/trips/components/bulk-upload/bulk-upload-types';
import { matchClient } from '@/features/trips/components/bulk-upload/match-client';
import { ResolveClientsStep } from '@/features/trips/components/bulk-upload/resolve-clients-step';
import {
  useBulkUploadResumeStore,
  hasPendingResumeSession
} from '@/features/trips/stores/use-bulk-upload-resume-store';
import type { BillingTypeBehavior } from '@/features/payers/types/payer.types';

interface BulkUploadDialogProps {
  onSuccess?: () => void;
}

/**
 * Parses a dotted group_id CSV value (e.g. "1.2", "tour-abc.3") into its
 * group label and explicit stop order.
 *
 * Format: "<label>.<stopOrder>" where stopOrder is a positive integer.
 * Falls back to { label: raw, stopOrder: null } for old-style labels.
 *
 * Examples:
 *   "1.2"        → { label: "1",        stopOrder: 2 }
 *   "tour-abc.3" → { label: "tour-abc", stopOrder: 3 }
 *   "tour-1"     → { label: "tour-1",   stopOrder: null }  (backward compat)
 */
function parseGroupId(raw: string): {
  label: string;
  stopOrder: number | null;
} {
  const lastDotIndex = raw.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const suffix = raw.slice(lastDotIndex + 1);
    const order = parseInt(suffix, 10);
    if (!isNaN(order) && String(order) === suffix) {
      return { label: raw.slice(0, lastDotIndex), stopOrder: order };
    }
  }
  return { label: raw, stopOrder: null };
}

/**
 * BulkUploadDialog
 *
 * Handles the end‑to‑end CSV import flow for trips:
 * - parses and validates rows
 * - creates trips in bulk
 * - starts a follow‑up wizard to resolve trips without linked clients.
 *
 * The wizard state is persisted to localStorage so an accidental dialog
 * close does not lose progress. Re-opening the dialog shows a resume
 * banner when an unfinished session is found.
 */
export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<{
    success: number;
    errors: string[];
    rows: ValidatedTripRow[];
    returnTripsCreated: number;
    addressOverrides: number;
    /** Number of pair_id groups that were successfully linked as Hin/Rückfahrt pairs. */
    linkedPairsCount: number;
  } | null>(null);
  const [mode, setMode] = React.useState<
    'upload' | 'resume_prompt' | 'resume_loading' | 'resolve_clients' | 'done'
  >('upload');

  // Wizard rows — built either from a fresh upload or rehydrated from DB.
  const [wizardRows, setWizardRows] = React.useState<RehydratedTripRow[]>([]);

  // ── Resume store ──────────────────────────────────────────────────────────
  const resumeStore = useBulkUploadResumeStore();
  const hasPending = hasPendingResumeSession(resumeStore);

  const { payers } = useTripFormData(null);
  const [billingTypes, setBillingTypes] = React.useState<
    { id: string; name: string; payer_id: string; behavior_profile: unknown }[]
  >([]);

  React.useEffect(() => {
    const fetchAllBillingTypes = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('billing_types')
        .select('id, name, payer_id, behavior_profile');
      if (data)
        setBillingTypes(
          data as {
            id: string;
            name: string;
            payer_id: string;
            behavior_profile: unknown;
          }[]
        );
    };
    fetchAllBillingTypes();
  }, []);

  // Show resume prompt when the dialog first opens if there's pending state.
  const handleOpenChange = (next: boolean) => {
    if (next && hasPending && mode === 'upload') {
      setMode('resume_prompt');
    }
    setOpen(next);
  };

  // ── Resume / Discard ──────────────────────────────────────────────────────

  const handleDiscard = () => {
    resumeStore.clear();
    setMode('upload');
  };

  const handleResume = async () => {
    setMode('resume_loading');
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('trips')
        .select(
          'id, client_id, client_name, client_phone, pickup_address, pickup_street, pickup_street_number, pickup_zip_code, pickup_city, dropoff_address, dropoff_street, dropoff_street_number, dropoff_zip_code, dropoff_city, greeting_style'
        )
        .in('id', resumeStore.tripIds)
        .is('client_id', null)
        .not('client_name', 'is', null);

      if (error) throw error;

      const rows: RehydratedTripRow[] = (data || []).map((t: any) => ({
        tripId: t.id as string,
        clientName: t.client_name as string | null,
        // Not recoverable from DB without a migration — wizard falls back to split
        clientFirstName: null,
        clientLastName: null,
        clientPhone: t.client_phone as string | null,
        pickupAddress: t.pickup_address as string | null,
        pickupStreet: t.pickup_street as string | null,
        pickupStreetNumber: t.pickup_street_number as string | null,
        pickupZip: t.pickup_zip_code as string | null,
        pickupCity: t.pickup_city as string | null,
        dropoffAddress: t.dropoff_address as string | null,
        dropoffStreet: t.dropoff_street as string | null,
        dropoffStreetNumber: t.dropoff_street_number as string | null,
        dropoffZip: t.dropoff_zip_code as string | null,
        dropoffCity: t.dropoff_city as string | null,
        greetingStyle: t.greeting_style as string | null
      }));

      if (rows.length === 0) {
        // All trips have been resolved in the meantime – finish up.
        resumeStore.clear();
        setMode('done');
        return;
      }

      // Clamp the stored index to the actual list length.
      const clampedIndex = Math.min(resumeStore.currentIndex, rows.length - 1);
      if (clampedIndex !== resumeStore.currentIndex) {
        resumeStore.setIndex(clampedIndex);
      }

      setWizardRows(rows);
      setMode('resolve_clients');
    } catch {
      toast.error(
        'Fehler beim Laden der offenen Fahrgäste. Bitte versuche es erneut.'
      );
      setMode('resume_prompt');
    }
  };

  // ── CSV parsing helpers ───────────────────────────────────────────────────

  /**
   * Parses a German date string (DD.MM.YY or DD.MM.YYYY).
   * Returns midnight Date on success, null if the format is unrecognisable.
   */
  const parseGermanDateOnly = (dateStr: string): Date | null => {
    try {
      const dateParts = dateStr.trim().split('.');
      if (dateParts.length !== 3) return null;
      let [day, month, year] = dateParts.map(Number);
      if (year < 100) year += 2000;
      const d = new Date(year, month - 1, day, 0, 0, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  /**
   * Formats a Date to YYYY-MM-DD using LOCAL time — not UTC.
   * toISOString() converts to UTC first, which shifts the date back by one day
   * for timezones ahead of UTC (e.g. Germany UTC+1/UTC+2).
   */
  const toLocalISODate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  /**
   * Combines a date string with an optional HH:MM time string.
   *
   * requestedDate is ALWAYS set to the CSV date (local timezone) so the
   * widget date-picker is always pre-filled correctly, regardless of whether
   * a time was provided.
   *
   * Returns:
   *   null                                         — date format invalid (blocking)
   *   { scheduledAt: Date,  requestedDate: 'YYYY-MM-DD' } — date + time valid
   *   { scheduledAt: null,  requestedDate: 'YYYY-MM-DD' } — date ok, time absent/invalid
   */
  const parseDateAndTime = (
    dateStr: string,
    timeStr: string | undefined
  ): { scheduledAt: Date | null; requestedDate: string } | null => {
    const dateOnly = parseGermanDateOnly(dateStr);
    if (!dateOnly) return null;

    const isoDate = toLocalISODate(dateOnly);

    const trimmed = timeStr?.trim() ?? '';
    if (!trimmed) {
      return { scheduledAt: null, requestedDate: isoDate };
    }

    const parts = trimmed.split(':');
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) {
      return { scheduledAt: null, requestedDate: isoDate };
    }

    const full = new Date(dateOnly);
    full.setHours(hours, minutes, 0, 0);
    return isNaN(full.getTime())
      ? { scheduledAt: null, requestedDate: isoDate }
      : { scheduledAt: full, requestedDate: isoDate };
  };

  // ── Billing type behavior helpers ─────────────────────────────────────────

  /**
   * Normalises the raw JSON blob from the DB into a typed BillingTypeBehavior.
   * Handles both legacy snake_case keys from old records and current camelCase.
   */
  const normaliseBehaviorProfile = (raw: unknown): BillingTypeBehavior => {
    const b = (raw ?? {}) as Record<string, unknown>;
    const returnPolicyRaw = (b.returnPolicy ??
      b.return_policy ??
      'none') as string;
    const returnPolicy: BillingTypeBehavior['returnPolicy'] =
      returnPolicyRaw === 'create_placeholder'
        ? 'time_tbd'
        : ((returnPolicyRaw as BillingTypeBehavior['returnPolicy']) ?? 'none');

    return {
      returnPolicy,
      lockReturnMode: Boolean(b.lockReturnMode ?? b.lock_return_mode ?? false),
      lockPickup: Boolean(b.lockPickup ?? b.lock_pickup ?? false),
      lockDropoff: Boolean(b.lockDropoff ?? b.lock_dropoff ?? false),
      prefillDropoffFromPickup: Boolean(
        b.prefillDropoffFromPickup ?? b.prefill_dropoff_from_pickup ?? false
      ),
      requirePassenger: Boolean(
        b.requirePassenger ?? b.show_pickup_passenger ?? true
      ),
      defaultPickup: (b.defaultPickup ?? b.default_pickup ?? null) as
        | string
        | null,
      defaultDropoff: (b.defaultDropoff ?? b.default_dropoff ?? null) as
        | string
        | null,
      defaultPickupStreet: (b.defaultPickupStreet ??
        b.default_pickup_street ??
        null) as string | null,
      defaultPickupStreetNumber: (b.defaultPickupStreetNumber ??
        b.default_pickup_street_number ??
        null) as string | null,
      defaultPickupZip: (b.defaultPickupZip ?? b.default_pickup_zip ?? null) as
        | string
        | null,
      defaultPickupCity: (b.defaultPickupCity ??
        b.default_pickup_city ??
        null) as string | null,
      defaultDropoffStreet: (b.defaultDropoffStreet ??
        b.default_dropoff_street ??
        null) as string | null,
      defaultDropoffStreetNumber: (b.defaultDropoffStreetNumber ??
        b.default_dropoff_street_number ??
        null) as string | null,
      defaultDropoffZip: (b.defaultDropoffZip ??
        b.default_dropoff_zip ??
        null) as string | null,
      defaultDropoffCity: (b.defaultDropoffCity ??
        b.default_dropoff_city ??
        null) as string | null
    };
  };

  /**
   * Applies address locking / prefill rules from a BillingTypeBehavior onto a
   * draft InsertTrip. Returns the (potentially mutated) trip plus flags that
   * tell the caller what was changed.
   */
  const applyBehaviorToTrip = (
    trip: InsertTrip,
    behavior: BillingTypeBehavior
  ): {
    trip: InsertTrip;
    hasAddressOverride: boolean;
    needsReturnTrip: boolean;
  } => {
    let result = { ...trip };
    let hasAddressOverride = false;

    if (
      behavior.lockPickup &&
      (behavior.defaultPickupStreet || behavior.defaultPickup)
    ) {
      const street = behavior.defaultPickupStreet ?? null;
      const streetNumber = behavior.defaultPickupStreetNumber ?? null;
      const zip = behavior.defaultPickupZip ?? null;
      const city = behavior.defaultPickupCity ?? null;
      result = {
        ...result,
        pickup_street: street,
        pickup_street_number: streetNumber,
        pickup_zip_code: zip,
        pickup_city: city,
        pickup_address:
          [
            [street, streetNumber].filter(Boolean).join(' '),
            [zip, city].filter(Boolean).join(' ')
          ]
            .filter(Boolean)
            .join(', ') ||
          behavior.defaultPickup ||
          null
      };
      hasAddressOverride = true;
    }

    if (
      behavior.lockDropoff &&
      (behavior.defaultDropoffStreet || behavior.defaultDropoff)
    ) {
      const street = behavior.defaultDropoffStreet ?? null;
      const streetNumber = behavior.defaultDropoffStreetNumber ?? null;
      const zip = behavior.defaultDropoffZip ?? null;
      const city = behavior.defaultDropoffCity ?? null;
      result = {
        ...result,
        dropoff_street: street,
        dropoff_street_number: streetNumber,
        dropoff_zip_code: zip,
        dropoff_city: city,
        dropoff_address:
          [
            [street, streetNumber].filter(Boolean).join(' '),
            [zip, city].filter(Boolean).join(' ')
          ]
            .filter(Boolean)
            .join(', ') ||
          behavior.defaultDropoff ||
          null
      };
      hasAddressOverride = true;
    }

    if (behavior.prefillDropoffFromPickup) {
      result = {
        ...result,
        dropoff_street: result.pickup_street,
        dropoff_street_number: result.pickup_street_number,
        dropoff_zip_code: result.pickup_zip_code,
        dropoff_city: result.pickup_city,
        dropoff_address: result.pickup_address
      };
    }

    const needsReturnTrip =
      behavior.returnPolicy === 'time_tbd' || behavior.returnPolicy === 'exact';

    return { trip: result, hasAddressOverride, needsReturnTrip };
  };

  /**
   * Builds a return trip from a confirmed outbound trip (post-insert, so outboundId
   * is available). Pickup and dropoff are swapped; geocoordinates are reused.
   */
  const buildReturnTrip = (
    outbound: InsertTrip,
    outboundId: string
  ): InsertTrip => ({
    ...outbound,
    scheduled_at: null,
    requested_date: null,
    link_type: 'return',
    linked_trip_id: outboundId,
    status: 'pending',
    driver_id: null,
    needs_driver_assignment: false,
    // Swap addresses
    pickup_address: outbound.dropoff_address ?? null,
    pickup_street: outbound.dropoff_street ?? null,
    pickup_street_number: outbound.dropoff_street_number ?? null,
    pickup_zip_code: outbound.dropoff_zip_code ?? null,
    pickup_city: outbound.dropoff_city ?? null,
    pickup_station: outbound.dropoff_station ?? null,
    pickup_lat: outbound.dropoff_lat ?? null,
    pickup_lng: outbound.dropoff_lng ?? null,
    dropoff_address: outbound.pickup_address ?? null,
    dropoff_street: outbound.pickup_street ?? null,
    dropoff_street_number: outbound.pickup_street_number ?? null,
    dropoff_zip_code: outbound.pickup_zip_code ?? null,
    dropoff_city: outbound.pickup_city ?? null,
    dropoff_station: outbound.pickup_station ?? null,
    dropoff_lat: outbound.pickup_lat ?? null,
    dropoff_lng: outbound.pickup_lng ?? null
  });

  /**
   * Main CSV processing entrypoint used by the file uploader.
   * Responsible for:
   * - reading the CSV
   * - building ValidatedTripRow entries with issues
   * - inserting successful trips
   * - preparing wizard rows for the client‑resolution step.
   */
  const processCsv = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);
    setMode('upload');
    setWizardRows([]);
    resumeStore.clear();

    const file = files[0];

    Papa.parse<ParsedCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (papaResults) => {
        const rows = papaResults.data;
        const validatedRows: ValidatedTripRow<InsertTrip>[] = [];
        const errors: string[] = [];
        const groupIdMap = new Map<string, string>();

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

        type CompanyClient = {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          zip_code: string | null;
        };

        let companyClients: CompanyClient[] = [];
        const clientsQuery = supabase
          .from('clients')
          .select('id, first_name, last_name, phone, zip_code');

        const { data: clientsData } = companyId
          ? await clientsQuery.eq('company_id', companyId)
          : await clientsQuery;

        companyClients = (clientsData as CompanyClient[]) || [];

        const normalize = (value: string | null | undefined) =>
          (value || '').trim().toLowerCase();

        type CompanyDriver = {
          id: string;
          name: string;
          is_active: boolean | null;
          role: string;
          company_id: string | null;
        };

        let companyDrivers: CompanyDriver[] = [];

        const driversBaseQuery = supabase
          .from('accounts')
          .select('id, name, is_active, role, company_id')
          .eq('role', 'driver')
          .eq('is_active', true);

        const { data: driversData } = companyId
          ? await driversBaseQuery.eq('company_id', companyId)
          : await driversBaseQuery;

        companyDrivers = (driversData as CompanyDriver[]) || [];

        const findMatchingClient = (
          row: ParsedCsvRow
        ): CompanyClient | null => {
          const result = matchClient(
            {
              firstname: row.firstname,
              lastname: row.lastname,
              phone: row.phone,
              pickup_zip: row.pickup_zip
            },
            companyClients
          );
          return result.matched ? (result.client as CompanyClient) : null;
        };

        const findMatchingDriver = (
          row: ParsedCsvRow
        ): CompanyDriver | null => {
          const rawName = row.driver_name;
          if (!rawName) return null;

          const normTarget = normalize(rawName);
          if (!normTarget) return null;

          const candidates = companyDrivers.filter(
            (driver) => normalize(driver.name) === normTarget
          );

          if (candidates.length === 1) return candidates[0];
          return null;
        };

        const splitStreetAndNumber = (
          raw: string | undefined
        ): { street: string | null; streetNumber: string | null } => {
          if (!raw) return { street: null, streetNumber: null };

          const trimmed = raw.trim();
          const match = trimmed.match(/^(.+?)(\s+\d+\s*\w*)$/u);

          if (!match) return { street: trimmed, streetNumber: null };

          return {
            street: match[1].trim() || null,
            streetNumber: match[2].trim() || null
          };
        };

        for (let i = 0; i < rows.length; i++) {
          const rowRaw = rows[i] as any;
          const parsedRow: ParsedCsvRow = {} as ParsedCsvRow;
          Object.keys(rowRaw || {}).forEach((key) => {
            const trimmedKey = key.trim();
            (parsedRow as any)[trimmedKey] = String(rowRaw[key] || '').trim();
          });

          const rowNum = i + 2;
          const issues: ValidationIssue[] = [];

          if (!parsedRow.kostentraeger) {
            issues.push({
              type: 'payer_not_found',
              message: 'Kostenträger ist leer.'
            });
          }

          const payer = payers.find(
            (p) =>
              p.name.toLowerCase() ===
              (parsedRow.kostentraeger || '').toLowerCase()
          );
          if (!payer) {
            issues.push({
              type: 'payer_not_found',
              message: `Kostenträger "${parsedRow.kostentraeger}" nicht gefunden.`
            });
          }

          let billingTypeId: string | null = null;
          if (parsedRow.abrechnungsart && payer) {
            const bt = billingTypes.find(
              (b) =>
                b.name.toLowerCase() ===
                  parsedRow.abrechnungsart!.toLowerCase() &&
                b.payer_id === payer.id
            );
            if (!bt) {
              issues.push({
                type: 'billing_type_not_found',
                message: `Abrechnungsart "${parsedRow.abrechnungsart}" für Kostenträger "${parsedRow.kostentraeger}" nicht gefunden.`
              });
            } else {
              billingTypeId = bt.id;
            }
          }

          const pickupStreetParts = splitStreetAndNumber(
            parsedRow.pickup_street
          );
          const dropoffStreetParts = splitStreetAndNumber(
            parsedRow.dropoff_street
          );

          const pickup_address = `${[
            [pickupStreetParts.street, pickupStreetParts.streetNumber]
              .filter(Boolean)
              .join(' '),
            [parsedRow.pickup_zip, parsedRow.pickup_city]
              .filter(Boolean)
              .join(' ')
          ]
            .filter(Boolean)
            .join(', ')}`;

          const dropoff_address = `${[
            [dropoffStreetParts.street, dropoffStreetParts.streetNumber]
              .filter(Boolean)
              .join(' '),
            [parsedRow.dropoff_zip, parsedRow.dropoff_city]
              .filter(Boolean)
              .join(' ')
          ]
            .filter(Boolean)
            .join(', ')}`;

          const dateTimeResult = parseDateAndTime(
            parsedRow.date,
            parsedRow.time
          );
          if (!dateTimeResult) {
            issues.push({
              type: 'invalid_datetime',
              message: `Ungültiges Datum-Format (erwartet DD.MM.YY): "${parsedRow.date}"`
            });
          }
          const scheduled_at = dateTimeResult?.scheduledAt ?? null;
          const requested_date = dateTimeResult?.requestedDate ?? null;

          let finalGroupId: string | null = null;
          let finalStopOrder: number | null = null;
          if (parsedRow.group_id) {
            const parsed = parseGroupId(parsedRow.group_id);
            const groupLabel = parsed.label;
            finalStopOrder = parsed.stopOrder;
            if (!groupIdMap.has(groupLabel)) {
              groupIdMap.set(groupLabel, crypto.randomUUID());
            }
            finalGroupId = groupIdMap.get(groupLabel) ?? null;
          }

          const fullNameFromCsv =
            `${parsedRow.firstname || ''} ${parsedRow.lastname || ''}`.trim() ||
            null;

          const matchedClient = findMatchingClient(parsedRow);

          const matchedDriver = findMatchingDriver(parsedRow);
          const hasDriverNameFromCsv =
            typeof parsedRow.driver_name === 'string' &&
            parsedRow.driver_name.trim().length > 0;
          const driverId: string | null = matchedDriver?.id ?? null;
          const needsDriverAssignment = hasDriverNameFromCsv && !matchedDriver;
          const status: 'pending' | 'assigned' =
            driverId != null ? 'assigned' : 'pending';

          let builtTrip: InsertTrip | null =
            payer && dateTimeResult
              ? {
                  payer_id: payer.id,
                  billing_type_id: billingTypeId,
                  client_id: matchedClient?.id ?? null,
                  client_name: matchedClient
                    ? `${matchedClient.first_name || ''} ${
                        matchedClient.last_name || ''
                      }`.trim() || null
                    : fullNameFromCsv,
                  client_phone: parsedRow.phone || null,
                  scheduled_at: scheduled_at
                    ? scheduled_at.toISOString()
                    : null,
                  requested_date: requested_date,
                  pickup_address,
                  pickup_street:
                    pickupStreetParts.street || parsedRow.pickup_street || null,
                  pickup_street_number: pickupStreetParts.streetNumber,
                  pickup_zip_code: parsedRow.pickup_zip || null,
                  pickup_city: parsedRow.pickup_city || null,
                  pickup_lat: null,
                  pickup_lng: null,
                  pickup_station: parsedRow.pickup_station || null,
                  dropoff_address,
                  dropoff_street:
                    dropoffStreetParts.street ||
                    parsedRow.dropoff_street ||
                    null,
                  dropoff_street_number: dropoffStreetParts.streetNumber,
                  dropoff_zip_code: parsedRow.dropoff_zip || null,
                  dropoff_city: parsedRow.dropoff_city || null,
                  dropoff_lat: null,
                  dropoff_lng: null,
                  dropoff_station: parsedRow.dropoff_station || null,
                  is_wheelchair:
                    (parsedRow.is_wheelchair || '').toUpperCase() === 'TRUE',
                  notes: parsedRow.notes || null,
                  greeting_style: parsedRow.greeting_style || null,
                  status,
                  company_id: companyId,
                  created_by: user?.id || null,
                  group_id: finalGroupId,
                  stop_order: finalStopOrder,
                  stop_updates: [],
                  has_missing_geodata: true,
                  driver_id: driverId,
                  needs_driver_assignment: needsDriverAssignment,
                  ingestion_source: 'csv_bulk_upload'
                }
              : null;

          // Apply BillingTypeBehavior rules (address overrides, return policy)
          let rowNeedsReturnTrip = false;
          let rowHasAddressOverride = false;
          if (builtTrip && billingTypeId) {
            const btRecord = billingTypes.find((b) => b.id === billingTypeId);
            if (btRecord?.behavior_profile) {
              const behavior = normaliseBehaviorProfile(
                btRecord.behavior_profile
              );
              const applied = applyBehaviorToTrip(builtTrip, behavior);
              builtTrip = applied.trip;
              rowNeedsReturnTrip = applied.needsReturnTrip;
              rowHasAddressOverride = applied.hasAddressOverride;
            }
          }

          // Read the explicit pair_id pairing key from the CSV.
          // A non-empty value means this row is one half of a manually-specified
          // Hin/Rückfahrt pair. Pass 4 will link both trips after insert.
          const pairId = parsedRow.pair_id?.trim() || null;

          // Conflict guard: if the user provided both legs explicitly via pair_id,
          // suppress the billing-type auto-return so we don't create a third trip.
          if (pairId && rowNeedsReturnTrip) {
            rowNeedsReturnTrip = false;
          }

          const matchedClientId: string | null = matchedClient?.id ?? null;

          validatedRows.push({
            rowNumber: rowNum,
            source: parsedRow,
            trip: builtTrip,
            issues,
            clientId: matchedClientId,
            needsReturnTrip: rowNeedsReturnTrip,
            addressOverrideApplied: rowHasAddressOverride,
            pairId,
            pairRowIndex: i
          });
        }

        const successfulRows = validatedRows.filter(
          (row) => row.trip && row.issues.length === 0
        );

        // Geocode pickup/dropoff addresses for successful outbound trips.
        await Promise.all(
          successfulRows.map(async (row) => {
            if (!row.trip) return;

            try {
              const [pickupResult, dropoffResult] = await Promise.all([
                fetch('/api/geocode-address', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    street: row.trip.pickup_street,
                    street_number: row.trip.pickup_street_number,
                    zip_code: row.trip.pickup_zip_code,
                    city: row.trip.pickup_city
                  })
                }),
                fetch('/api/geocode-address', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    street: row.trip.dropoff_street,
                    street_number: row.trip.dropoff_street_number,
                    zip_code: row.trip.dropoff_zip_code,
                    city: row.trip.dropoff_city
                  })
                })
              ]);

              const pickupData = pickupResult.ok
                ? await pickupResult.json()
                : null;
              const dropoffData = dropoffResult.ok
                ? await dropoffResult.json()
                : null;

              if (
                pickupData &&
                typeof pickupData.lat === 'number' &&
                typeof pickupData.lng === 'number'
              ) {
                row.trip.pickup_lat = pickupData.lat;
                row.trip.pickup_lng = pickupData.lng;
              }

              if (
                dropoffData &&
                typeof dropoffData.lat === 'number' &&
                typeof dropoffData.lng === 'number'
              ) {
                row.trip.dropoff_lat = dropoffData.lat;
                row.trip.dropoff_lng = dropoffData.lng;
              }

              if (pickupData) {
                if (pickupData.zip_code) {
                  row.trip.pickup_zip_code = pickupData.zip_code;
                }
                if (pickupData.city) {
                  row.trip.pickup_city = pickupData.city;
                }
              }

              if (dropoffData) {
                if (dropoffData.zip_code) {
                  row.trip.dropoff_zip_code = dropoffData.zip_code;
                }
                if (dropoffData.city) {
                  row.trip.dropoff_city = dropoffData.city;
                }
              }

              row.trip.pickup_address = `${[
                [row.trip.pickup_street, row.trip.pickup_street_number]
                  .filter(Boolean)
                  .join(' '),
                [row.trip.pickup_zip_code, row.trip.pickup_city]
                  .filter(Boolean)
                  .join(' ')
              ]
                .filter(Boolean)
                .join(', ')}`;

              row.trip.dropoff_address = `${[
                [row.trip.dropoff_street, row.trip.dropoff_street_number]
                  .filter(Boolean)
                  .join(' '),
                [row.trip.dropoff_zip_code, row.trip.dropoff_city]
                  .filter(Boolean)
                  .join(' ')
              ]
                .filter(Boolean)
                .join(', ')}`;

              if (
                typeof row.trip.pickup_lat === 'number' &&
                typeof row.trip.pickup_lng === 'number' &&
                typeof row.trip.dropoff_lat === 'number' &&
                typeof row.trip.dropoff_lng === 'number'
              ) {
                row.trip.has_missing_geodata = false;
              }
            } catch {
              // Non-fatal: keep has_missing_geodata = true for later backfill.
            }
          })
        );

        const outboundTrips = successfulRows.map(
          (row) => row.trip!
        ) as InsertTrip[];

        const addressOverrides = successfulRows.filter(
          (r) => r.addressOverrideApplied
        ).length;

        if (outboundTrips.length > 0 && errors.length === 0) {
          try {
            // ── Pass 1: Insert all outbound trips ─────────────────────────────
            const createdOutbound =
              await tripsService.bulkCreateTrips(outboundTrips);

            // ── Pass 2: Build and insert auto-return trips ────────────────────
            // Return trips use the geocoded addresses from the now-inserted
            // outbound trips (just swapped) so no additional geocoding is needed.
            const returnTripPayloads: InsertTrip[] = [];
            const returnToOutboundMap: {
              returnIdx: number;
              outboundId: string;
            }[] = [];

            successfulRows.forEach((row, i) => {
              if (row.needsReturnTrip && createdOutbound[i]) {
                const outboundId = createdOutbound[i].id as string;
                returnTripPayloads.push(
                  buildReturnTrip(outboundTrips[i], outboundId)
                );
                returnToOutboundMap.push({
                  returnIdx: returnTripPayloads.length - 1,
                  outboundId
                });
              }
            });

            let returnTripsCreated = 0;
            if (returnTripPayloads.length > 0) {
              const createdReturn =
                await tripsService.bulkCreateTrips(returnTripPayloads);
              returnTripsCreated = createdReturn.length;

              // ── Pass 3: Backfill linked_trip_id on outbound trips ───────────
              // Also stamp link_type = 'outbound' so getTripDirection() can
              // identify this leg as the Hinfahrt. Without it the fallback in
              // getTripDirection would misread the linked_trip_id as a signal
              // that this trip is the Rückfahrt.
              const supabaseForLinks = createSupabaseClient();
              await Promise.all(
                returnToOutboundMap.map(({ returnIdx, outboundId }) =>
                  supabaseForLinks
                    .from('trips')
                    .update({
                      linked_trip_id: createdReturn[returnIdx].id,
                      link_type: 'outbound'
                    })
                    .eq('id', outboundId)
                )
              );
            }

            // ── Pass 4: Link explicit pair_id pairs ─────────────────────────
            //
            // Collect all successful rows that carried a pair_id into a map keyed
            // by that value. Each group must have exactly 2 members to be linked.
            //
            // Direction is resolved by scheduled_at (earlier = Hinfahrt). When
            // both timestamps are equal or absent, CSV row order determines it
            // (lower pairRowIndex = Hinfahrt).
            //
            // The resulting links are bidirectional: both trips get linked_trip_id,
            // and the Rückfahrt also receives link_type = 'return' so that
            // getTripDirection() and all badge/cancel-dialog logic works correctly.
            let linkedPairsCount = 0;

            type PairMember = {
              insertedId: string;
              scheduledAt: string | null;
              rowIndex: number;
            };

            const pairGroups = new Map<string, PairMember[]>();

            successfulRows.forEach((row, i) => {
              if (!row.pairId) return;
              const insertedId = (createdOutbound[i] as any)?.id as
                | string
                | undefined;
              if (!insertedId) return;
              const existing = pairGroups.get(row.pairId) ?? [];
              existing.push({
                insertedId,
                scheduledAt: row.trip?.scheduled_at ?? null,
                rowIndex: row.pairRowIndex ?? i
              });
              pairGroups.set(row.pairId, existing);
            });

            /**
             * Sorts a pair of PairMembers so that index 0 is the Hinfahrt and
             * index 1 is the Rückfahrt, using the direction-resolution rules:
             *   1. Both have scheduled_at → earlier is Hinfahrt
             *   2. One has time, one doesn't → timed = Hinfahrt
             *   3. Both absent or equal → lower rowIndex = Hinfahrt
             */
            const sortPairMembers = (
              members: PairMember[]
            ): [PairMember, PairMember] => {
              const [a, b] = members;
              const aMs = a.scheduledAt
                ? new Date(a.scheduledAt).getTime()
                : null;
              const bMs = b.scheduledAt
                ? new Date(b.scheduledAt).getTime()
                : null;

              if (aMs !== null && bMs !== null) {
                return aMs <= bMs ? [a, b] : [b, a];
              }
              if (aMs !== null) return [a, b]; // a has time → a is Hinfahrt
              if (bMs !== null) return [b, a]; // b has time → b is Hinfahrt
              return a.rowIndex <= b.rowIndex ? [a, b] : [b, a]; // row order
            };

            const supabaseForPairs = createSupabaseClient();

            await Promise.all(
              Array.from(pairGroups.entries()).map(
                async ([pairKey, members]) => {
                  if (members.length < 2) return; // lone key — skip silently

                  if (members.length > 2) {
                    // Non-blocking warning — trips are created but extra rows are
                    // not linked. The issue is surfaced in the results summary.
                    errors.push(
                      `pair_id "${pairKey}": ${members.length} Zeilen gefunden, nur die ersten 2 werden verknüpft.`
                    );
                  }

                  const [hinfahrt, rueckfahrt] = sortPairMembers(
                    members.slice(0, 2)
                  );

                  await Promise.all([
                    // Hinfahrt: link_type = 'outbound' so getTripDirection()
                    // identifies this leg correctly. Without this the fallback
                    // would misread linked_trip_id as a Rückfahrt signal.
                    supabaseForPairs
                      .from('trips')
                      .update({
                        linked_trip_id: rueckfahrt.insertedId,
                        link_type: 'outbound'
                      })
                      .eq('id', hinfahrt.insertedId),
                    // Rückfahrt: link_type = 'return', linked_trip_id → Hinfahrt
                    supabaseForPairs
                      .from('trips')
                      .update({
                        linked_trip_id: hinfahrt.insertedId,
                        link_type: 'return'
                      })
                      .eq('id', rueckfahrt.insertedId)
                  ]);

                  linkedPairsCount++;
                }
              )
            );

            // Build wizard rows from unresolved outbound trips only.
            const unresolvedCreated = createdOutbound
              .map((trip: any, idx: number) => ({
                createdTrip: trip,
                sourceRow: successfulRows[idx]
              }))
              .filter(
                ({ sourceRow }) =>
                  !sourceRow.clientId &&
                  sourceRow.trip?.client_name &&
                  sourceRow.trip?.ingestion_source === 'csv_bulk_upload'
              );

            const totalCreated = outboundTrips.length + returnTripsCreated;

            // Build a context-aware success toast that mentions pairs when relevant.
            const toastParts: string[] = [];
            toastParts.push(
              `${outboundTrips.length} Fahrt${outboundTrips.length !== 1 ? 'en' : ''}`
            );
            if (returnTripsCreated > 0)
              toastParts.push(
                `${returnTripsCreated} Rückfahrt${returnTripsCreated !== 1 ? 'en' : ''}`
              );
            if (linkedPairsCount > 0)
              toastParts.push(
                `${linkedPairsCount} Paar${linkedPairsCount !== 1 ? 'e' : ''} verknüpft`
              );
            toast.success(`${toastParts.join(' + ')} erfolgreich hochgeladen!`);

            setResults({
              success: totalCreated,
              errors: [],
              rows: validatedRows,
              returnTripsCreated,
              addressOverrides,
              linkedPairsCount
            });
            onSuccess?.();
            router.refresh();

            if (unresolvedCreated.length > 0) {
              const freshRows: RehydratedTripRow[] = unresolvedCreated.map(
                ({ createdTrip, sourceRow }) => ({
                  tripId: createdTrip.id as string,
                  clientName: sourceRow.trip?.client_name ?? null,
                  clientFirstName: sourceRow.source.firstname?.trim() || null,
                  clientLastName: sourceRow.source.lastname?.trim() || null,
                  clientPhone: sourceRow.trip?.client_phone ?? null,
                  pickupAddress: sourceRow.trip?.pickup_address ?? null,
                  pickupStreet: sourceRow.trip?.pickup_street ?? null,
                  pickupStreetNumber:
                    sourceRow.trip?.pickup_street_number ?? null,
                  pickupZip: sourceRow.trip?.pickup_zip_code ?? null,
                  pickupCity: sourceRow.trip?.pickup_city ?? null,
                  dropoffAddress: sourceRow.trip?.dropoff_address ?? null,
                  dropoffStreet: sourceRow.trip?.dropoff_street ?? null,
                  dropoffStreetNumber:
                    sourceRow.trip?.dropoff_street_number ?? null,
                  dropoffZip: sourceRow.trip?.dropoff_zip_code ?? null,
                  dropoffCity: sourceRow.trip?.dropoff_city ?? null,
                  greetingStyle: sourceRow.trip?.greeting_style ?? null
                })
              );

              resumeStore.start(freshRows.map((r) => r.tripId));
              setWizardRows(freshRows);
              setMode('resolve_clients');
            } else {
              setMode('done');
              setTimeout(() => setOpen(false), 2000);
            }
          } catch (e: any) {
            errors.push(`Datenbankfehler: ${e.message}`);
            setResults({
              success: 0,
              errors,
              rows: validatedRows,
              returnTripsCreated: 0,
              addressOverrides: 0,
              linkedPairsCount: 0
            });
          }
        } else {
          const combinedErrors =
            errors.length > 0
              ? errors
              : validatedRows
                  .filter((r) => r.issues.length > 0)
                  .flatMap((r) =>
                    r.issues.map(
                      (issue) => `Zeile ${r.rowNumber}: ${issue.message}`
                    )
                  );

          setResults({
            success: outboundTrips.length,
            errors: combinedErrors,
            rows: validatedRows,
            returnTripsCreated: 0,
            addressOverrides,
            linkedPairsCount: 0
          });
          setMode('done');
        }
        setIsProcessing(false);
      },
      error: (error) => {
        toast.error(`CSV-Fehler: ${error.message}`);
        setIsProcessing(false);
      }
    });
  };

  // ── Wizard advance helpers ────────────────────────────────────────────────

  const handleWizardSkip = () => {
    const nextIndex = resumeStore.currentIndex + 1;
    resumeStore.advance();
    if (nextIndex >= wizardRows.length) {
      resumeStore.clear();
      setMode('done');
    }
  };

  const handleWizardDone = () => {
    resumeStore.clear();
    setMode('done');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Upload className='h-4 w-4' />
          Bulk Upload
          {hasPending && (
            <span className='ml-1 h-2 w-2 rounded-full bg-amber-500' />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5 text-emerald-600' />
            Fahrten Bulk Upload
          </DialogTitle>
          <DialogDescription>
            Laden Sie eine CSV-Datei hoch, um mehrere Fahrten gleichzeitig zu
            erstellen.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* ── Resume prompt ── */}
          {mode === 'resume_prompt' && (
            <div className='space-y-3'>
              <Alert className='border-amber-200 bg-amber-50 dark:bg-amber-950/20'>
                <RotateCcw className='h-4 w-4 text-amber-600' />
                <AlertTitle className='text-amber-800 dark:text-amber-400'>
                  Unfertiger Bulk-Upload gefunden
                </AlertTitle>
                <AlertDescription className='text-amber-700 dark:text-amber-500'>
                  {resumeStore.tripIds.length} Fahrgast
                  {resumeStore.tripIds.length !== 1
                    ? 'gäste wurden'
                    : ' wurde'}{' '}
                  noch nicht zugeordnet. Möchten Sie dort weitermachen?
                </AlertDescription>
              </Alert>
              <div className='flex gap-2'>
                <Button type='button' className='flex-1' onClick={handleResume}>
                  Fortsetzen
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1'
                  onClick={handleDiscard}
                >
                  Verwerfen
                </Button>
              </div>
            </div>
          )}

          {/* ── Resume loading ── */}
          {mode === 'resume_loading' && (
            <div className='flex flex-col items-center justify-center py-8'>
              <span className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent' />
              <p className='text-muted-foreground mt-4 text-sm'>
                Lade offene Fahrgäste…
              </p>
            </div>
          )}

          {/* ── Initial upload UI ── */}
          {mode === 'upload' && !results && (
            <FileUploader
              accept={{ 'text/csv': ['.csv'] }}
              maxFiles={1}
              maxSize={1024 * 1024 * 5}
              onUpload={processCsv}
              disabled={isProcessing}
            />
          )}

          {isProcessing && (
            <div className='flex flex-col items-center justify-center py-8'>
              <span className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent' />
              <p className='text-muted-foreground mt-4 text-sm'>
                Verarbeite CSV Datei...
              </p>
            </div>
          )}

          {mode === 'upload' && results && (
            <div className='space-y-4'>
              <Alert className='border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20'>
                <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                <AlertTitle className='text-emerald-800 dark:text-emerald-400'>
                  CSV analysiert
                </AlertTitle>
                <AlertDescription className='text-emerald-700 dark:text-emerald-500'>
                  {
                    results.rows.filter((r) => r.trip && r.issues.length === 0)
                      .length
                  }{' '}
                  Fahrten sind bereit zum Erstellen. Bitte prüfen Sie offene
                  Probleme unten.
                </AlertDescription>
              </Alert>

              {results.errors.length > 0 && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Probleme beim Import</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className='mt-2 h-32 pr-4'>
                      <ul className='list-inside list-disc space-y-1 text-xs'>
                        {results.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant='outline'
                className='w-full'
                onClick={() => {
                  setResults(null);
                  setMode('upload');
                }}
              >
                Erneut versuchen
              </Button>
            </div>
          )}

          {/* ── Wizard ── */}
          {mode === 'resolve_clients' && wizardRows.length > 0 && (
            <ResolveClientsStep
              rows={wizardRows}
              currentIndex={resumeStore.currentIndex}
              homeAddressChoice={resumeStore.homeAddressChoice}
              onHomeAddressChange={resumeStore.setHomeAddressChoice}
              onSkip={handleWizardSkip}
              onDone={handleWizardDone}
            />
          )}

          {/* ── Done ── */}
          {mode === 'done' && (
            <div className='space-y-4'>
              <Alert className='border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20'>
                <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                <AlertTitle className='text-emerald-800 dark:text-emerald-400'>
                  Import abgeschlossen
                </AlertTitle>
                <AlertDescription className='space-y-1 text-emerald-700 dark:text-emerald-500'>
                  <p>
                    Alle aus dieser CSV erstellten Fahrten wurden verarbeitet.
                  </p>
                  {results && results.success > 0 && (
                    <ul className='mt-2 list-inside list-disc space-y-0.5 text-xs'>
                      <li>
                        {results.success} Fahrt
                        {results.success !== 1 ? 'en' : ''} gesamt erstellt
                      </li>
                      {results.returnTripsCreated > 0 && (
                        <li>
                          {results.returnTripsCreated} Rückfahrt
                          {results.returnTripsCreated !== 1 ? 'en' : ''}{' '}
                          automatisch angelegt
                        </li>
                      )}
                      {results.linkedPairsCount > 0 && (
                        <li>
                          {results.linkedPairsCount} Hin/Rückfahrt-Paar
                          {results.linkedPairsCount !== 1 ? 'e' : ''} verknüpft
                        </li>
                      )}
                      {results.addressOverrides > 0 && (
                        <li>
                          {results.addressOverrides} Adresse
                          {results.addressOverrides !== 1 ? 'n' : ''} durch
                          Abrechnungsart-Regel überschrieben
                        </li>
                      )}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
              <Button
                type='button'
                className='w-full'
                onClick={() => {
                  setOpen(false);
                  setResults(null);
                  setMode('upload');
                }}
              >
                Dialog schließen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
