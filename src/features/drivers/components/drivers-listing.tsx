'use client';

/**
 * Drivers listing page container — fetches drivers, renders table + create button + form sheet.
 */

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { DriverTable } from '@/features/drivers/components/drivers-table';
import { driversService } from '@/features/drivers/api/drivers.service';
import { useDriverFormStore } from '@/features/drivers/stores/use-driver-form-store';
import { IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { DriverForm } from './driver-form';
import type { DriverWithProfile } from '@/features/drivers/types';

export function DriversListing() {
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [loading, setLoading] = useState(true);
  const openForCreate = useDriverFormStore((s) => s.openForCreate);
  const refreshTrigger = useDriverFormStore((s) => s.refreshTrigger);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { drivers: d, totalDrivers: t } = await driversService.getDrivers(
          { includeInactive: true }
        );
        setDrivers(d);
        setTotalDrivers(t);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTrigger]);

  return (
    <PageContainer
      pageTitle='Fahrer'
      pageDescription='Fahrer verwalten und neue Benutzer anlegen.'
      pageHeaderAction={
        <button
          onClick={openForCreate}
          className={buttonVariants({ className: 'text-xs md:text-sm' })}
        >
          <IconPlus className='mr-2 h-4 w-4' /> Neuer Fahrer
        </button>
      }
    >
      {loading ? (
        <DataTableSkeleton columnCount={5} rowCount={8} filterCount={0} />
      ) : (
        <DriverTable data={drivers} totalItems={totalDrivers} />
      )}
      <DriverForm />
    </PageContainer>
  );
}
