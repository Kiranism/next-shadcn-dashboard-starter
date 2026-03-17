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
import { ResolveClientsStep } from '@/features/trips/components/bulk-upload/resolve-clients-step';
import {
  useBulkUploadResumeStore,
  hasPendingResumeSession
} from '@/features/trips/stores/use-bulk-upload-resume-store';

interface BulkUploadDialogProps {
  onSuccess?: () => void;
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
    { id: string; name: string; payer_id: string }[]
  >([]);

  React.useEffect(() => {
    const fetchAllBillingTypes = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('billing_types')
        .select('id, name, payer_id');
      if (data)
        setBillingTypes(
          data as { id: string; name: string; payer_id: string }[]
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

  const parseGermanDate = (dateStr: string, timeStr: string) => {
    try {
      const dateParts = dateStr.trim().split('.');
      if (dateParts.length !== 3) return null;

      let [day, month, year] = dateParts.map(Number);
      if (year < 100) year += 2000;

      const timeParts = timeStr.trim().split(':');
      const [hours, minutes] = timeParts.map(Number);

      const date = new Date(year, month - 1, day, hours, minutes);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

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
            .from('users')
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
        };

        let companyClients: CompanyClient[] = [];
        const clientsQuery = supabase
          .from('clients')
          .select('id, first_name, last_name, phone');

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
          .from('users')
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
          const fullName =
            `${row.firstname || ''} ${row.lastname || ''}`.trim();
          if (!fullName) return null;

          const normFullName = normalize(fullName);

          const candidates = companyClients.filter((client) => {
            const clientFullName = `${client.first_name || ''} ${
              client.last_name || ''
            }`.trim();
            return normalize(clientFullName) === normFullName;
          });

          if (candidates.length === 1) return candidates[0];
          return null;
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

          const scheduled_at = parseGermanDate(parsedRow.date, parsedRow.time);
          if (!scheduled_at) {
            issues.push({
              type: 'invalid_datetime',
              message: `Ungültiges Datum/Uhrzeit Format (erwartet DD.MM.YY HH:mm): "${parsedRow.date} ${parsedRow.time}"`
            });
          }

          let finalGroupId: string | null = null;
          if (parsedRow.group_id) {
            if (!groupIdMap.has(parsedRow.group_id)) {
              groupIdMap.set(parsedRow.group_id, crypto.randomUUID());
            }
            finalGroupId = groupIdMap.get(parsedRow.group_id) ?? null;
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

          const trip: InsertTrip | null =
            payer && scheduled_at
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
                  scheduled_at: scheduled_at.toISOString(),
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
                  stop_updates: [],
                  has_missing_geodata: true,
                  driver_id: driverId,
                  needs_driver_assignment: needsDriverAssignment,
                  ingestion_source: 'csv_bulk_upload'
                }
              : null;

          const matchedClientId: string | null = matchedClient?.id ?? null;

          validatedRows.push({
            rowNumber: rowNum,
            source: parsedRow,
            trip,
            issues,
            clientId: matchedClientId
          });
        }

        const successfulRows = validatedRows.filter(
          (row) => row.trip && row.issues.length === 0
        );

        // Geocode pickup/dropoff addresses for successful rows.
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

        const successfulTrips = successfulRows.map(
          (row) => row.trip!
        ) as InsertTrip[];

        if (successfulTrips.length > 0 && errors.length === 0) {
          try {
            const createdTrips =
              await tripsService.bulkCreateTrips(successfulTrips);

            // Build wizard rows from the created trips' data.
            const unresolvedCreated = createdTrips
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

            toast.success(
              `${successfulTrips.length} Fahrten erfolgreich hochgeladen!`
            );
            setResults({
              success: successfulTrips.length,
              errors: [],
              rows: validatedRows
            });
            onSuccess?.();
            router.refresh();

            if (unresolvedCreated.length > 0) {
              // Map to RehydratedTripRow using data we already have in memory.
              const freshRows: RehydratedTripRow[] = unresolvedCreated.map(
                ({ createdTrip, sourceRow }) => ({
                  tripId: createdTrip.id as string,
                  clientName: sourceRow.trip?.client_name ?? null,
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

              // Persist resume session so a dialog close doesn't lose work.
              resumeStore.start(freshRows.map((r) => r.tripId));

              setWizardRows(freshRows);
              setMode('resolve_clients');
            } else {
              setMode('done');
              setTimeout(() => setOpen(false), 2000);
            }
          } catch (e: any) {
            errors.push(`Datenbankfehler: ${e.message}`);
            setResults({ success: 0, errors, rows: validatedRows });
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
            success: successfulTrips.length,
            errors: combinedErrors,
            rows: validatedRows
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
                <AlertDescription className='text-emerald-700 dark:text-emerald-500'>
                  Alle aus dieser CSV erstellten Fahrten wurden verarbeitet.
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
