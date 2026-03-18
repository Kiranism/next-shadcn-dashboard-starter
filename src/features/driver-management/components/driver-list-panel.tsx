'use client';

/**
 * DriverListPanel — Column 1 of the Fahrer Miller Columns view.
 *
 * Fetches drivers, renders list with search. Exposes __refreshDriverList
 * for sibling panels (DriverDetailPanel) to trigger refetch after create.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { PanelList } from '@/components/panels';
import { driversService } from '@/features/driver-management/api/drivers.service';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DriverListPanelProps {
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
  onNewDriver: () => void;
}

export function DriverListPanel({
  selectedDriverId,
  onSelectDriver,
  onNewDriver
}: DriverListPanelProps) {
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const autoSelectDone = useRef(false);

  const debouncedSearch = useDebounce(searchTerm, 250);

  const fetchDrivers = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const { drivers: data } = await driversService.getDrivers({
        search: search || undefined,
        includeInactive: true,
        limit: 200
      });
      setDrivers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Laden';
      toast.error('Fehler beim Laden der Fahrer: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers(debouncedSearch);
  }, [debouncedSearch, fetchDrivers]);

  useEffect(() => {
    if (
      !autoSelectDone.current &&
      !selectedDriverId &&
      drivers.length > 0 &&
      !loading
    ) {
      autoSelectDone.current = true;
      onSelectDriver(drivers[0].id);
    }
  }, [drivers, loading, selectedDriverId, onSelectDriver]);

  useEffect(() => {
    (window as any).__refreshDriverList = () => fetchDrivers(debouncedSearch);
    return () => {
      delete (window as any).__refreshDriverList;
    };
  }, [fetchDrivers, debouncedSearch]);

  return (
    <PanelList<DriverWithProfile>
      items={drivers}
      loading={loading}
      selectedId={selectedDriverId}
      onSelect={(driver) => onSelectDriver(driver.id)}
      renderItem={(driver, isSelected) => (
        <DriverListItem driver={driver} isSelected={isSelected} />
      )}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder='Fahrer suchen...'
      emptyMessage='Keine Fahrer gefunden.'
      onNew={onNewDriver}
      newLabel='Neuer Fahrer'
    />
  );
}

function getDisplayName(d: DriverWithProfile): string {
  const u = d as { first_name?: string | null; last_name?: string | null };
  if (u?.first_name || u?.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  }
  return d.name;
}

function DriverListItem({
  driver,
  isSelected
}: {
  driver: DriverWithProfile;
  isSelected: boolean;
}) {
  const name = getDisplayName(driver);
  const initials =
    name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <div className='flex items-center gap-3 px-3 py-2.5'>
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
      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            'truncate text-sm leading-tight font-medium',
            isSelected && 'text-foreground'
          )}
        >
          {name}
        </p>
        <p className='text-muted-foreground mt-0.5 truncate text-xs'>
          {(driver as { email?: string | null }).email ?? driver.role}{' '}
          {!driver.is_active && '• Inaktiv'}
        </p>
      </div>
    </div>
  );
}
