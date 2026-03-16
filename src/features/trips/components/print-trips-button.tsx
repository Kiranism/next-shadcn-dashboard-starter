'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toPng, toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PrintTemplate } from './print-template';
import { MobilePrintTemplate } from './mobile-print-template';
import { createRoot } from 'react-dom/client';

export function PrintTripsButton() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = React.useState(false);

  const generatePrintouts = async () => {
    if (!date) {
      toast.error('Bitte wählen Sie ein Datum aus.');
      return;
    }

    try {
      setIsGenerating(true);
      setIsOpen(false);
      const supabase = createClient();

      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      // 2. Fetch all trips for that day
      toast.info(`Lade Fahrten für den ${format(date, 'dd.MM.yyyy')}...`);
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
      const dateStr = format(date, 'dd.MM.yy');

      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.position = 'absolute';
      offscreenContainer.style.left = '-9999px';
      offscreenContainer.style.top = '0';
      document.body.appendChild(offscreenContainer);

      for (const driverName of Object.keys(groups)) {
        const driverTrips = groups[driverName];

        const desktopDiv = document.createElement('div');
        offscreenContainer.appendChild(desktopDiv);
        const desktopRoot = createRoot(desktopDiv);
        desktopRoot.render(
          <PrintTemplate
            driverName={driverName}
            date={date}
            trips={driverTrips}
          />
        );

        const mobileDiv = document.createElement('div');
        offscreenContainer.appendChild(mobileDiv);
        const mobileRoot = createRoot(mobileDiv);
        mobileRoot.render(
          <MobilePrintTemplate
            driverName={driverName}
            date={date}
            trips={driverTrips}
          />
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        const desktopElement = desktopDiv.firstElementChild as HTMLElement;
        if (desktopElement) {
          const pngDataUrl = await toPng(desktopElement, {
            quality: 0.8,
            pixelRatio: 1.5
          });
          const pngBase64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
          zip.file(`${dateStr}.${driverName}.png`, pngBase64, { base64: true });
        }

        const mobileElement = mobileDiv.firstElementChild as HTMLElement;
        if (mobileElement) {
          const mobileJpegDataUrl = await toJpeg(mobileElement, {
            quality: 0.75,
            pixelRatio: 1.2
          });

          const width = mobileElement.offsetWidth;
          const height = mobileElement.offsetHeight;

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [width, height],
            compress: true
          });

          pdf.addImage(mobileJpegDataUrl, 'JPEG', 0, 0, width, height);

          const mobileRect = mobileElement.getBoundingClientRect();

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

        desktopRoot.unmount();
        mobileRoot.unmount();
        offscreenContainer.removeChild(desktopDiv);
        offscreenContainer.removeChild(mobileDiv);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Fahrtenplan_${dateStr}.zip`;
      link.click();

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' disabled={isGenerating} className='gap-2'>
          {isGenerating ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Printer className='h-4 w-4' />
          )}
          Fahrten drucken
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='end'>
        <div className='border-b bg-slate-50 p-3'>
          <h4 className='text-sm font-bold text-slate-900'>
            Druckdatum wählen
          </h4>
          <p className='text-[10px] text-slate-500'>
            Fahrten für diesen Tag werden exportiert.
          </p>
        </div>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={(date) => isGenerating}
        />
        <div className='flex justify-end border-t bg-slate-50 p-3'>
          <Button
            size='sm'
            onClick={generatePrintouts}
            disabled={isGenerating || !date}
            className='w-full bg-emerald-600 hover:bg-emerald-700'
          >
            {isGenerating ? 'Generiere...' : 'ZIP Generieren'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
