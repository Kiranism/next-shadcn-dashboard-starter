'use client';

/**
 * DriverDetailPanel — Column 2 of the Fahrer Miller Columns view.
 *
 * Create (driverId='new') or edit driver. Uses DriverFormBody for shared form fields.
 */

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader, PanelBody } from '@/components/panels';
import { driversService } from '@/features/driver-management/api/drivers.service';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { toast } from 'sonner';
import { DriverFormBody } from './driver-form-body';

interface DriverDetailPanelProps {
  driverId: string;
  onClose: () => void;
}

export function DriverDetailPanel({
  driverId,
  onClose
}: DriverDetailPanelProps) {
  const isNew = driverId === 'new';
  const formRef = useRef<{ submit: () => void }>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [driver, setDriver] = useState<DriverWithProfile | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setDriver(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    driversService
      .getDriverById(driverId)
      .then(setDriver)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Fehler beim Laden';
        toast.error('Fehler beim Laden des Fahrers: ' + msg);
      })
      .finally(() => setLoading(false));
  }, [driverId, isNew]);

  const getDisplayName = (d: DriverWithProfile) => {
    const u = d as { first_name?: string | null; last_name?: string | null };
    if (u?.first_name || u?.last_name) {
      return [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    }
    return d.name;
  };
  const displayName = isNew
    ? 'Neuer Fahrer'
    : driver
      ? getDisplayName(driver)
      : '...';

  const handleSuccess = (saved?: DriverWithProfile) => {
    if (saved) {
      setDriver(saved);
      if (isNew && typeof (window as any).__refreshDriverList === 'function') {
        (window as any).__refreshDriverList();
      }
      if (isNew) {
        const url = new URL(window.location.href);
        url.searchParams.set('driverId', saved.id);
        window.history.replaceState(null, '', url.toString());
      }
    }
  };

  return (
    <Panel className='flex-1'>
      <PanelHeader
        title={displayName}
        description={isNew ? 'Neuen Fahrer anlegen' : 'Fahrer bearbeiten'}
        onClose={onClose}
        actions={
          !loading && (
            <Button
              size='sm'
              variant={isFormDirty ? 'default' : 'ghost'}
              className='h-6 px-2 text-xs'
              disabled={!isFormDirty}
              onClick={() => formRef.current?.submit()}
            >
              {isNew ? 'Anlegen' : 'Aktualisieren'}
            </Button>
          )
        }
      />

      <PanelBody padded>
        {loading ? (
          <div className='flex h-24 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
          </div>
        ) : (
          <DriverFormBody
            ref={formRef}
            initialData={driver}
            mode={isNew ? 'create' : 'edit'}
            onSuccess={handleSuccess}
            onDirtyChange={setIsFormDirty}
          />
        )}
      </PanelBody>
    </Panel>
  );
}
