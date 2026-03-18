'use client';

/**
 * "Neuer Fahrer" button for table view header.
 * Opens the driver form sheet in create mode.
 */

import { buttonVariants } from '@/components/ui/button';
import { useDriverFormStore } from '@/features/driver-management/stores/use-driver-form-store';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export function DriverCreateButton() {
  const openForCreate = useDriverFormStore((s) => s.openForCreate);

  return (
    <button
      type='button'
      onClick={openForCreate}
      className={cn(buttonVariants(), 'text-xs md:text-sm')}
    >
      <IconPlus className='mr-2 h-4 w-4' /> Neuer Fahrer
    </button>
  );
}
