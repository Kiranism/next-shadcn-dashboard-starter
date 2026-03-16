'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKBar, useRegisterActions, type Action } from 'kbar';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCreateTripDialogStore } from '@/features/trips/stores/use-create-trip-dialog-store';

interface ClientSearchResult {
  id: string;
  displayName: string;
  nextTripSubtitle: string;
  hasNextTrip: boolean;
}

export function useDispatchKbarActions() {
  // Select just the current search text from kbar's internal state
  const searchQuery = useKBar((state) => state.searchQuery as string);

  const [clientResults, setClientResults] = useState<ClientSearchResult[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const router = useRouter();

  // Debounced query handling for @Fahrgäste
  useEffect(() => {
    const raw = String(searchQuery ?? '').trim();
    if (!raw.startsWith('@')) {
      if (clientResults.length > 0) {
        setClientResults([]);
      }
      return;
    }

    const searchTerm = raw.slice(1).trim();
    if (searchTerm.length < 2) {
      setClientResults([]);
      return;
    }

    let cancelled = false;
    setIsSearchingClients(true);

    const timeout = setTimeout(async () => {
      try {
        const supabase = createClient();

        const { data: clients } = await supabase
          .from('clients')
          .select('id, first_name, last_name, company_name, is_company')
          .or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`
          )
          .limit(8);

        if (!clients || cancelled) {
          if (!cancelled) setClientResults([]);
          return;
        }

        const nowIso = new Date().toISOString();
        const clientIds = clients.map((c) => c.id);

        const { data: trips } = await supabase
          .from('trips')
          .select(
            'id, client_id, scheduled_at, status, pickup_address, dropoff_address'
          )
          .in('client_id', clientIds)
          .order('scheduled_at', { ascending: true });

        const results: ClientSearchResult[] = clients.map((client) => {
          const name = client.is_company
            ? client.company_name || 'Unbekannt'
            : [client.first_name, client.last_name].filter(Boolean).join(' ') ||
              'Unbekannt';

          const clientTrips = (trips || []).filter(
            (t) => t.client_id === client.id
          );

          const nextTrip = clientTrips.find((t) => {
            if (!t.scheduled_at) return false;
            if (t.status === 'cancelled') return false;
            return t.scheduled_at >= nowIso;
          });

          let subtitle = 'Keine geplanten Fahrten';
          let hasNextTrip = false;
          if (nextTrip && nextTrip.scheduled_at) {
            const time = format(
              new Date(nextTrip.scheduled_at),
              'dd.MM. HH:mm'
            );
            const from = nextTrip.pickup_address || '';
            const to = nextTrip.dropoff_address || '';
            subtitle = `Nächste Fahrt: ${time} · ${from}${from && to ? ' → ' : ''}${to}`;
            hasNextTrip = true;
          }

          return {
            id: client.id,
            displayName: name,
            nextTripSubtitle: subtitle,
            hasNextTrip
          };
        });

        if (!cancelled) {
          setClientResults(results);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingClients(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery, clientResults.length]);

  const clientActions: Action[] = useMemo(() => {
    const raw = String(searchQuery ?? '').trim();
    if (!raw.startsWith('@')) return [];

    if (isSearchingClients && clientResults.length === 0) {
      return [
        {
          id: 'clients-loading',
          name: 'Suche Fahrgäste…',
          section: 'Fahrgäste',
          subtitle: '',
          perform: () => {}
        }
      ];
    }

    if (!isSearchingClients && clientResults.length === 0) {
      return [
        {
          id: 'clients-empty',
          name: 'Kein Fahrgast gefunden',
          section: 'Fahrgäste',
          subtitle: 'Tipp: Mind. 2 Zeichen eingeben',
          perform: () => {}
        }
      ];
    }

    const actions: Action[] = [];

    clientResults.forEach((client) => {
      const baseId = `client-${client.id}`;

      actions.push(
        {
          id: baseId,
          name: client.displayName,
          section: 'Fahrgäste',
          subtitle: client.nextTripSubtitle,
          keywords: `fahrgast fahrgäste kunde client ${client.displayName.toLowerCase()}`,
          perform: () => {
            router.push(`/dashboard/clients/${client.id}`);
          }
        },
        {
          id: `${baseId}-new-trip`,
          name: `Neue Fahrt für ${client.displayName}`,
          section: 'Fahrgäste',
          subtitle: 'Neue Fahrt mit vorausgewähltem Fahrgast erstellen',
          parent: baseId,
          perform: () => {
            useCreateTripDialogStore.getState().openDialog({
              clientId: client.id
            });
          }
        }
      );
    });

    return actions;
  }, [clientResults, isSearchingClients, searchQuery, router]);

  useRegisterActions(clientActions, [clientActions]);
}
