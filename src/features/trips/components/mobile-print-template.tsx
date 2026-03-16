'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TripData {
  id: string;
  scheduled_at: string;
  client_name: string | null;
  pickup_address: string | null;
  pickup_station: string | null;
  dropoff_address: string | null;
  dropoff_station: string | null;
  notes: string | null;
  driver?: { name: string } | null;
}

interface MobilePrintTemplateProps {
  driverName: string;
  date: Date;
  trips: TripData[];
}

export function MobilePrintTemplate({
  driverName,
  date,
  trips
}: MobilePrintTemplateProps) {
  return (
    <div
      id={`mobile-print-template-${driverName.replace(/\s+/g, '-')}`}
      className='bg-slate-50 p-3 font-sans text-slate-900'
      style={{ width: '450px', minHeight: '600px' }}
    >
      {/* Header - Compact */}
      <div className='mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div>
          <h1 className='text-xl font-black tracking-tighter text-slate-950 uppercase'>
            Fahrtenplan
          </h1>
          <p className='text-sm font-bold text-emerald-600'>{driverName}</p>
        </div>
        <div className='text-right'>
          <p className='text-xs font-medium text-slate-500'>
            {format(date, 'dd.MM.yy', { locale: de })}
          </p>
          <div className='rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold tracking-widest text-slate-500 uppercase'>
            Mobile
          </div>
        </div>
      </div>

      {/* Trip Cards - Denser */}
      <div className='space-y-2'>
        {trips.map((trip) => {
          const formatAddress = (addr: string | null) => {
            if (!addr) return '-';
            const parts = addr.split(',');
            if (parts.length < 2) return addr;
            return (
              <span className='font-bold text-slate-900'>
                {parts[0].trim()}
              </span>
            );
          };

          const formatCity = (addr: string | null) => {
            if (!addr) return '';
            const parts = addr.split(',');
            return parts.length > 1 ? ` (${parts[1].trim()})` : '';
          };

          return (
            <div
              key={trip.id}
              className='relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm'
            >
              {/* Left Accent */}
              <div className='absolute top-0 left-0 h-full w-1 bg-slate-900' />

              {/* Card Header: Time and Name */}
              <div className='mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2'>
                <div className='flex items-center gap-2'>
                  <div className='rounded-lg bg-slate-900 px-2.5 py-1 text-base font-black text-white tabular-nums'>
                    {format(new Date(trip.scheduled_at), 'HH:mm')}
                  </div>
                  <p className='max-w-[240px] truncate text-base font-extrabold text-slate-900'>
                    {trip.client_name || 'Anonym'}
                  </p>
                </div>
              </div>

              {/* Route Section - Combined */}
              <div className='space-y-1.5 px-0.5'>
                {/* Start */}
                <div className='flex items-baseline gap-2'>
                  <span className='w-10 text-[10px] font-black tracking-tighter text-slate-400 uppercase'>
                    Start
                  </span>
                  <div className='flex-1 text-sm leading-tight'>
                    {formatAddress(trip.pickup_address)}
                    {trip.pickup_station && (
                      <span className='ml-1.5 inline-flex items-center rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700'>
                        {trip.pickup_station}
                      </span>
                    )}
                    <span className='ml-1 text-[11px] font-medium text-slate-400'>
                      {formatCity(trip.pickup_address)}
                    </span>
                  </div>
                </div>

                {/* Ziel */}
                <div className='flex items-baseline gap-2'>
                  <span className='w-10 text-[10px] font-black tracking-tighter text-slate-400 uppercase'>
                    Ziel
                  </span>
                  <div className='flex-1 text-sm leading-tight'>
                    {formatAddress(trip.dropoff_address)}
                    {trip.dropoff_station && (
                      <span className='ml-1.5 inline-flex items-center rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700'>
                        {trip.dropoff_station}
                      </span>
                    )}
                    <span className='ml-1 text-[11px] font-medium text-slate-400'>
                      {formatCity(trip.dropoff_address)}
                    </span>
                  </div>
                </div>

                {/* Notes - Only if applicable */}
                {trip.notes && trip.notes.trim() !== '' && (
                  <div className='mt-2 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2'>
                    <span className='mt-0.5 text-[9px] font-black tracking-tighter text-amber-600 uppercase'>
                      Hinweis
                    </span>
                    <p className='flex-1 text-[11px] leading-tight font-bold text-amber-900'>
                      {trip.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className='mt-4 text-center'>
        <p className='text-[8px] font-bold tracking-widest text-slate-300 uppercase italic'>
          TaxiGo • {format(new Date(), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
