'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

const bulkUploadSchema = z.object({
  file: z.any()
});

interface BulkUploadDialogProps {
  onSuccess?: () => void;
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<{
    success: number;
    errors: string[];
  } | null>(null);

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

  const processCsv = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);

    const file = files[0];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const tripsToInsert: any[] = [];
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

        for (let i = 0; i < rows.length; i++) {
          const rowRaw = rows[i];
          // Trim all keys and values to handle messy CSVs
          const row: any = {};
          Object.keys(rowRaw).forEach((key) => {
            row[key.trim()] = String(rowRaw[key] || '').trim();
          });

          const rowNum = i + 2; // +1 for 0-index, +1 for header row

          try {
            // 1. Find Payer
            if (!row.kostentraeger) throw new Error(`Kostenträger ist leer.`);
            const payer = payers.find(
              (p) => p.name.toLowerCase() === row.kostentraeger.toLowerCase()
            );
            if (!payer)
              throw new Error(
                `Kostenträger "${row.kostentraeger}" nicht gefunden.`
              );

            // 2. Find Billing Type (optional)
            let billingTypeId = null;
            if (row.abrechnungsart) {
              const bt = billingTypes.find(
                (b) =>
                  b.name.toLowerCase() === row.abrechnungsart.toLowerCase() &&
                  b.payer_id === payer.id
              );
              if (!bt)
                throw new Error(
                  `Abrechnungsart "${row.abrechnungsart}" für Kostenträger "${row.kostentraeger}" nicht gefunden.`
                );
              billingTypeId = bt.id;
            }

            // 3. Construct Pickup/Dropoff Addresses
            const pickup_address = `${row.pickup_street}, ${row.pickup_zip} ${row.pickup_city}`;
            const dropoff_address = `${row.dropoff_street}, ${row.dropoff_zip} ${row.dropoff_city}`;

            // 4. Validate Date/Time
            const scheduled_at = parseGermanDate(row.date, row.time);
            if (!scheduled_at)
              throw new Error(
                `Ungültiges Datum/Uhrzeit Format (erwartet DD.MM.YY HH:mm): "${row.date} ${row.time}"`
              );

            let finalGroupId = null;
            if (row.group_id) {
              if (!groupIdMap.has(row.group_id)) {
                groupIdMap.set(row.group_id, crypto.randomUUID());
              }
              finalGroupId = groupIdMap.get(row.group_id);
            }

            tripsToInsert.push({
              payer_id: payer.id,
              billing_type_id: billingTypeId,
              client_name:
                `${row.firstname || ''} ${row.lastname || ''}`.trim() || null,
              client_phone: row.phone || null,
              scheduled_at: scheduled_at.toISOString(),
              pickup_address,
              pickup_station: row.pickup_station || null,
              dropoff_address,
              dropoff_station: row.dropoff_station || null,
              is_wheelchair: row.is_wheelchair.toUpperCase() === 'TRUE',
              notes: row.notes || null,
              status: 'pending',
              company_id: companyId,
              created_by: user?.id || null,
              group_id: finalGroupId,
              stop_updates: []
            });
          } catch (e: any) {
            errors.push(`Zeile ${rowNum}: ${e.message}`);
          }
        }

        if (tripsToInsert.length > 0 && errors.length === 0) {
          try {
            await tripsService.bulkCreateTrips(tripsToInsert);
            toast.success(
              `${tripsToInsert.length} Fahrten erfolgreich hochgeladen!`
            );
            setResults({ success: tripsToInsert.length, errors: [] });
            onSuccess?.();
            router.refresh();
            setTimeout(() => setOpen(false), 2000);
          } catch (e: any) {
            errors.push(`Datenbankfehler: ${e.message}`);
            setResults({ success: 0, errors });
          }
        } else {
          setResults({ success: tripsToInsert.length, errors });
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
          {!results && (
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

          {results && (
            <div className='space-y-4'>
              {results.success > 0 && results.errors.length === 0 && (
                <Alert className='border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                  <AlertTitle className='text-emerald-800 dark:text-emerald-400'>
                    Erfolg!
                  </AlertTitle>
                  <AlertDescription className='text-emerald-700 dark:text-emerald-500'>
                    {results.success} Fahrten wurden erfolgreich erstellt.
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Fehler beim Import</AlertTitle>
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
                onClick={() => setResults(null)}
              >
                Erneut versuchen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
