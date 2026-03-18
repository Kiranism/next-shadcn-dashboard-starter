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

import { useEffect, useState, useCallback } from 'react';
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

  // Debounce search to avoid a Supabase query on every keystroke
  const debouncedSearch = useDebounce(searchTerm, 250);

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const { clients: data } = await clientsService.getClients({
        search: search || undefined,
        limit: 200
      });
      setClients(data);
    } catch (err: any) {
      toast.error('Fehler beim Laden der Fahrgäste: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch, fetchClients]);

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
