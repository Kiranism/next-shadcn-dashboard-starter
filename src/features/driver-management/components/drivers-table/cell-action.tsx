'use client';

/**
 * Row action dropdown for driver table: Edit, Deactivate.
 * Edit opens the DriverForm sheet via useDriverFormStore.
 */

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { driversService } from '@/features/driver-management/api/drivers.service';
import { useDriverFormStore } from '@/features/driver-management/stores/use-driver-form-store';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { IconDotsVertical, IconEdit, IconUserOff } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
  data: DriverWithProfile;
}

export function CellAction({ data }: CellActionProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openForEdit = useDriverFormStore((s) => s.openForEdit);

  const onConfirmDeactivate = async () => {
    try {
      setLoading(true);
      await driversService.deactivateDriver(data.id);
      toast.success('Fahrer wurde deaktiviert.');
      router.refresh();
    } catch {
      toast.error('Fehler beim Deaktivieren des Fahrers.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDeactivate}
        loading={loading}
        title='Fahrer deaktivieren?'
        description={`${data.name} wird deaktiviert und kann nicht mehr für Fahrten zugewiesen werden.`}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Menü öffnen</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => openForEdit(data)}>
            <IconEdit className='mr-2 h-4 w-4' /> Bearbeiten
          </DropdownMenuItem>
          {data.is_active && (
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className='text-destructive focus:text-destructive'
            >
              <IconUserOff className='mr-2 h-4 w-4' /> Deaktivieren
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
