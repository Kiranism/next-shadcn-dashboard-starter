'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { PrintTripGroupsList } from './print-trip-groups-list';

export interface TripData {
  id: string;
  status?: string | null;
  driver_id?: string | null;
  payer_id?: string | null;
  group_id?: string | null;
  stop_order?: number | null;
  scheduled_at: string;
  client_name: string | null;
  client_phone: string | null;
  greeting_style?: string | null;
  pickup_address: string | null;
  pickup_station: string | null;
  dropoff_address: string | null;
  dropoff_station: string | null;
  notes: string | null;
  is_wheelchair: boolean;
  driver?: { name: string } | null;
  billing_types?: {
    name: string;
    color: string | null;
  } | null;
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

      <PrintTripGroupsList trips={trips} />

      {/* Footer */}
      <div className='mt-4 text-center'>
        <p className='text-[8px] font-bold tracking-widest text-slate-300 uppercase italic'>
          TaxiGo • {format(new Date(), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
