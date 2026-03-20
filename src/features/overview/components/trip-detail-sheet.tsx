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
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Navigation,
  Phone,
  User2,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Trash2,
  Share2,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { Trip } from '@/features/trips/api/trips.service';
import { useTripCancellation } from '@/features/trips/hooks/use-trip-cancellation';
import {
  hasPairedLeg,
  findPairedTrip
} from '@/features/trips/api/recurring-exceptions.actions';
import { RecurringTripCancelDialog } from '@/features/trips/components/recurring-trip-cancel-dialog';
import { copyTripToClipboard } from '@/features/trips/lib/share-utils';
import {
  getCancelledPartnerLabel,
  getTripDirection
} from '@/features/trips/lib/trip-direction';
import { shouldShowCreateReturnTripButton } from '@/features/trips/lib/can-create-linked-return';
import { CreateReturnTripDialog } from '@/features/trips/components/return-trip';
import { tripsService } from '@/features/trips/api/trips.service';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';

interface TripDetailSheetProps {
  tripId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Switch the sheet to another trip (e.g. linked Hinfahrt/Rückfahrt). */
  onNavigateToTrip?: (tripId: string) => void;
}

export function TripDetailSheet({
  tripId,
  isOpen,
  onOpenChange,
  onNavigateToTrip
}: TripDetailSheetProps) {
  const { trip, isLoading: isTripLoading } = useTrip(tripId);
  const [groupTrips, setGroupTrips] = useState<any[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isUpdatingDriver, setIsUpdatingDriver] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [hasPair, setHasPair] = useState(false);
  const [linkedPartner, setLinkedPartner] = useState<Trip | null>(null);
  const [isCreateReturnOpen, setIsCreateReturnOpen] = useState(false);
  /** `HH:mm` for inline time edit; only used when `trip.scheduled_at` is set */
  const [timeDraft, setTimeDraft] = useState('');
  const [isSavingTime, setIsSavingTime] = useState(false);
  const { cancelTrip, isLoading: isCancelling } = useTripCancellation();

  // Time draft: only treat as "live" while the sheet is open. Closing discards
  // unsaved edits by resetting from `trip.scheduled_at` (server / cache).
  useEffect(() => {
    if (!isOpen) {
      if (trip?.scheduled_at) {
        setTimeDraft(format(new Date(trip.scheduled_at), 'HH:mm'));
      } else {
        setTimeDraft('');
      }
      return;
    }
    if (!trip?.scheduled_at) {
      setTimeDraft('');
      return;
    }
    setTimeDraft(format(new Date(trip.scheduled_at), 'HH:mm'));
  }, [isOpen, trip?.id, trip?.scheduled_at]);

  useEffect(() => {
    const fetchDrivers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('accounts')
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
      const newDriverId = driverId === 'unassigned' ? null : driverId;
      const payload: { driver_id: string | null; status?: string } = {
        driver_id: newDriverId
      };
      const derivedStatus = getStatusWhenDriverChanges(
        trip.status,
        newDriverId
      );
      if (derivedStatus) payload.status = derivedStatus;

      if (trip.group_id) {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('group_id', trip.group_id);
        if (error) throw error;
        toast.success(`Fahrer für die gesamte Gruppe aktualisiert`);
      } else {
        const { error } = await supabase
          .from('trips')
          .update(payload)
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
          .order('stop_order', { ascending: true, nullsFirst: false })
          .order('scheduled_at', { ascending: true });
        setGroupTrips(data || []);
        setIsLoadingGroup(false);
      } else {
        setGroupTrips([]);
      }
    };
    fetchGroup();
  }, [trip?.group_id]);

  useEffect(() => {
    if (!trip) {
      setLinkedPartner(null);
      return;
    }
    findPairedTrip(trip as Trip).then((p) => setLinkedPartner(p ?? null));
  }, [trip?.id]);

  const isLoading = isTripLoading || isLoadingGroup;

  /** Legs sharing `group_id`, or a single-element array for a non-grouped trip. */
  const effectiveGroupTrips: Trip[] =
    trip && trip.group_id && groupTrips.length > 0
      ? (groupTrips as Trip[])
      : trip
        ? [trip as Trip]
        : [];

  const showCreateReturnButton = trip
    ? shouldShowCreateReturnTripButton(
        trip as Trip,
        !!linkedPartner,
        trip.billing_types
      )
    : false;

  useEffect(() => {
    if (!showCreateReturnButton) setIsCreateReturnOpen(false);
  }, [showCreateReturnButton]);

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
    const s = status as TripStatus;
    return {
      label: (tripStatusLabels[s] ?? status).toUpperCase(),
      class: tripStatusBadge({ status: s })
    };
  };

  const tripLegDirection = trip ? getTripDirection(trip as Trip) : 'standalone';

  const timeDirty =
    isOpen &&
    !!trip?.scheduled_at &&
    !!timeDraft &&
    (() => {
      const next = applyTimeToScheduledDate(trip.scheduled_at, timeDraft);
      return next.toISOString() !== new Date(trip.scheduled_at).toISOString();
    })();

  const handleSaveTime = async () => {
    if (!isOpen || !trip?.scheduled_at || !timeDraft) return;
    setIsSavingTime(true);
    try {
      const next = applyTimeToScheduledDate(trip.scheduled_at, timeDraft);
      await tripsService.updateTrip(trip.id, {
        scheduled_at: next.toISOString()
      });
      toast.success('Zeit aktualisiert');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Speichern fehlgeschlagen: ${message}`);
    } finally {
      setIsSavingTime(false);
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
                  ? `color-mix(in srgb, ${trip.billing_types.color}, var(--background) 90%)`
                  : 'transparent',
                borderBottomColor: trip.billing_types?.color || '#e2e8f0'
              }}
            >
              <div
                className='absolute inset-y-0 left-0 w-1.5'
                style={{ backgroundColor: trip.billing_types?.color }}
              />
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <Badge className={getStatusInfo(trip.status).class}>
                  {getStatusInfo(trip.status).label}
                </Badge>
                {tripLegDirection !== 'standalone' && (
                  <Badge
                    variant='outline'
                    className='border-border bg-background/60 text-[10px] font-semibold shadow-none'
                  >
                    {tripLegDirection === 'rueckfahrt'
                      ? 'Rückfahrt'
                      : 'Hinfahrt'}
                  </Badge>
                )}
                {linkedPartner?.status === 'cancelled' && (
                  <Badge
                    variant='destructive'
                    className='gap-1 px-2 py-0.5 text-[10px] font-bold'
                  >
                    <AlertTriangle className='h-3 w-3' />
                    {/* We pass the CURRENT trip (not the cancelled partner) so
                        getCancelledPartnerLabel can return the partner's label. */}
                    {getCancelledPartnerLabel(trip as Trip)}
                  </Badge>
                )}
              </div>
              <SheetHeader className='space-y-1 pl-3 text-left'>
                <SheetTitle className='text-2xl font-bold tracking-tight'>
                  {trip.client_name || 'Unbekannter Kunde'}
                </SheetTitle>
                <div className='flex w-full min-w-0 items-center justify-between gap-2'>
                  <SheetDescription className='text-foreground flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1 font-medium'>
                    {trip.scheduled_at ? (
                      <>
                        <span className='min-w-0'>
                          {format(new Date(trip.scheduled_at), 'PPPP', {
                            locale: de
                          })}
                        </span>
                        <span className='text-muted-foreground' aria-hidden>
                          ·
                        </span>
                        {/* Match kanban-trip-card time chip: muted surface + centered digits (`span` = valid inside `<p>` description) */}
                        <span
                          className={cn(
                            'border-border/80 inline-grid h-8 min-w-[4.75rem] shrink-0 place-items-center rounded-md border align-middle',
                            'bg-muted/80 hover:bg-muted transition-colors',
                            (isSavingTime || !isOpen) &&
                              'pointer-events-none opacity-70'
                          )}
                        >
                          <input
                            type='time'
                            step={60}
                            value={timeDraft}
                            onChange={(e) => setTimeDraft(e.target.value)}
                            disabled={isSavingTime || !isOpen}
                            title='Zeit bearbeiten'
                            aria-label='Geplante Uhrzeit bearbeiten'
                            className={cn(
                              'h-8 w-full min-w-[4.75rem] cursor-text rounded-md border-0 bg-transparent px-1.5',
                              'text-foreground text-center text-sm font-semibold outline-none',
                              '[&::-webkit-calendar-picker-indicator]:hidden',
                              '[&::-webkit-datetime-edit]:m-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:h-full [&::-webkit-datetime-edit]:w-full [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:justify-center',
                              '[&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center',
                              '[&::-moz-calendar-picker-indicator]:hidden',
                              'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2'
                            )}
                          />
                        </span>
                      </>
                    ) : (
                      <span>Keine Zeit</span>
                    )}
                  </SheetDescription>
                  <Button
                    type='button'
                    variant='default'
                    size='sm'
                    className='h-8 shrink-0 gap-1.5 px-3'
                    title='Details in die Zwischenablage kopieren'
                    aria-label='Teilen: Details kopieren'
                    onClick={async () => {
                      const success = await copyTripToClipboard(trip as Trip);
                      if (success) {
                        toast.success('Details kopiert');
                      } else {
                        toast.error('Fehler beim Kopieren');
                      }
                    }}
                  >
                    <Share2 className='h-4 w-4 shrink-0' />
                    <span className='text-xs font-medium'>Teilen</span>
                  </Button>
                </div>
              </SheetHeader>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto px-6'>
              <div className='space-y-8 py-6 pb-20'>
                {linkedPartner && trip && (
                  <LinkedPartnerCallout
                    anchorTrip={trip as Trip}
                    partner={linkedPartner}
                    statusClass={getStatusInfo(linkedPartner.status).class}
                    statusLabel={getStatusInfo(linkedPartner.status).label}
                    onNavigateToTrip={onNavigateToTrip}
                  />
                )}

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
                      {trip.driving_distance_km
                        ? `${trip.driving_distance_km} km`
                        : 'Geplant'}
                    </Badge>
                  </div>

                  <div className='relative ml-3 space-y-0'>
                    {/* Vertical Line Connector */}
                    <div className='bg-border absolute top-4 bottom-4 left-[11px] w-[2px]' />

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
                            passengerStation: t.pickup_station,
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
                            passengerStation: t.dropoff_station,
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
                              passengerStation={p.passengerStation}
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
                              passengerStation={d.passengerStation}
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
                      <SelectTrigger className='border-border h-8 text-xs font-semibold'>
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
                    icon={<Briefcase className='h-3.5 w-3.5' />}
                    label='Kostenträger'
                    value={trip.payers?.name || '---'}
                  />
                  <DetailItem
                    icon={<CreditCard className='h-3.5 w-3.5' />}
                    label='Abrechnung'
                    value={
                      trip.billing_types?.name?.trim()
                        ? trip.billing_types.name.trim()
                        : '-'
                    }
                  />
                  <DetailItem
                    icon={<Phone className='h-3.5 w-3.5' />}
                    label='Kontakt'
                    value={trip.client_phone || 'Keine Nummer'}
                  />
                </section>

                {trip.notes && (
                  <section className='rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40'>
                    <h4 className='mb-1 flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-400'>
                      <AlertCircle className='h-3 w-3' /> Wichtige Hinweise
                    </h4>
                    <p className='text-sm text-amber-900 dark:text-amber-300'>
                      {trip.notes}
                    </p>
                  </section>
                )}
              </div>
            </div>

            <SheetFooter className='bg-background mt-auto flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4'>
              {trip.rule_id && (
                <div className='text-muted-foreground mr-auto flex flex-col text-[11px] leading-snug'>
                  <span className='font-mono text-[10px]'>
                    Serie: {trip.rule_id.slice(0, 8)}
                    {'…'}
                  </span>
                </div>
              )}
              <div className='flex items-center gap-2'>
                {timeDirty && (
                  <Button
                    type='button'
                    size='sm'
                    disabled={isSavingTime}
                    onClick={() => {
                      void handleSaveTime();
                    }}
                  >
                    {isSavingTime ? 'Wird gespeichert…' : 'Aktualisieren'}
                  </Button>
                )}
                {showCreateReturnButton && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='text-primary hover:bg-primary/10 hover:text-primary'
                    onClick={() => setIsCreateReturnOpen(true)}
                  >
                    <ArrowLeftRight className='mr-1.5 h-3.5 w-3.5' />
                    Rückfahrt
                  </Button>
                )}
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

            {trip && (
              <CreateReturnTripDialog
                open={isCreateReturnOpen}
                onOpenChange={setIsCreateReturnOpen}
                anchorTrip={trip as Trip}
                groupTrips={effectiveGroupTrips}
                drivers={drivers}
                onSuccess={() => {
                  // Realtime on `trips` will refetch; paired leg also triggers UPDATE on this row.
                  void findPairedTrip(trip as Trip).then((p) =>
                    setLinkedPartner(p ?? null)
                  );
                }}
              />
            )}

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
                hasPair
                  ? (reason) => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      cancelTrip(
                        trip as Trip,
                        trip.rule_id
                          ? 'skip-occurrence-and-paired'
                          : 'cancel-nonrecurring-and-paired',
                        {
                          source:
                            'Manually cancelled (Hinfahrt/Rückfahrt) via Trip Detail Sheet',
                          reason
                        }
                      ).then(() => setIsCancelDialogOpen(false));
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
                  : hasPair
                    ? 'Nur diese Fahrt stornieren'
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

interface LinkedPartnerCalloutProps {
  anchorTrip: Trip;
  partner: Trip;
  statusClass: string;
  statusLabel: string;
  onNavigateToTrip?: (tripId: string) => void;
}

function LinkedPartnerCallout({
  anchorTrip,
  partner,
  statusClass,
  statusLabel,
  onNavigateToTrip
}: LinkedPartnerCalloutProps) {
  const dir = getTripDirection(partner);
  const typeShort =
    dir === 'rueckfahrt'
      ? 'Rückfahrt'
      : dir === 'hinfahrt'
        ? 'Hinfahrt'
        : 'Gegenfahrt';
  const legAction =
    dir === 'rueckfahrt'
      ? 'Rückfahrt öffnen'
      : dir === 'hinfahrt'
        ? 'Hinfahrt öffnen'
        : 'Gegenfahrt öffnen';

  const partnerDate = partner.scheduled_at
    ? new Date(partner.scheduled_at)
    : null;
  const anchorDate = anchorTrip.scheduled_at
    ? new Date(anchorTrip.scheduled_at)
    : null;
  const showDate =
    !!partnerDate && (!anchorDate || !isSameDay(partnerDate, anchorDate));

  const timeStr = partnerDate != null ? format(partnerDate, 'HH:mm') : '—';

  return (
    <section aria-label='Verknüpfte Gegenfahrt'>
      <p className='text-muted-foreground mb-1.5 text-[10px] font-bold tracking-widest uppercase'>
        Verknüpfte Fahrt
      </p>
      <TooltipProvider delayDuration={200}>
        <div className='bg-muted/40 border-border flex min-h-9 items-center gap-2 rounded-lg border px-2 py-1.5 pr-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className={cn(
                  'text-foreground flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs',
                  'hover:bg-muted/80 -mx-1 rounded-md px-1 py-0.5 transition-colors',
                  'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                )}
              >
                <span className='text-muted-foreground shrink-0 font-semibold'>
                  {typeShort}
                </span>
                {showDate && partnerDate != null && (
                  <>
                    <span className='text-muted-foreground/80' aria-hidden>
                      ·
                    </span>
                    <span className='text-muted-foreground shrink-0 tabular-nums'>
                      {format(partnerDate, 'dd.MM.yyyy', { locale: de })}
                    </span>
                  </>
                )}
                <span className='text-muted-foreground/80' aria-hidden>
                  ·
                </span>
                <span className='text-muted-foreground shrink-0 text-[11px] font-medium'>
                  Uhrzeit
                </span>
                <span className='shrink-0 font-medium tabular-nums'>
                  {timeStr}
                </span>
                <span className='text-muted-foreground/80' aria-hidden>
                  ·
                </span>
                <Badge
                  className={cn(
                    'h-5 max-w-[7rem] shrink-0 truncate px-1.5 py-0 text-[9px]',
                    statusClass
                  )}
                >
                  {statusLabel}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side='bottom'
              align='start'
              className={cn(
                'border-border bg-muted/95 text-foreground max-w-sm space-y-2 border text-left shadow-md backdrop-blur-sm'
              )}
              arrowClassName='bg-muted/95 fill-muted/95'
            >
              <p className='bg-background/80 border-border/60 text-foreground rounded-md border px-2 py-1.5 text-xs font-semibold'>
                {dir === 'rueckfahrt'
                  ? 'Rückfahrt'
                  : dir === 'hinfahrt'
                    ? 'Hinfahrt'
                    : 'Gegenfahrt'}
                {partnerDate != null && (
                  <span className='text-muted-foreground font-normal'>
                    {' '}
                    · {format(partnerDate, 'PPP', { locale: de })}{' '}
                    <span className='text-foreground font-medium'>
                      Uhrzeit {format(partnerDate, 'HH:mm')}
                    </span>
                  </span>
                )}
              </p>
              <div className='space-y-1.5 text-xs leading-snug'>
                <p className='text-foreground rounded-r-md border-l-2 border-sky-500/45 bg-sky-500/8 py-1 pr-1 pl-2'>
                  <span className='font-medium text-sky-700 dark:text-sky-300'>
                    Von:{' '}
                  </span>
                  <span className='text-muted-foreground'>
                    {partner.pickup_address || '—'}
                    {partner.pickup_station
                      ? ` (${partner.pickup_station})`
                      : ''}
                  </span>
                </p>
                <p className='text-foreground rounded-r-md border-l-2 border-emerald-500/45 bg-emerald-500/8 py-1 pr-1 pl-2'>
                  <span className='font-medium text-emerald-700 dark:text-emerald-300'>
                    Nach:{' '}
                  </span>
                  <span className='text-muted-foreground'>
                    {partner.dropoff_address || '—'}
                    {partner.dropoff_station
                      ? ` (${partner.dropoff_station})`
                      : ''}
                  </span>
                </p>
                {partner.client_name && (
                  <p className='text-foreground'>
                    <span className='font-medium text-violet-700 dark:text-violet-300'>
                      Fahrgast:{' '}
                    </span>
                    <span className='text-muted-foreground'>
                      {partner.client_name}
                    </span>
                  </p>
                )}
                {partner.driving_distance_km != null &&
                  partner.driving_distance_km > 0 && (
                    <p className='text-foreground'>
                      <span className='font-medium text-amber-700 dark:text-amber-300'>
                        Distanz:{' '}
                      </span>
                      <span className='text-muted-foreground'>
                        {partner.driving_distance_km} km
                      </span>
                    </p>
                  )}
                {partner.notes?.trim() && (
                  <p className='border-border text-foreground border-t pt-1.5'>
                    <span className='font-medium text-orange-800 dark:text-orange-200'>
                      Hinweise:{' '}
                    </span>
                    <span className='text-muted-foreground'>
                      {partner.notes}
                    </span>
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='text-foreground h-8 w-8 shrink-0'
            disabled={!onNavigateToTrip}
            title={
              onNavigateToTrip
                ? legAction
                : 'Navigation in diesem Kontext nicht verfügbar'
            }
            aria-label={legAction}
            onClick={() => {
              if (onNavigateToTrip && partner.id) {
                onNavigateToTrip(partner.id);
              }
            }}
          >
            <ArrowLeftRight className='h-4 w-4' />
          </Button>
        </div>
      </TooltipProvider>
    </section>
  );
}

/** Keeps calendar day from `scheduledIso`, replaces clock time with `HH:mm`. */
function applyTimeToScheduledDate(
  scheduledIso: string,
  timeHHmm: string
): Date {
  const d = new Date(scheduledIso);
  const [hStr, mStr] = timeHHmm.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function TimelineItem({
  stopLabel,
  title,
  address,
  name,
  passengerStation,
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
        <Badge
          variant='outline'
          className='border-border bg-muted/60 text-muted-foreground flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums'
        >
          {stopLabel}
        </Badge>
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-[10px] font-bold tracking-tighter uppercase'>
            {title}
          </span>
          {time && (
            <span className='rounded border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600 italic dark:border-green-800 dark:bg-green-950/40 dark:text-green-400'>
              Erledigt: {format(new Date(time), 'HH:mm')}
            </span>
          )}
        </div>
        <div
          className={`flex flex-col text-sm leading-snug font-semibold ${isCancelled ? 'line-through opacity-50' : ''}`}
        >
          {address}
          {station && !name && (
            <span className='text-muted-foreground text-xs font-normal'>
              ({station})
            </span>
          )}
        </div>
        {name && (
          <div className='text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs font-medium'>
            <span>Fahrgast: {name}</span>
            {passengerStation?.trim() ? (
              <Badge
                variant='outline'
                className='border-border bg-muted/60 text-muted-foreground h-5 px-1.5 py-0 text-[10px] font-medium'
              >
                {passengerStation.trim()}
              </Badge>
            ) : null}
          </div>
        )}

        {isCancelled && (
          <div className='mt-1 flex w-fit items-center gap-1 rounded border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400'>
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
