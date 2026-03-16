'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Accessibility } from 'lucide-react';

interface TripData {
  id: string;
  scheduled_at: string;
  client_name: string | null;
  client_phone: string | null;
  pickup_address: string | null;
  pickup_station: string | null;
  dropoff_address: string | null;
  dropoff_station: string | null;
  notes: string | null;
  is_wheelchair: boolean;
  billing_types?: {
    name: string;
    color: string | null;
  } | null;
  driver?: { name: string } | null;
}

interface PrintTemplateProps {
  driverName: string;
  date: Date;
  trips: TripData[];
}

export function PrintTemplate({ driverName, date, trips }: PrintTemplateProps) {
  return (
    <div
      id={`print-template-${driverName.replace(/\s+/g, '-')}`}
      className='bg-white p-8 font-sans text-slate-900'
      style={{ width: '1200px', minHeight: '800px' }}
    >
      {/* Header */}
      <div className='mb-8 flex items-end justify-between border-b-2 border-slate-900 pb-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight uppercase'>
            Fahrtenplan
          </h1>
          <p className='text-sm font-medium text-slate-500'>
            TaxiGo Admin System
          </p>
        </div>
        <div className='text-right'>
          <p className='text-xl font-bold'>{driverName}</p>
          <p className='text-lg text-slate-600'>
            {format(date, 'EEEE, dd. MMMM yyyy', { locale: de })}
          </p>
        </div>
      </div>

      {/* Table */}
      <table className='w-full border-collapse text-left'>
        <thead>
          <tr className='border-b-2 border-slate-800 bg-slate-50'>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Uhrzeit
            </th>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Fahrgast
            </th>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Eingang
            </th>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Von (Start)
            </th>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Nach (Ziel)
            </th>
            <th className='p-3 text-xs font-bold tracking-wider uppercase'>
              Hinweis
            </th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, idx) => {
            // Helper to parse complex address strings if they follow the format "Street, ZIP City"
            const formatAddress = (addr: string | null) => {
              if (!addr) return '-';
              const parts = addr.split(',');
              if (parts.length < 2) return addr;
              const street = parts[0].trim();
              const rest = parts[1].trim();
              return (
                <div>
                  <div className='font-semibold'>{street}</div>
                  <div className='text-xs text-slate-500'>{rest}</div>
                </div>
              );
            };

            const billingType = trip.billing_types;

            return (
              <tr
                key={trip.id}
                className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
              >
                <td className='p-3 font-mono text-lg font-bold'>
                  {format(new Date(trip.scheduled_at), 'HH:mm')}
                </td>
                <td className='p-3'>
                  <div className='flex flex-col gap-0.5'>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>
                        {trip.client_name || '-'}
                      </span>
                      {trip.is_wheelchair && (
                        <Accessibility
                          className='h-4 w-4 text-red-600'
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <div className='flex items-center justify-between gap-4'>
                      {trip.client_phone && (
                        <span className='text-[10px] font-bold text-slate-600 tabular-nums'>
                          {trip.client_phone}
                        </span>
                      )}
                      {billingType?.name && (
                        <span className='text-[9px] font-bold tracking-tight text-slate-400 uppercase'>
                          {billingType.name}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className='p-3 text-sm'>{trip.pickup_station || '-'}</td>
                <td className='p-3 text-sm'>
                  {formatAddress(trip.pickup_address)}
                </td>
                <td className='p-3 text-sm'>
                  {formatAddress(trip.dropoff_address)}
                </td>
                <td className='max-w-[200px] p-3 text-xs break-words text-slate-600 italic'>
                  {trip.notes || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className='mt-12 flex justify-between border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400'>
        <p>Generiert am {format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
        <p>Seite 1 von 1</p>
      </div>
    </div>
  );
}
