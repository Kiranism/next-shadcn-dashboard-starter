import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export default function Loading() {
  return (
    <div className='flex flex-1 flex-col px-4 pt-2 pb-4 md:px-6 md:pt-4'>
      <DataTableSkeleton columnCount={6} rowCount={10} filterCount={2} />
    </div>
  );
}
