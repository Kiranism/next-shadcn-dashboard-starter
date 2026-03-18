import { ShiftTracker } from '@/features/driver-portal/components/shift-tracker';

export default function DriverShiftPage() {
  return (
    <div className='flex flex-1 flex-col p-4'>
      <h1 className='text-foreground mb-6 text-xl font-semibold'>
        Meine Schicht
      </h1>
      <ShiftTracker />
    </div>
  );
}
