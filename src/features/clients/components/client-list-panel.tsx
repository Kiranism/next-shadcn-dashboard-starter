'use client';

/**
 * ClientListPanel
 *
 * Column 1 of the Fahrgäste Miller Columns view. Responsible for:
 *   1. Fetching the client list (with debounced search)
 *   2. Rendering each client as a compact list item with initials avatar
 *
 * This component owns its own data-fetching state so that Column 1 can
 * refresh independently (e.g. after a new client is saved in Column 2)
 * without re-mounting the entire column view.
 *
 * Rendering is delegated entirely to PanelList<Client> — this component only
 * knows about Clients; the generic panel shell knows nothing about them.
 *
 * Props:
 *   selectedClientId — the currently open client id (or 'new'), used to
 *                      highlight the active row in the list
 *   onSelectClient   — called when a row is clicked; parent sets ?clientId
 *   onNewClient      — called when "+ Neuer Fahrgast" is clicked
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { PanelList } from '@/components/panels';
import { clientsService, Client } from '../api/clients.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientListPanelProps {
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onNewClient: () => void;
}

export function ClientListPanel({
  selectedClientId,
  onSelectClient,
  onNewClient
}: ClientListPanelProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Guards the one-time auto-select so it never fires again after the first load
  const autoSelectDone = useRef(false);

  // Debounce search to avoid a Supabase query on every keystroke
  const debouncedSearch = useDebounce(searchTerm, 250);

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const { clients: data } = await clientsService.getClients({
        search: search || undefined,
        limit: 200
      });
      // Client-side sort so companies (null last_name) are interleaved
      // alphabetically by company_name rather than appended at the end.
      const sorted = sortClientsAlphabetically(data);
      setClients(sorted);
    } catch (err: any) {
      toast.error('Fehler beim Laden der Fahrgäste: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch, fetchClients]);

  // Auto-select the first client when the view opens with no client in the URL.
  // The ref ensures this fires at most once per mount — it does not re-trigger
  // when the search input changes or when a different client is selected later.
  useEffect(() => {
    if (
      !autoSelectDone.current &&
      !selectedClientId &&
      clients.length > 0 &&
      !loading
    ) {
      autoSelectDone.current = true;
      onSelectClient(clients[0].id);
    }
  }, [clients, loading, selectedClientId, onSelectClient]);

  // Expose a refresh function so ClientDetailPanel can trigger a re-fetch
  // after saving a new client (the list needs to show the newly created entry).
  // We attach it to the window object keyed by a known symbol so sibling panels
  // can call it without prop-drilling through the orchestrator.
  // A Zustand store would be cleaner at scale — this is the lightweight approach.
  useEffect(() => {
    (window as any).__refreshClientList = () => fetchClients(debouncedSearch);
    return () => {
      delete (window as any).__refreshClientList;
    };
  }, [fetchClients, debouncedSearch]);

  return (
    <PanelList<Client>
      items={clients}
      loading={loading}
      selectedId={selectedClientId}
      onSelect={(client) => onSelectClient(client.id)}
      renderItem={(client, isSelected) => (
        <ClientListItem client={client} isSelected={isSelected} />
      )}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder='Fahrgast suchen...'
      emptyMessage='Keine Fahrgäste gefunden.'
      onNew={onNewClient}
      newLabel='Neuer Fahrgast'
    />
  );
}

// ─── Client List Item ───────────────────────────────────────────────────────

/**
 * ClientListItem
 *
 * A single row in the client list. Shows an initials avatar, display name,
 * and city. Kept as a local component — it's tightly coupled to the list
 * panel and not reused elsewhere.
 */

interface ClientListItemProps {
  client: Client;
  isSelected: boolean;
}

function ClientListItem({ client, isSelected }: ClientListItemProps) {
  const initials = getClientInitials(client);
  const displayName = getClientDisplayName(client);
  const subtitle = [client.zip_code, client.city].filter(Boolean).join(' ');

  return (
    <div className='flex items-center gap-3 px-3 py-2.5'>
      {/* Initials avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {initials}
      </div>

      {/* Name + location */}
      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            'truncate text-sm leading-tight font-medium',
            isSelected && 'text-foreground'
          )}
        >
          {displayName}
        </p>
        {subtitle && (
          <p className='text-muted-foreground mt-0.5 truncate text-xs'>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sorts clients alphabetically by their "primary name":
 *   - Persons  → last_name (then first_name as tiebreaker)
 *   - Companies → company_name
 * Using German locale so ä/ö/ü sort correctly (Ä after A, etc.)
 */
function sortClientsAlphabetically(data: Client[]): Client[] {
  return [...data].sort((a, b) => {
    const aKey = (
      a.last_name ??
      a.company_name ??
      a.first_name ??
      ''
    ).toLowerCase();
    const bKey = (
      b.last_name ??
      b.company_name ??
      b.first_name ??
      ''
    ).toLowerCase();
    const primary = aKey.localeCompare(bKey, 'de');
    if (primary !== 0) return primary;
    // Tiebreaker for persons sharing the same last name
    const aFirst = (a.first_name ?? '').toLowerCase();
    const bFirst = (b.first_name ?? '').toLowerCase();
    return aFirst.localeCompare(bFirst, 'de');
  });
}

function getClientDisplayName(client: Client): string {
  if (client.company_name) return client.company_name;
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unbekannt';
}

function getClientInitials(client: Client): string {
  if (client.company_name) {
    return client.company_name.charAt(0).toUpperCase();
  }
  const first = client.first_name?.charAt(0) ?? '';
  const last = client.last_name?.charAt(0) ?? '';
  return (first + last).toUpperCase() || '?';
}
