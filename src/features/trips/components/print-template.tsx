'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Accessibility } from 'lucide-react';

interface TripData {
  id: string;
  group_id?: string | null;
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
  const tripGroups = React.useMemo(() => {
    type Group = { key: string; groupId: string | null; trips: TripData[] };
    const map = new Map<string, TripData[]>();
    const singles: TripData[] = [];

    for (const trip of trips) {
      const groupId = trip.group_id ?? null;
      if (!groupId) {
        singles.push(trip);
        continue;
      }
      const list = map.get(groupId);
      if (list) list.push(trip);
      else map.set(groupId, [trip]);
    }

    const groups: Group[] = [];

    for (const trip of singles) {
      groups.push({ key: `single:${trip.id}`, groupId: null, trips: [trip] });
    }

    for (const [groupId, groupTrips] of map.entries()) {
      groupTrips.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
      groups.push({ key: `group:${groupId}`, groupId, trips: groupTrips });
    }

    groups.sort((a, b) => {
      const aTime = new Date(a.trips[0]?.scheduled_at ?? 0).getTime();
      const bTime = new Date(b.trips[0]?.scheduled_at ?? 0).getTime();
      return aTime - bTime;
    });

    return groups;
  }, [trips]);

  const buildStops = React.useCallback((groupTrips: TripData[]) => {
    type Stop = {
      address: string;
      station: string | null;
      names: string[];
    };

    const pickups: Stop[] = [];
    const pickupKeys = new Set<string>();

    for (const t of groupTrips) {
      if (!t.pickup_address) continue;
      const key = `${t.pickup_address}-${t.pickup_station || ''}`;
      if (!pickupKeys.has(key)) {
        pickups.push({
          address: t.pickup_address,
          station: t.pickup_station ?? null,
          names: t.client_name ? [t.client_name] : []
        });
        pickupKeys.add(key);
      } else {
        const p = pickups.find(
          (x) =>
            x.address === t.pickup_address &&
            (x.station || '') === (t.pickup_station || '')
        );
        if (p && t.client_name && !p.names.includes(t.client_name))
          p.names.push(t.client_name);
      }
    }

    const dropoffs: Stop[] = [];
    const dropoffKeys = new Set<string>();

    for (const t of groupTrips) {
      if (!t.dropoff_address) continue;
      const key = `${t.dropoff_address}-${t.dropoff_station || ''}`;
      if (!dropoffKeys.has(key)) {
        dropoffs.push({
          address: t.dropoff_address,
          station: t.dropoff_station ?? null,
          names: t.client_name ? [t.client_name] : []
        });
        dropoffKeys.add(key);
      } else {
        const d = dropoffs.find(
          (x) =>
            x.address === t.dropoff_address &&
            (x.station || '') === (t.dropoff_station || '')
        );
        if (d && t.client_name && !d.names.includes(t.client_name))
          d.names.push(t.client_name);
      }
    }

    return { pickups, dropoffs };
  }, []);

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
          {tripGroups.flatMap((group, groupIdx) => {
            const isGrouped = group.trips.length > 1;
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

            if (!isGrouped) {
              const trip = group.trips[0];
              const billingType = trip?.billing_types;

              return (
                <tr
                  key={group.key}
                  className={`border-b border-slate-200 ${groupIdx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                >
                  <td className='p-3 font-mono text-lg font-bold'>
                    {trip?.scheduled_at
                      ? format(new Date(trip.scheduled_at), 'HH:mm')
                      : '-'}
                  </td>
                  <td className='p-3'>
                    <div className='flex flex-col gap-0.5'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold'>
                          {trip?.client_name || '-'}
                        </span>
                        {trip?.is_wheelchair && (
                          <Accessibility
                            className='h-4 w-4 text-red-600'
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className='flex items-center justify-between gap-4'>
                        {trip?.client_phone && (
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
                  <td className='p-3 text-sm'>{trip?.pickup_station || '-'}</td>
                  <td className='p-3 text-sm'>
                    {formatAddress(trip?.pickup_address || null)}
                  </td>
                  <td className='p-3 text-sm'>
                    {formatAddress(trip?.dropoff_address || null)}
                  </td>
                  <td className='max-w-[200px] p-3 text-xs break-words text-slate-600 italic'>
                    {trip?.notes || '-'}
                  </td>
                </tr>
              );
            }

            const { pickups, dropoffs } = buildStops(group.trips);
            const passengerNames = Array.from(
              new Set(
                group.trips
                  .map((t) => t.client_name)
                  .filter((x): x is string => !!x && x.trim() !== '')
              )
            );
            const hasWheelchair = group.trips.some((t) => t.is_wheelchair);
            const billingType = group.trips[0]?.billing_types;
            const startTime = group.trips[0]?.scheduled_at
              ? format(new Date(group.trips[0].scheduled_at), 'HH:mm')
              : '';
            const endTime = group.trips[group.trips.length - 1]?.scheduled_at
              ? format(
                  new Date(group.trips[group.trips.length - 1].scheduled_at),
                  'HH:mm'
                )
              : '';
            const timeRange =
              startTime && endTime && startTime !== endTime
                ? `${startTime}–${endTime}`
                : startTime || endTime || '-';

            return (
              <tr
                key={group.key}
                className='border-b-2 border-slate-300 bg-slate-50'
              >
                <td colSpan={6} className='p-3'>
                  <div className='rounded-lg border border-slate-200 bg-white p-3'>
                    <div className='mb-2 flex items-start justify-between gap-4 border-b border-slate-100 pb-2'>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='rounded bg-slate-900 px-2 py-0.5 text-[10px] font-black tracking-widest text-white uppercase'>
                            Gruppe
                          </span>
                          <span className='font-mono text-sm font-bold tabular-nums'>
                            {timeRange}
                          </span>
                          {hasWheelchair && (
                            <Accessibility
                              className='h-4 w-4 text-red-600'
                              strokeWidth={3}
                            />
                          )}
                          {billingType?.name && (
                            <span className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                              {billingType.name}
                            </span>
                          )}
                        </div>
                        <div className='mt-1 text-sm font-bold text-slate-900'>
                          {passengerNames.length > 0
                            ? passengerNames.join(', ')
                            : `${group.trips.length} Fahrten`}
                        </div>
                      </div>
                      {group.groupId && (
                        <div className='text-right text-[10px] font-bold text-slate-400 tabular-nums'>
                          {group.groupId}
                        </div>
                      )}
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <div className='mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase'>
                          Abholungen
                        </div>
                        <div className='space-y-2'>
                          {pickups.map((p, i) => (
                            <div key={`p-${i}`} className='flex gap-2'>
                              <div className='w-8 shrink-0 rounded bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white'>
                                A{i + 1}
                              </div>
                              <div className='min-w-0'>
                                <div>{formatAddress(p.address)}</div>
                                {p.station && (
                                  <div className='text-xs text-slate-500'>
                                    ({p.station})
                                  </div>
                                )}
                                {p.names.length > 0 && (
                                  <div className='text-xs font-medium text-slate-600'>
                                    {p.names.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className='mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase'>
                          Ziele
                        </div>
                        <div className='space-y-2'>
                          {dropoffs.map((d, i) => (
                            <div key={`d-${i}`} className='flex gap-2'>
                              <div className='w-8 shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white'>
                                Z{i + 1}
                              </div>
                              <div className='min-w-0'>
                                <div>{formatAddress(d.address)}</div>
                                {d.station && (
                                  <div className='text-xs text-slate-500'>
                                    ({d.station})
                                  </div>
                                )}
                                {d.names.length > 0 && (
                                  <div className='text-xs font-medium text-slate-600'>
                                    {d.names.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
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
