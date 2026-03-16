'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { PrintTemplate } from './print-template';
import { createRoot } from 'react-dom/client';

export function PrintTripsButton() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const searchParams = useSearchParams();

  // Get the scheduled_at from search params or default to today
  const scheduledAtParam = searchParams.get('scheduled_at');

  const generatePrintouts = async () => {
    try {
      setIsGenerating(true);
      const supabase = createClient();

      // 1. Determine the date range for the filtered day
      let dateToProcess = new Date();
      if (scheduledAtParam) {
        const timestamp = Number(scheduledAtParam.split(',')[0]);
        if (!isNaN(timestamp)) {
          dateToProcess = new Date(timestamp);
        }
      }

      const start = startOfDay(dateToProcess).toISOString();
      const end = endOfDay(dateToProcess).toISOString();

      // 2. Fetch all trips for that day
      toast.info('Lade Fahrten für den Druck...');
      const { data: trips, error } = await supabase
        .from('trips')
        .select(
          `
          *,
          driver:users!trips_driver_id_fkey(name)
        `
        )
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      if (!trips || trips.length === 0) {
        toast.error('Keine Fahrten für diesen Tag gefunden.');
        setIsGenerating(false);
        return;
      }

      // 3. Group trips by driver
      const groups: Record<string, any[]> = {};
      trips.forEach((trip) => {
        const driverName = trip.driver?.name || 'Nicht zugewiesen';
        if (!groups[driverName]) groups[driverName] = [];
        groups[driverName].push(trip);
      });

      // 4. Generate images for each group
      toast.info(`Generiere ${Object.keys(groups).length} Druckvorlagen...`);
      const zip = new JSZip();
      const dateStr = format(dateToProcess, 'dd.MM.yy');

      // To generate images, we need to temporarily render the templates in the DOM
      // but hidden from view.
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.position = 'absolute';
      offscreenContainer.style.left = '-9999px';
      offscreenContainer.style.top = '0';
      document.body.appendChild(offscreenContainer);

      for (const driverName of Object.keys(groups)) {
        const driverTrips = groups[driverName];

        // Create a temporary div for this driver's template
        const templateDiv = document.createElement('div');
        offscreenContainer.appendChild(templateDiv);

        // Render the React component into the div
        const root = createRoot(templateDiv);
        root.render(
          <PrintTemplate
            driverName={driverName}
            date={dateToProcess}
            trips={driverTrips}
          />
        );

        // Wait a bit for React to render and fonts to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Convert to PNG
        // The id in PrintTemplate matches this selector
        const elementToCapture = templateDiv.firstElementChild as HTMLElement;
        if (elementToCapture) {
          const dataUrl = await toPng(elementToCapture, {
            quality: 0.95,
            pixelRatio: 2 // Higher quality for print
          });

          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`${dateStr}.${driverName}.png`, base64Data, {
            base64: true
          });
        }

        // Cleanup this specific root
        root.unmount();
        offscreenContainer.removeChild(templateDiv);
      }

      // 5. Finalize ZIP and download
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Fahrtenplan_${dateStr}.zip`;
      link.click();

      // Cleanup
      document.body.removeChild(offscreenContainer);
      toast.success('Druckvorlagen erfolgreich generiert!');
    } catch (err: any) {
      console.error('Print generation error:', err);
      toast.error('Fehler beim Generieren der Druckvorlagen: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant='outline'
      onClick={generatePrintouts}
      disabled={isGenerating}
      className='gap-2'
    >
      {isGenerating ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Printer className='h-4 w-4' />
      )}
      Fahrten drucken
    </Button>
  );
}
