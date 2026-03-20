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
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import {
  buildColumns,
  buildItemsByColumn
} from '@/features/trips/lib/kanban-columns';
import type { KanbanTrip } from '@/features/trips/lib/kanban-types';
import { BoardLandscapeOnlyPrintTemplate } from './board-landscape-only-print-template';
import { BoardOverviewPrintTemplate } from './board-overview-print-template';
import { MobilePrintTemplate, type TripData } from './mobile-print-template';
import { createRoot } from 'react-dom/client';

function dataUrlBase64Payload(dataUrl: string): string {
  const marker = 'base64,';
  const i = dataUrl.indexOf(marker);
  return i >= 0 ? dataUrl.slice(i + marker.length) : dataUrl;
}

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

      toast.info(`Lade Fahrten für den ${format(date, 'dd.MM.yyyy')}...`);

      const tripsQuery = supabase
        .from('trips')
        .select(
          `
          *,
          driver:accounts!trips_driver_id_fkey(name),
          billing_types(*)
        `
        )
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .order('scheduled_at', { ascending: true });

      const driversQuery = supabase
        .from('accounts')
        .select('id, name')
        .eq('role', 'driver')
        .eq('is_active', true)
        .order('name');

      const [{ data: trips, error }, { data: drivers, error: driversError }] =
        await Promise.all([tripsQuery, driversQuery]);

      if (error) throw error;
      if (driversError) throw driversError;

      if (!trips || trips.length === 0) {
        toast.error('Keine Fahrten für diesen Tag gefunden.');
        setIsGenerating(false);
        return;
      }

      const dateStr = format(date, 'dd.MM.yy');
      const zip = new JSZip();

      const columnsAll = buildColumns(
        trips as KanbanTrip[],
        'driver',
        drivers ?? []
      );
      const itemsByColumn = buildItemsByColumn(
        trips as KanbanTrip[],
        columnsAll,
        'driver'
      );

      /** Nur Fahrer mit mindestens einer Fahrt; ohne „Nicht zugewiesen“. */
      const overviewColumns = columnsAll.filter(
        (c) => c.id !== 'unassigned' && (itemsByColumn[c.id]?.length ?? 0) > 0
      );

      const overviewItems: Record<string, TripData[]> = {};
      for (const col of overviewColumns) {
        const list = itemsByColumn[col.id];
        if (list?.length) overviewItems[col.id] = list as TripData[];
      }

      // 3. Group trips by driver
      const groups: Record<string, any[]> = {};
      trips.forEach((trip) => {
        const driverName = trip.driver?.name || 'Nicht zugewiesen';
        if (!groups[driverName]) groups[driverName] = [];
        groups[driverName].push(trip);
      });

      toast.info(
        `Generiere ${Object.keys(groups).length} Druckvorlagen${
          overviewColumns.length > 0 ? ' + 2 Übersichten' : ''
        }...`
      );

      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.position = 'absolute';
      offscreenContainer.style.left = '-9999px';
      offscreenContainer.style.top = '0';
      document.body.appendChild(offscreenContainer);

      if (overviewColumns.length > 0) {
        const imageOptionsStrip = {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#f1f5f9'
        } as const;

        const imageOptionsLandscape = {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#f8fafc'
        } as const;

        const addOverviewJpegToZip = async (
          el: HTMLElement,
          opts: {
            pixelRatio: number;
            cacheBust: boolean;
            backgroundColor: string;
          },
          jpegName: string
        ) => {
          const jpegDataUrl = await toJpeg(el, {
            ...opts,
            quality: 0.88
          });
          zip.file(jpegName, dataUrlBase64Payload(jpegDataUrl), {
            base64: true
          });
        };

        /* Hochformat: Kanban-Spalten nebeneinander (typisch schmal/hoch) */
        {
          const overviewDiv = document.createElement('div');
          offscreenContainer.appendChild(overviewDiv);
          const overviewRoot = createRoot(overviewDiv);
          try {
            overviewRoot.render(
              <BoardOverviewPrintTemplate
                date={date}
                columns={overviewColumns}
                itemsByColumn={overviewItems}
              />
            );
            await new Promise((resolve) => setTimeout(resolve, 900));
            const overviewEl =
              overviewDiv.firstElementChild as HTMLElement | null;
            if (!overviewEl) {
              throw new Error(
                'Übersicht (Hochformat) konnte nicht gerendert werden.'
              );
            }
            await addOverviewJpegToZip(
              overviewEl,
              imageOptionsStrip,
              'fahrtenplan_uebersicht.jpg'
            );
          } finally {
            overviewRoot.unmount();
            offscreenContainer.removeChild(overviewDiv);
          }
        }

        /* Querformat: eigene Ansicht — Fahrer als Zeilen, Fahrten waagerecht */
        {
          const overviewDiv = document.createElement('div');
          offscreenContainer.appendChild(overviewDiv);
          const overviewRoot = createRoot(overviewDiv);
          try {
            overviewRoot.render(
              <BoardLandscapeOnlyPrintTemplate
                date={date}
                columns={overviewColumns}
                itemsByColumn={overviewItems}
              />
            );
            await new Promise((resolve) => setTimeout(resolve, 900));
            const overviewEl =
              overviewDiv.firstElementChild as HTMLElement | null;
            if (!overviewEl) {
              throw new Error(
                'Übersicht (Querformat) konnte nicht gerendert werden.'
              );
            }
            await addOverviewJpegToZip(
              overviewEl,
              imageOptionsLandscape,
              'fahrtenplan_uebersicht_handy_querformat.jpg'
            );
          } finally {
            overviewRoot.unmount();
            offscreenContainer.removeChild(overviewDiv);
          }
        }
      }

      for (const driverName of Object.keys(groups)) {
        const driverTrips = groups[driverName];

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

        mobileRoot.unmount();
        offscreenContainer.removeChild(mobileDiv);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Fahrtenplan_${dateStr}.zip`;
      link.click();

      document.body.removeChild(offscreenContainer);
      toast.success(
        overviewColumns.length > 0
          ? 'ZIP mit PDFs und zwei JPEG-Übersichten wurde erstellt.'
          : 'ZIP mit PDFs wurde erstellt.'
      );
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
        <div className='bg-muted border-b p-3'>
          <h4 className='text-foreground text-sm font-bold'>
            Druckdatum wählen
          </h4>
          <p className='text-muted-foreground text-[10px]'>
            ZIP:Trips Übersicht für Fahrer
          </p>
        </div>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={(date) => isGenerating}
        />
        <div className='bg-muted flex justify-center border-t p-3'>
          <Button
            size='sm'
            onClick={generatePrintouts}
            disabled={isGenerating || !date}
            className='bg-primary hover:bg-primary/90 w-fit'
          >
            {isGenerating ? 'Generiere...' : 'ZIP generieren'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
