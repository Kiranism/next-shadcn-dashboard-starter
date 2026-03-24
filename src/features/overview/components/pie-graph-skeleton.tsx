import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PieGraphSkeleton() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-6 w-[100px]' />
          <Skeleton className='h-5 w-[60px] rounded-full' />
        </div>
        <Skeleton className='h-4 w-[150px]' />
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <Skeleton className='h-[250px] w-[250px] rounded-full' />
      </CardContent>
    </Card>
  );
}
