'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { usePassengerSearchStore } from '@/features/clients/stores/use-passenger-search-store';
import { clientsService } from '@/features/clients/api/clients.service';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useCreateTripDialogStore } from '@/features/trips/stores/use-create-trip-dialog-store';
import { useRouter } from 'next/navigation';

type TripRow = Database['public']['Tables']['trips']['Row'];

interface ClientResult {
  id: string;
  name: string;
}

interface TripContext {
  past: TripRow[];
  upcoming: TripRow[];
}

export function PassengerSearchOverlay() {
  const { open, selectedClientId, closeSearch, openSearch } =
    usePassengerSearchStore();
  const [query, setQuery] = React.useState('');
  const [clients, setClients] = React.useState<ClientResult[]>([]);
  const [isLoadingClients, setIsLoadingClients] = React.useState(false);
  const [activeClient, setActiveClient] = React.useState<ClientResult | null>(
    null
  );
  const [tripContext, setTripContext] = React.useState<TripContext | null>(
    null
  );
  const [isLoadingTrips, setIsLoadingTrips] = React.useState(false);
  const router = useRouter();
  const { openDialog } = useCreateTripDialogStore();

  // Load clients when query changes
  React.useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setClients([]);
      return;
    }

    let cancelled = false;
    setIsLoadingClients(true);

    const timeout = setTimeout(async () => {
      try {
        const { clients: found } = await clientsService.getClients({
          search: query.trim(),
          page: 1,
          limit: 10
        });
        if (cancelled) return;
        setClients(
          found.map((c) => ({
            id: c.id,
            name: c.is_company
              ? c.company_name || 'Unbekannt'
              : [c.first_name, c.last_name].filter(Boolean).join(' ') ||
                'Unbekannt'
          }))
        );
      } finally {
        if (!cancelled) setIsLoadingClients(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [open, query]);

  // Load trip context when active client changes
  React.useEffect(() => {
    if (!open) return;
    if (!activeClient && !selectedClientId) {
      setTripContext(null);
      return;
    }

    const clientId = activeClient?.id ?? selectedClientId;
    if (!clientId) return;

    let cancelled = false;
    setIsLoadingTrips(true);

    const loadTrips = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('trips')
        .select(
          'id, scheduled_at, status, pickup_address, dropoff_address, canceled_reason_notes'
        )
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: true });

      if (cancelled || !data) return;

      const now = new Date();
      const upcoming: TripRow[] = [];
      const past: TripRow[] = [];

      for (const trip of data) {
        if (!trip.scheduled_at) continue;
        const date = new Date(trip.scheduled_at);
        if (date >= now) {
          upcoming.push(trip as TripRow);
        } else {
          past.push(trip as TripRow);
        }
      }

      // Sort and slice
      upcoming.sort(
        (a, b) =>
          new Date(a.scheduled_at || '').getTime() -
          new Date(b.scheduled_at || '').getTime()
      );
      past.sort(
        (a, b) =>
          new Date(b.scheduled_at || '').getTime() -
          new Date(a.scheduled_at || '').getTime()
      );

      setTripContext({
        upcoming: upcoming.slice(0, 3),
        past: past.slice(0, 3)
      });
      setIsLoadingTrips(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadTrips();

    return () => {
      cancelled = true;
    };
  }, [open, activeClient, selectedClientId]);

  const handleClientSelect = (client: ClientResult) => {
    setActiveClient(client);
  };

  const handleOpenNewTrip = () => {
    if (!activeClient) return;
    openDialog({ clientId: activeClient.id });
    closeSearch();
  };

  const handleOpenProfile = () => {
    if (!activeClient) return;
    closeSearch();
    router.push(`/dashboard/clients/${activeClient.id}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          closeSearch();
          setQuery('');
          setClients([]);
          setActiveClient(null);
          setTripContext(null);
        } else {
          openSearch();
        }
      }}
      title='Fahrgast-Suche'
      description='Fahrgäste suchen und Fahrten einsehen'
    >
      <div className='flex h-[420px] flex-col md:flex-row'>
        <div className='border-b md:w-2/5 md:border-r md:border-b-0'>
          <CommandInput
            placeholder='Fahrgast oder Firma suchen…'
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoadingClients && <CommandEmpty>Suche Fahrgäste…</CommandEmpty>}
            {!isLoadingClients && clients.length === 0 && query.length >= 2 && (
              <CommandEmpty>Kein Fahrgast gefunden.</CommandEmpty>
            )}
            <CommandGroup heading='Fahrgäste'>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => handleClientSelect(client)}
                >
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </div>

        <div className='flex flex-1 flex-col gap-3 p-4'>
          {activeClient ? (
            <>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-sm font-semibold'>{activeClient.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    Letzte & kommende Fahrten
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleOpenProfile}
                  >
                    Profil öffnen
                  </Button>
                  <Button size='sm' onClick={handleOpenNewTrip}>
                    Neue Fahrt
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-muted-foreground text-xs font-semibold uppercase'>
                    Nächste Fahrten
                  </p>
                  <div className='mt-2 flex flex-col gap-2'>
                    {isLoadingTrips && (
                      <p className='text-muted-foreground text-xs'>
                        Lade Fahrten…
                      </p>
                    )}
                    {!isLoadingTrips &&
                      tripContext &&
                      tripContext.upcoming.length === 0 && (
                        <p className='text-muted-foreground text-xs'>
                          Keine geplanten Fahrten.
                        </p>
                      )}
                    {!isLoadingTrips &&
                      tripContext &&
                      tripContext.upcoming.map((trip) => (
                        <TripSummary key={trip.id} trip={trip} />
                      ))}
                  </div>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs font-semibold uppercase'>
                    Letzte Fahrten
                  </p>
                  <div className='mt-2 flex flex-col gap-2'>
                    {isLoadingTrips && (
                      <p className='text-muted-foreground text-xs'>
                        Lade Fahrten…
                      </p>
                    )}
                    {!isLoadingTrips &&
                      tripContext &&
                      tripContext.past.length === 0 && (
                        <p className='text-muted-foreground text-xs'>
                          Keine vergangenen Fahrten.
                        </p>
                      )}
                    {!isLoadingTrips &&
                      tripContext &&
                      tripContext.past.map((trip) => (
                        <TripSummary
                          key={trip.id}
                          trip={trip}
                          showCancelReason
                        />
                      ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
              <p className='text-sm font-medium'>
                Fahrgast auswählen, um Fahrten zu sehen
              </p>
              <p className='text-muted-foreground max-w-xs text-xs'>
                Suche links nach dem Namen oder der Firma des Fahrgasts. Du
                siehst hier die letzten 3 und die nächsten 3 Fahrten.
              </p>
            </div>
          )}
        </div>
      </div>
    </CommandDialog>
  );
}

function TripSummary({
  trip,
  showCancelReason
}: {
  trip: TripRow;
  showCancelReason?: boolean;
}) {
  const time = trip.scheduled_at
    ? format(new Date(trip.scheduled_at), 'dd.MM. HH:mm')
    : '--:--';
  const from = trip.pickup_address || 'Unbekannt';
  const to = trip.dropoff_address || 'Unbekannt';
  const status = trip.status;

  return (
    <div className='border-border/60 bg-muted/40 flex flex-col gap-1 rounded-md border px-3 py-2'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-xs font-medium'>{time}</span>
        <span className='text-muted-foreground text-[11px] uppercase'>
          {status}
        </span>
      </div>
      <p className='text-xs'>
        {from} <span className='text-muted-foreground'>→</span> {to}
      </p>
      {showCancelReason && trip.canceled_reason_notes && (
        <p className='text-destructive text-[11px]'>
          Grund: {trip.canceled_reason_notes}
        </p>
      )}
    </div>
  );
}
