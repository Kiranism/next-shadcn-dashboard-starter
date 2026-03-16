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
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InsertTrip } from '@/features/trips/api/trips.service';
import {
  type ParsedCsvRow,
  type ValidatedTripRow,
  type UnresolvedRow,
  type ValidationIssue
} from '@/features/trips/components/bulk-upload/bulk-upload-types';
import { ResolveClientsStep } from '@/features/trips/components/bulk-upload/resolve-clients-step';

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
  const [mode, setMode] = React.useState<'upload' | 'resolve_clients' | 'done'>(
    'upload'
  );
  const [unresolvedRows, setUnresolvedRows] = React.useState<
    UnresolvedRow<InsertTrip>[]
  >([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isCreatingClient, setIsCreatingClient] = React.useState(false);
  const [homeAddressChoice, setHomeAddressChoice] = React.useState<
    'pickup' | 'dropoff'
  >('pickup');

  const { payers } = useTripFormData(null);
  const [billingTypes, setBillingTypes] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchAllBillingTypes = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from('billing_types')
        .select('id, name, payer_id');
      if (data) setBillingTypes(data);
    };
    fetchAllBillingTypes();
  }, []);

  /**
   * Parses a German style date (DD.MM.YY / DD.MM.YYYY) and 24h time (HH:mm)
   * into a JavaScript Date instance. Returns null for invalid input.
   */
  const parseGermanDate = (dateStr: string, timeStr: string) => {
    try {
      // Handle DD.MM.YY or DD.MM.YYYY
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
   * - preparing unresolvedRows for the client‑resolution wizard.
   */
  const processCsv = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);
    setMode('upload');
    setUnresolvedRows([]);
    setCurrentIndex(0);

    const file = files[0];

    Papa.parse<ParsedCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
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

        // Preload clients for simple in-memory matching.
        // Prefer same company, but fall back to all clients if company_id is missing.
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
          if (!raw) {
            return { street: null, streetNumber: null };
          }

          const trimmed = raw.trim();
          // Match the first digit and treat everything from there as the house number,
          // allowing things like "4", "4A", "4 A", "9 C" at the end.
          const match = trimmed.match(/^(.+?)(\s+\d+\s*\w*)$/u);

          if (!match) {
            // No obvious number part found – keep full string as street, no number
            return { street: trimmed, streetNumber: null };
          }

          const street = match[1].trim();
          const streetNumber = match[2].trim();

          return {
            street: street || null,
            streetNumber: streetNumber || null
          };
        };

        for (let i = 0; i < rows.length; i++) {
          const rowRaw = rows[i] as any;
          const parsedRow: ParsedCsvRow = {} as ParsedCsvRow;
          Object.keys(rowRaw || {}).forEach((key) => {
            const trimmedKey = key.trim();
            (parsedRow as any)[trimmedKey] = String(rowRaw[key] || '').trim();
          });

          const rowNum = i + 2; // +1 for 0-index, +1 for header row
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

          // Try to match an existing client by full name
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

        // Geocode pickup/dropoff addresses for successful rows using the existing
        // geocoding API endpoint so that trips get lat/lng where possible and
        // normalize zip_code/city based on Google data (street is treated as
        // the source of truth).
        await Promise.all(
          successfulRows.map(async (row) => {
            if (!row.trip) return;

            try {
              const [pickupResult, dropoffResult] = await Promise.all([
                fetch('/api/geocode-address', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    street: row.trip.pickup_street,
                    street_number: row.trip.pickup_street_number,
                    zip_code: row.trip.pickup_zip_code,
                    city: row.trip.pickup_city
                  })
                }),
                fetch('/api/geocode-address', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    street: row.trip.dropoff_street,
                    street_number: row.trip.dropoff_street_number,
                    zip_code: row.trip.dropoff_zip_code,
                    city: row.trip.dropoff_city
                  })
                })
              ]);

              const pickupOk = pickupResult.ok;
              const dropoffOk = dropoffResult.ok;

              const pickupData = pickupOk ? await pickupResult.json() : null;
              const dropoffData = dropoffOk ? await dropoffResult.json() : null;

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

              // Use Google-derived postal code and city to backfill or correct
              // CSV values when possible. We assume the street (from CSV) is
              // correct and trust Google's metadata for that street.
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

              // Keep the denormalized address strings in sync with potentially
              // corrected zip/city values and include the house number again
              // so that the wizard and UI always show the full address.
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
              // If geocoding fails, we keep has_missing_geodata = true and
              // allow later backfill scripts to handle it.
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

            // Map back created trip ids to corresponding rows (by index)
            const unresolved = createdTrips
              .map((trip: any, idx: number) => ({
                tripId: trip.id as string,
                row: successfulRows[idx]
              }))
              .filter(
                ({ row }) =>
                  !row.clientId &&
                  row.trip?.client_name &&
                  row.trip?.ingestion_source === 'csv_bulk_upload'
              );

            setUnresolvedRows(unresolved);

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

            if (unresolved.length > 0) {
              setMode('resolve_clients');
              setCurrentIndex(0);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Upload className='h-4 w-4' />
          Bulk Upload
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
          {mode === 'upload' && !results && (
            <FileUploader
              accept={{ 'text/csv': ['.csv'] }}
              maxFiles={1}
              maxSize={1024 * 1024 * 5} // 5MB
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

          {mode === 'resolve_clients' && unresolvedRows.length > 0 && (
            <ResolveClientsStep
              unresolvedRows={unresolvedRows}
              currentIndex={currentIndex}
              homeAddressChoice={homeAddressChoice}
              isCreatingClient={isCreatingClient}
              onHomeAddressChange={setHomeAddressChoice}
              onUseAsNonClient={() => {
                if (currentIndex + 1 < unresolvedRows.length) {
                  setCurrentIndex((idx) => idx + 1);
                } else {
                  setMode('done');
                }
              }}
              onDone={() => {
                setMode('done');
              }}
            />
          )}

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
