import { DriverShiftPageContent } from '@/features/driver-portal/components/driver-shift-page-content';

export default function DriverShiftPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4'>
      <h1 className='text-foreground mb-2 text-xl font-semibold'>
        Meine Schicht
      </h1>
      <DriverShiftPageContent />
    </div>
  );
}
