'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toPng, toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PrintTemplate } from './print-template';
import { MobilePrintTemplate } from './mobile-print-template';
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
          driver:users!trips_driver_id_fkey(name),
          billing_types(*)
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

      // 4. Generate images and PDFs for each group
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

        // --- Render Desktop Template (PNG) ---
        const desktopDiv = document.createElement('div');
        offscreenContainer.appendChild(desktopDiv);
        const desktopRoot = createRoot(desktopDiv);
        desktopRoot.render(
          <PrintTemplate
            driverName={driverName}
            date={dateToProcess}
            trips={driverTrips}
          />
        );

        // --- Render Mobile Template (for PDF) ---
        const mobileDiv = document.createElement('div');
        offscreenContainer.appendChild(mobileDiv);
        const mobileRoot = createRoot(mobileDiv);
        mobileRoot.render(
          <MobilePrintTemplate
            driverName={driverName}
            date={dateToProcess}
            trips={driverTrips}
          />
        );

        // Wait for React to render
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 1. Capture PNG for Desktop
        const desktopElement = desktopDiv.firstElementChild as HTMLElement;
        if (desktopElement) {
          const pngDataUrl = await toPng(desktopElement, {
            quality: 0.8, // Slightly lower quality for smaller PNGs
            pixelRatio: 1.5 // 1.5 is enough for clear text
          });
          const pngBase64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`${dateStr}.${driverName}.png`, pngBase64, { base64: true });
        }

        // 2. Capture PDF (from mobile view)
        const mobileElement = mobileDiv.firstElementChild as HTMLElement;
        if (mobileElement) {
          // Use JPEG for PDF background to significantly reduce size
          const mobileJpegDataUrl = await toJpeg(mobileElement, {
            quality: 0.75, // Good balance for readability vs size
            pixelRatio: 1.2 // Lower pixel ratio for mobile PDF
          });

          // Create PDF using jsPDF
          const width = mobileElement.offsetWidth;
          const height = mobileElement.offsetHeight;

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [width, height],
            compress: true // Enable jsPDF's internal compression
          });

          pdf.addImage(mobileJpegDataUrl, 'JPEG', 0, 0, width, height);

          // 3. Add Interactive Layer (Links)
          const mobileRect = mobileElement.getBoundingClientRect();

          // Find all address links
          const addressElements =
            mobileElement.querySelectorAll('[data-address]');
          addressElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const address = el.getAttribute('data-address');
            if (address && address.trim() !== '') {
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
              pdf.link(
                rect.left - mobileRect.left,
                rect.top - mobileRect.top,
                rect.width,
                rect.height,
                { url }
              );
            }
          });

          // Find all phone links
          const phoneElements = mobileElement.querySelectorAll('[data-phone]');
          phoneElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const phone = el.getAttribute('data-phone');
            if (phone && phone.trim() !== '') {
              pdf.link(
                rect.left - mobileRect.left,
                rect.top - mobileRect.top,
                rect.width,
                rect.height,
                { url: `tel:${phone.replace(/\s+/g, '')}` }
              );
            }
          });

          const pdfBlob = pdf.output('blob');
          zip.file(`${dateStr}.${driverName}.pdf`, pdfBlob);
        }

        // Cleanup
        desktopRoot.unmount();
        mobileRoot.unmount();
        offscreenContainer.removeChild(desktopDiv);
        offscreenContainer.removeChild(mobileDiv);
      }

      // 5. Finalize ZIP and download
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Fahrtenplan_${dateStr}.zip`;
      link.click();

      // Cleanup
      document.body.removeChild(offscreenContainer);
      toast.success('Druckvorlagen und PDFs erfolgreich generiert!');
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
