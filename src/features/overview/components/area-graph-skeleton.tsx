import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AreaGraphSkeleton() {
  return (
    <Card>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Skeleton className='h-6 w-[180px]' />
          <Skeleton className='h-4 w-[250px]' />
        </div>
      </CardHeader>
      <CardContent className='px-2 sm:p-6'>
        {/* Area-like shape */}
        <div className='relative aspect-auto h-[280px] w-full'>
          <div className='from-primary/5 to-primary/20 absolute inset-0 rounded-lg bg-linear-to-t' />
          <Skeleton className='absolute right-0 bottom-0 left-0 h-[1px]' />{' '}
          {/* x-axis */}
          <Skeleton className='absolute top-0 bottom-0 left-0 w-[1px]' />{' '}
          {/* y-axis */}
        </div>
      </CardContent>
    </Card>
  );
}
