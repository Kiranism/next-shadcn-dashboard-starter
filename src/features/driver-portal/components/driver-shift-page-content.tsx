'use client';

/**
 * Driver shift page content — form + history list.
 * Coordinates refresh of history when a new shift is saved.
 */

import { ShiftHistoryList } from '@/features/driver-portal/components/shift-history-list';
import { ShiftTimeForm } from '@/features/driver-portal/components/shift-time-form';
import { useState } from 'react';

export function DriverShiftPageContent() {
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  return (
    <div className='flex flex-col gap-8'>
      <ShiftTimeForm
        onShiftSaved={() => setHistoryRefreshTrigger((t) => t + 1)}
      />
      <ShiftHistoryList refreshTrigger={historyRefreshTrigger} />
    </div>
  );
}
