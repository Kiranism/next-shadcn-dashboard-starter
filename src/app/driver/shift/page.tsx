import { DriverShiftPageContent } from '@/features/driver-portal/components/driver-shift-page-content';

/**
 * Schichtenzettel — manual time-entry form + shift history.
 * The compact real-time shift control lives on Startseite.
 */
export default function DriverShiftPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4'>
      <h1 className='text-foreground mb-2 text-xl font-semibold'>
        Schichtenzettel
      </h1>
      <DriverShiftPageContent />
    </div>
  );
}
