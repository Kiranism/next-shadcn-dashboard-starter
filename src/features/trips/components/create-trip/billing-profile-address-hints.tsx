'use client';

import { AlertCircle } from 'lucide-react';

const hintClass =
  'flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300';

/** Matches anonymous-trip hint styling; shown when Kostenträger Verhalten defines default pickup. */
export function BillingProfilePickupAddressHint() {
  return (
    <div className={hintClass}>
      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
      Abholadresse laut Kostenträger-Regel vorgefüllt.
    </div>
  );
}

/** Same pattern for default Ziel from Abrechnungsart. */
export function BillingProfileDropoffAddressHint() {
  return (
    <div className={hintClass}>
      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
      Zieladresse laut Kostenträger-Regel vorgefüllt.
    </div>
  );
}
