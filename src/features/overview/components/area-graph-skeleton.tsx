import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AreaGraphSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-6 w-[140px]' />
          <Skeleton className='h-5 w-[60px] rounded-full' />
        </div>
        <Skeleton className='h-4 w-[250px]' />
      </CardHeader>
      <CardContent>
        <div className='relative aspect-auto h-[280px] w-full'>
          <div className='from-primary/5 to-primary/20 absolute inset-0 rounded-lg bg-linear-to-t' />
          <Skeleton className='absolute right-0 bottom-0 left-0 h-[1px]' />
          <Skeleton className='absolute top-0 bottom-0 left-0 w-[1px]' />
        </div>
      </CardContent>
    </Card>
  );
}
