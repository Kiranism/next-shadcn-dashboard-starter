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
      phones: string[];
      time: string | null;
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
          names: t.client_name ? [t.client_name] : [],
          phones: t.client_phone ? [t.client_phone] : [],
          time: t.scheduled_at ?? null
        });
        pickupKeys.add(key);
      } else {
        const p = pickups.find(
          (x) =>
            x.address === t.pickup_address &&
            (x.station || '') === (t.pickup_station || '')
        );
        if (p) {
          if (t.client_name && !p.names.includes(t.client_name))
            p.names.push(t.client_name);
          if (t.client_phone && !p.phones.includes(t.client_phone))
            p.phones.push(t.client_phone);
        }
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
          names: t.client_name ? [t.client_name] : [],
          phones: t.client_phone ? [t.client_phone] : [],
          time: t.scheduled_at ?? null
        });
        dropoffKeys.add(key);
      } else {
        const d = dropoffs.find(
          (x) =>
            x.address === t.dropoff_address &&
            (x.station || '') === (t.dropoff_station || '')
        );
        if (d) {
          if (t.client_name && !d.names.includes(t.client_name))
            d.names.push(t.client_name);
          if (t.client_phone && !d.phones.includes(t.client_phone))
            d.phones.push(t.client_phone);
        }
      }
    }

    return { pickups, dropoffs };
  }, []);

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

      {/* Trip Cards - Denser & Color Coded */}
      <div className='space-y-2'>
        {tripGroups.map((group) => {
          const isGrouped = group.trips.length > 1;
          const primaryTrip = group.trips[0];
          const billingType = primaryTrip?.billing_types;
          const billingColor = billingType?.color || null;

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

          if (!isGrouped && primaryTrip) {
            const trip = primaryTrip;
            const singleBillingType = trip.billing_types;
            const singleBillingColor = singleBillingType?.color || null;

            return (
              <div
                key={group.key}
                className='relative overflow-hidden rounded-xl border border-slate-200 p-3 shadow-sm'
                style={{
                  backgroundColor: singleBillingColor
                    ? `color-mix(in srgb, ${singleBillingColor}, white 92%)`
                    : 'white'
                }}
              >
                {/* Left Accent */}
                <div
                  className='absolute top-0 left-0 h-full w-1.5'
                  style={{ backgroundColor: singleBillingColor || '#0f172a' }}
                />

                {/* Card Header: Time and Name */}
                <div className='mb-2 flex items-center justify-between gap-3 border-b border-slate-100/50 pb-2'>
                  <div className='flex min-w-0 flex-1 items-center gap-2'>
                    <div
                      className='shrink-0 rounded-lg px-2.5 py-1 text-base font-black text-white tabular-nums'
                      style={{
                        backgroundColor: singleBillingColor || '#0f172a'
                      }}
                    >
                      {format(new Date(trip.scheduled_at), 'HH:mm')}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5'>
                        <p className='truncate text-base font-extrabold text-slate-900'>
                          {trip.client_name || 'Anonym'}
                        </p>
                        {trip.is_wheelchair && (
                          <Accessibility
                            className='h-4 w-4 shrink-0 text-red-600'
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className='flex items-center justify-between'>
                        {trip.client_phone && (
                          <p
                            className='text-[10px] font-bold text-slate-600 tabular-nums'
                            data-phone={trip.client_phone}
                          >
                            {trip.client_phone}
                          </p>
                        )}
                        {singleBillingType?.name && (
                          <p className='text-[9px] font-bold tracking-wider text-slate-500 uppercase'>
                            {singleBillingType.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Section - Combined */}
                <div className='space-y-1.5 px-0.5'>
                  {/* Start */}
                  <div className='flex items-baseline gap-2'>
                    <span className='w-10 text-[10px] font-black tracking-tighter text-slate-400 uppercase'>
                      Start
                    </span>
                    <div
                      className='flex-1 text-sm leading-tight'
                      data-address={trip.pickup_address || ''}
                    >
                      {formatAddress(trip.pickup_address)}
                      {trip.pickup_station && (
                        <span className='ml-1.5 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-700'>
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
                    <div
                      className='flex-1 text-sm leading-tight'
                      data-address={trip.dropoff_address || ''}
                    >
                      {formatAddress(trip.dropoff_address)}
                      {trip.dropoff_station && (
                        <span className='ml-1.5 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-700'>
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
                    <div className='mt-2 flex items-start gap-2 rounded-lg border border-amber-100/50 bg-amber-50/50 p-2'>
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
          }

          const passengerMap = new Map<
            string,
            { name: string; wheelchair: boolean }
          >();
          for (const t of group.trips) {
            const name = t.client_name?.trim();
            if (!name) continue;
            const existing = passengerMap.get(name);
            if (existing) {
              if (t.is_wheelchair) existing.wheelchair = true;
            } else {
              passengerMap.set(name, { name, wheelchair: t.is_wheelchair });
            }
          }
          const passengerEntries = Array.from(passengerMap.values());
          const passengerNames = passengerEntries.map((p) => p.name);

          const dropoffStops = new Map<
            string,
            { address: string | null; station: string | null; names: string[] }
          >();

          const pickupStops = new Map<
            string,
            { address: string | null; station: string | null; names: string[] }
          >();

          for (const t of group.trips) {
            const key = `${t.pickup_address || ''}-${t.pickup_station || ''}`;
            if (!pickupStops.has(key)) {
              pickupStops.set(key, {
                address: t.pickup_address ?? null,
                station: t.pickup_station ?? null,
                names: t.client_name ? [t.client_name] : []
              });
            } else {
              const s = pickupStops.get(key);
              if (s && t.client_name && !s.names.includes(t.client_name)) {
                s.names.push(t.client_name);
              }
            }
          }

          for (const t of group.trips) {
            const key = `${t.dropoff_address || ''}-${t.dropoff_station || ''}`;
            if (!dropoffStops.has(key)) {
              dropoffStops.set(key, {
                address: t.dropoff_address ?? null,
                station: t.dropoff_station ?? null,
                names: t.client_name ? [t.client_name] : []
              });
            } else {
              const s = dropoffStops.get(key);
              if (s && t.client_name && !s.names.includes(t.client_name)) {
                s.names.push(t.client_name);
              }
            }
          }

          const uniqueDropoffs = Array.from(dropoffStops.values()).filter(
            (s) => (s.address || '').trim() !== ''
          );

          const uniquePickups = Array.from(pickupStops.values()).filter(
            (s) => (s.address || '').trim() !== ''
          );

          const effectivePickups =
            uniquePickups.length > 0
              ? uniquePickups
              : [
                  {
                    address: primaryTrip?.pickup_address ?? null,
                    station: primaryTrip?.pickup_station ?? null,
                    names: passengerNames
                  }
                ];

          const effectiveDropoffs =
            uniqueDropoffs.length > 0
              ? uniqueDropoffs
              : [
                  {
                    address: primaryTrip?.dropoff_address ?? null,
                    station: primaryTrip?.dropoff_station ?? null,
                    names: passengerNames
                  }
                ];

          return (
            <div
              key={group.key}
              className='relative overflow-hidden rounded-xl border border-slate-200 p-3 shadow-sm'
              style={{
                backgroundColor: billingColor
                  ? `color-mix(in srgb, ${billingColor}, white 92%)`
                  : 'white'
              }}
            >
              {/* Left Accent */}
              <div
                className='absolute top-0 left-0 h-full w-1.5'
                style={{ backgroundColor: billingColor || '#0f172a' }}
              />

              {/* Card Header: Time and Names (time stays as-is) */}
              <div className='mb-2 flex items-center justify-between gap-3 border-b border-slate-100/50 pb-2'>
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <div
                    className='shrink-0 rounded-lg px-2.5 py-1 text-base font-black text-white tabular-nums'
                    style={{ backgroundColor: billingColor || '#0f172a' }}
                  >
                    {primaryTrip?.scheduled_at
                      ? format(new Date(primaryTrip.scheduled_at), 'HH:mm')
                      : '-'}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <div className='truncate text-base font-extrabold text-slate-900'>
                        {passengerEntries.length > 0
                          ? passengerEntries.map((p, index) => (
                              <span
                                key={p.name}
                                className='inline-flex items-center'
                              >
                                {index > 0 && ', '}
                                <span>{p.name}</span>
                                {p.wheelchair && (
                                  <Accessibility
                                    className='ml-1 h-4 w-4 shrink-0 text-red-600'
                                    strokeWidth={3}
                                  />
                                )}
                              </span>
                            ))
                          : `${group.trips.length} Fahrten`}
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      {billingType?.name && (
                        <p className='text-[9px] font-bold tracking-wider text-slate-500 uppercase'>
                          {billingType.name}
                        </p>
                      )}
                      {group.groupId && (
                        <p className='text-[9px] font-bold text-slate-400 uppercase'>
                          Gruppe
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Section - Default items + Ziel 2 */}
              <div className='space-y-1.5 px-0.5'>
                {/* Starts (dynamic) */}
                {effectivePickups.map((start, index) => (
                  <div
                    key={`start-${index}`}
                    className='flex items-baseline gap-2'
                  >
                    <span className='w-10 text-[10px] font-black tracking-tighter text-slate-400 uppercase'>
                      {index === 0 ? 'Start' : `Start ${index + 1}`}
                    </span>
                    <div
                      className='flex-1 text-sm leading-tight'
                      data-address={start.address || ''}
                    >
                      {formatAddress(start.address)}
                      {start.station && (
                        <span className='ml-1.5 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-700'>
                          {start.station}
                        </span>
                      )}
                      <span className='ml-1 text-[11px] font-medium text-slate-400'>
                        {formatCity(start.address)}
                      </span>
                      {start.names.length > 0 && (
                        <div className='mt-0.5 text-[10px] font-bold text-slate-600'>
                          {start.names.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Ziele (dynamic) */}
                {effectiveDropoffs.map((ziel, index) => (
                  <div
                    key={`ziel-${index}`}
                    className='flex items-baseline gap-2'
                  >
                    <span className='w-10 text-[10px] font-black tracking-tighter text-slate-400 uppercase'>
                      {index === 0 ? 'Ziel' : `Ziel ${index + 1}`}
                    </span>
                    <div
                      className='flex-1 text-sm leading-tight'
                      data-address={ziel.address || ''}
                    >
                      {formatAddress(ziel.address)}
                      {ziel.station && (
                        <span className='ml-1.5 inline-flex items-center rounded border border-slate-100 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-700'>
                          {ziel.station}
                        </span>
                      )}
                      <span className='ml-1 text-[11px] font-medium text-slate-400'>
                        {formatCity(ziel.address)}
                      </span>
                      {ziel.names.length > 0 && (
                        <div className='mt-0.5 text-[10px] font-bold text-slate-600'>
                          {ziel.names.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Notes - Only if applicable */}
                {group.trips.some((t) => t.notes && t.notes.trim() !== '') && (
                  <div className='mt-2 flex items-start gap-2 rounded-lg border border-amber-100/50 bg-amber-50/50 p-2'>
                    <span className='mt-0.5 text-[9px] font-black tracking-tighter text-amber-600 uppercase'>
                      Hinweis
                    </span>
                    <p className='flex-1 text-[11px] leading-tight font-bold text-amber-900'>
                      {group.trips
                        .map((t) => t.notes?.trim())
                        .filter((n): n is string => !!n)
                        .slice(0, 1)[0] || ''}
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
