'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Flag,
  Navigation,
  Phone,
  User2,
  Briefcase,
  History,
  Clock,
  AlertCircle,
  CreditCard,
  Trash2,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Trip } from '@/features/trips/api/trips.service';
import { useTripCancellation } from '@/features/trips/hooks/use-trip-cancellation';
import { hasPairedLeg } from '@/features/trips/api/recurring-exceptions.actions';
import { RecurringTripCancelDialog } from '@/features/trips/components/recurring-trip-cancel-dialog';
import { copyTripToClipboard } from '@/features/trips/lib/share-utils';

interface TripDetailSheetProps {
  tripId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TripDetailSheet({
  tripId,
  isOpen,
  onOpenChange
}: TripDetailSheetProps) {
  const { trip, isLoading: isTripLoading } = useTrip(tripId);
  const [groupTrips, setGroupTrips] = useState<any[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isUpdatingDriver, setIsUpdatingDriver] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [hasPair, setHasPair] = useState(false);
  const { cancelTrip, isLoading: isCancelling } = useTripCancellation();

  useEffect(() => {
    const fetchDrivers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'driver')
        .order('name');
      setDrivers(data || []);
    };
    fetchDrivers();
  }, []);

  const handleDriverChange = async (driverId: string) => {
    if (!trip) return;
    setIsUpdatingDriver(true);
    const supabase = createClient();
    try {
      if (trip.group_id) {
        const { error } = await supabase
          .from('trips')
          .update({ driver_id: driverId === 'unassigned' ? null : driverId })
          .eq('group_id', trip.group_id);
        if (error) throw error;
        toast.success(`Fahrer für die gesamte Gruppe aktualisiert`);
      } else {
        const { error } = await supabase
          .from('trips')
          .update({ driver_id: driverId === 'unassigned' ? null : driverId })
          .eq('id', trip.id);
        if (error) throw error;
        toast.success('Fahrer aktualisiert');
      }
    } catch (error: any) {
      toast.error(`Fehler beim Zuweisen des Fahrers: ${error.message}`);
    } finally {
      setIsUpdatingDriver(false);
    }
  };

  useEffect(() => {
    const fetchGroup = async () => {
      if (trip?.group_id) {
        setIsLoadingGroup(true);
        const supabase = createClient();
        const { data } = await supabase
          .from('trips')
          .select('*')
          .eq('group_id', trip.group_id)
          .order('scheduled_at', { ascending: true });
        setGroupTrips(data || []);
        setIsLoadingGroup(false);
      } else {
        setGroupTrips([]);
      }
    };
    fetchGroup();
  }, [trip?.group_id]);

  const isLoading = isTripLoading || isLoadingGroup;

  const handleOpenCancelDialog = async () => {
    if (!trip) return;
    setIsCancelDialogOpen(true);
    try {
      const pairExists = await hasPairedLeg(trip as Trip);
      setHasPair(pairExists);
    } catch {
      setHasPair(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'ERLEDIGT',
          class: 'bg-green-500/10 text-green-600 border-green-200'
        };
      case 'assigned':
        return {
          label: 'ZUGEWIESEN',
          class: 'bg-blue-500/10 text-blue-600 border-blue-200'
        };
      case 'in_progress':
      case 'driving':
        return {
          label: 'UNTERWEGS',
          class: 'bg-amber-500/10 text-amber-600 border-amber-200'
        };
      case 'cancelled':
        return {
          label: 'STORNIERT',
          class: 'bg-red-500/10 text-red-600 border-red-200'
        };
      default:
        return {
          label: status.toUpperCase(),
          class: 'bg-slate-100 text-slate-600 border-slate-200'
        };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col border-l p-0 sm:max-w-xl'>
        {/* Accessibility: Always provide a title */}
        <VisuallyHidden.Root>
          <SheetTitle>Fahrt Details {tripId}</SheetTitle>
        </VisuallyHidden.Root>

        {isLoading ? (
          <div className='space-y-6 p-6'>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Separator />
            <div className='space-y-4'>
              <Skeleton className='h-24 w-full rounded-xl' />
              <Skeleton className='h-24 w-full rounded-xl' />
              <Skeleton className='h-24 w-full rounded-xl' />
            </div>
          </div>
        ) : trip ? (
          <>
            <div
              className='relative overflow-hidden border-b p-6 pb-4'
              style={{
                backgroundColor: trip.billing_types?.color
                  ? `color-mix(in srgb, ${trip.billing_types.color}, white 90%)`
                  : 'transparent',
                borderBottomColor: trip.billing_types?.color || '#e2e8f0'
              }}
            >
              <div
                className='absolute inset-y-0 left-0 w-1.5'
                style={{ backgroundColor: trip.billing_types?.color }}
              />
              <div className='mb-2 flex items-start justify-between'>
                <Badge className={getStatusInfo(trip.status).class}>
                  {getStatusInfo(trip.status).label}
                </Badge>
              </div>
              <SheetHeader className='space-y-1 pl-3 text-left'>
                <SheetTitle className='text-2xl font-bold tracking-tight'>
                  {trip.client_name || 'Unbekannter Kunde'}
                </SheetTitle>
                <SheetDescription className='text-foreground flex items-center gap-2 font-medium'>
                  <Clock className='text-primary h-4 w-4' />
                  {trip.scheduled_at
                    ? format(new Date(trip.scheduled_at), 'PPPP p')
                    : 'Keine Zeit'}
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto px-6'>
              <div className='space-y-8 py-6 pb-20'>
                {/* Timeline / Stops */}
                <section>
                  <div className='mb-6 flex items-center justify-between'>
                    <h3 className='text-muted-foreground text-xs font-bold tracking-widest uppercase'>
                      Route & Verlauf
                    </h3>
                    <Badge
                      variant='outline'
                      className='h-5 px-2 py-0 text-[10px] font-semibold'
                    >
                      {trip.distance_km ? `${trip.distance_km} km` : 'Geplant'}
                    </Badge>
                  </div>

                  <div className='relative ml-3 space-y-0'>
                    {/* Vertical Line Connector */}
                    <div className='absolute top-4 bottom-4 left-[11px] w-[2px] bg-slate-100' />

                    {(() => {
                      const tripsToMap =
                        groupTrips.length > 0 ? groupTrips : [trip];

                      const pickups: any[] = [];
                      const pickupAddresses = new Set<string>();
                      tripsToMap.forEach((t) => {
                        if (!t.pickup_address) return;
                        const key = `${t.pickup_address}-${t.pickup_station || ''}`;
                        if (!pickupAddresses.has(key)) {
                          pickups.push({
                            address: t.pickup_address,
                            station: t.pickup_station,
                            name: t.client_name,
                            time: t.actual_pickup_at,
                            update: t.stop_updates?.[t.pickup_address]
                          });
                          pickupAddresses.add(key);
                        } else {
                          const p = pickups.find(
                            (x) => x.address === t.pickup_address
                          );
                          if (p && t.client_name) {
                            if (!p.name?.includes(t.client_name)) {
                              p.name = p.name
                                ? `${p.name}, ${t.client_name}`
                                : t.client_name;
                            }
                          }
                        }
                      });

                      const dropoffs: any[] = [];
                      const dropoffAddresses = new Set<string>();
                      tripsToMap.forEach((t) => {
                        if (!t.dropoff_address) return;
                        const key = `${t.dropoff_address}-${t.dropoff_station || ''}`;
                        if (!dropoffAddresses.has(key)) {
                          dropoffs.push({
                            address: t.dropoff_address,
                            station: t.dropoff_station,
                            name: t.client_name,
                            time: t.actual_dropoff_at,
                            update: t.stop_updates?.[t.dropoff_address]
                          });
                          dropoffAddresses.add(key);
                        } else {
                          const d = dropoffs.find(
                            (x) => x.address === t.dropoff_address
                          );
                          if (d && t.client_name) {
                            if (!d.name?.includes(t.client_name)) {
                              d.name = d.name
                                ? `${d.name}, ${t.client_name}`
                                : t.client_name;
                            }
                          }
                        }
                      });

                      return (
                        <>
                          {pickups.map((p, i) => (
                            <TimelineItem
                              key={`pickup-${i}`}
                              stopLabel={`A${i + 1}`}
                              title={
                                i === 0
                                  ? 'Start / Abholung'
                                  : `Abholung ${i + 1}`
                              }
                              address={p.address}
                              name={p.name}
                              time={p.time}
                              station={p.station}
                              update={p.update}
                              isCompleted={!!p.time}
                            />
                          ))}

                          {dropoffs.map((d, i) => (
                            <TimelineItem
                              key={`dropoff-${i}`}
                              stopLabel={`Z${i + 1}`}
                              title={
                                i === dropoffs.length - 1
                                  ? 'Ziel / Ankunft'
                                  : `Ausstieg ${i + 1}`
                              }
                              address={d.address}
                              name={d.name}
                              time={d.time}
                              station={d.station}
                              update={d.update}
                              isCompleted={!!d.time}
                              isLast={i === dropoffs.length - 1}
                            />
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </section>

                <Separator />

                {/* Details Grid */}
                <section className='grid grid-cols-2 gap-x-8 gap-y-6 px-1'>
                  <DetailItem
                    icon={<User2 className='h-3.5 w-3.5' />}
                    label='Fahrer'
                  >
                    <Select
                      value={trip.driver_id || 'unassigned'}
                      onValueChange={handleDriverChange}
                      disabled={isUpdatingDriver}
                    >
                      <SelectTrigger className='h-8 border-slate-200 text-xs font-semibold'>
                        <SelectValue placeholder='Fahrer auswählen' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value='unassigned'
                          className='text-muted-foreground text-xs italic'
                        >
                          Nicht zugewiesen
                        </SelectItem>
                        {drivers.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                            className='text-xs font-medium'
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DetailItem>
                  <DetailItem
                    icon={<Navigation className='h-3.5 w-3.5' />}
                    label='Fahrzeug'
                    value={
                      trip.is_wheelchair
                        ? 'Rollstuhl / Spezial'
                        : 'Kombi / Standard'
                    }
                  />
                  <DetailItem
                    icon={<CreditCard className='h-3.5 w-3.5' />}
                    label='Abrechnung'
                    value={trip.billing_types?.name || 'Privat'}
                  />
                  <DetailItem
                    icon={<Briefcase className='h-3.5 w-3.5' />}
                    label='Kostenträger'
                    value={trip.payers?.name || '---'}
                  />
                  <DetailItem
                    icon={<Phone className='h-3.5 w-3.5' />}
                    label='Kontakt'
                    value={trip.client_phone || 'Keine Nummer'}
                  />
                </section>

                {trip.notes && (
                  <section className='rounded-lg border border-amber-100 bg-amber-50 p-3'>
                    <h4 className='mb-1 flex items-center gap-1 text-xs font-bold text-amber-800'>
                      <AlertCircle className='h-3 w-3' /> Wichtige Hinweise
                    </h4>
                    <p className='text-sm text-amber-900'>{trip.notes}</p>
                  </section>
                )}
              </div>
            </div>

            <SheetFooter className='bg-background mt-auto flex items-center justify-between gap-3 border-t'>
              <div className='text-muted-foreground flex flex-col text-[11px] leading-snug'>
                <span className='font-semibold'>
                  Fahrt-ID:{' '}
                  <span className='font-mono'>
                    {trip.id.slice(0, 8)}
                    {'…'}
                  </span>
                </span>
                {trip.rule_id && (
                  <span className='font-mono text-[10px]'>
                    Serie: {trip.rule_id.slice(0, 8)}
                    {'…'}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  onClick={async () => {
                    const success = await copyTripToClipboard(trip as Trip);
                    if (success) {
                      toast.success('Details kopiert');
                    } else {
                      toast.error('Fehler beim Kopieren');
                    }
                  }}
                >
                  <Share2 className='mr-1.5 h-3.5 w-3.5' />
                  QuickShare
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => onOpenChange(false)}
                >
                  Schließen
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  disabled={isCancelling}
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    handleOpenCancelDialog();
                  }}
                >
                  <Trash2 className='mr-1.5 h-3.5 w-3.5' />
                  Fahrt stornieren
                </Button>
              </div>
            </SheetFooter>

            <RecurringTripCancelDialog
              trip={trip as Trip}
              hasPair={hasPair}
              isOpen={isCancelDialogOpen}
              isLoading={isCancelling}
              title='Fahrt stornieren?'
              description='Möchten Sie diese Fahrt wirklich stornieren?'
              onOpenChange={setIsCancelDialogOpen}
              onConfirmSingle={(reason) => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                cancelTrip(
                  trip as Trip,
                  trip.rule_id ? 'skip-occurrence' : 'single-nonrecurring',
                  {
                    source: 'Manually cancelled via Trip Detail Sheet',
                    reason
                  }
                ).then(() => setIsCancelDialogOpen(false));
              }}
              onConfirmWithPair={
                trip.rule_id && hasPair
                  ? (reason) => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      cancelTrip(trip as Trip, 'skip-occurrence-and-paired', {
                        source:
                          'Manually cancelled (Hin/Rück) via Trip Detail Sheet',
                        reason
                      }).then(() => setIsCancelDialogOpen(false));
                    }
                  : undefined
              }
              onConfirmSeries={
                trip.rule_id
                  ? (reason) => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      cancelTrip(trip as Trip, 'cancel-series', {
                        source:
                          'Recurring series cancelled via Trip Detail Sheet',
                        reason
                      }).then(() => setIsCancelDialogOpen(false));
                    }
                  : undefined
              }
              singleLabel={
                trip.rule_id
                  ? 'Nur diese Fahrt stornieren (Aussetzen)'
                  : 'Fahrt stornieren'
              }
              pairLabel='Diese Fahrt & Rückfahrt stornieren'
              seriesLabel='Gesamte Serie beenden'
            />
          </>
        ) : (
          <div className='text-muted-foreground p-10 text-center'>
            Fehler beim Laden der Fahrt-Details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimelineItem({
  stopLabel,
  title,
  address,
  name,
  time,
  station,
  update,
  isCompleted,
  isLast
}: any) {
  const isCancelled = update?.status === 'not_present';

  return (
    <div className={`relative pb-8 pl-10 ${isLast ? 'pb-2' : ''}`}>
      <div className='absolute top-[10px] left-0 z-10'>
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold whitespace-nowrap shadow-sm ring-[4px] ring-white',
            stopLabel?.startsWith('A')
              ? 'border-green-600 bg-green-500 text-white'
              : 'border-red-600 bg-red-500 text-white'
          )}
        >
          {stopLabel}
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-[10px] font-bold tracking-tighter uppercase'>
            {title}
          </span>
          {time && (
            <span className='rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600 italic'>
              Erledigt: {format(new Date(time), 'HH:mm')}
            </span>
          )}
        </div>
        <div
          className={`flex flex-col text-sm leading-snug font-semibold ${isCancelled ? 'line-through opacity-50' : ''}`}
        >
          {address}
          {station && (
            <span className='text-xs font-normal text-slate-500'>
              ({station})
            </span>
          )}
        </div>
        {name && (
          <span className='text-xs font-medium text-slate-600'>
            Fahrgast: {name}
          </span>
        )}

        {isCancelled && (
          <div className='mt-1 flex w-fit items-center gap-1 rounded border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600'>
            <AlertCircle className='h-3 w-3' /> PERSON NICHT ERSCHIENEN
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, children }: any) {
  return (
    <div className='space-y-1.5'>
      <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
        {icon}
        {label}
      </div>
      <div className='pl-6 text-sm font-semibold'>{children || value}</div>
    </div>
  );
}
