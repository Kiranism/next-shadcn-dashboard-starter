'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

interface StatsErrorProps {
  error: Error;
  reset: () => void; // Add reset function from error boundary
}
export default function StatsError({ error, reset }: StatsErrorProps) {
  const t = useTranslations('Errors');
  const commonT = useTranslations('Common');
  const dashboardT = useTranslations('Dashboard');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // the reload fn ensures the refresh is deffered  until the next render phase allowing react to handle any pending states before processing
  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };
  return (
    <Card className='border-red-500'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Alert variant='destructive' className='border-none'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>{commonT('error')}</AlertTitle>
            <AlertDescription className='mt-2'>
              {t('failedToLoad')}: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </CardHeader>
      <CardContent className='flex h-[316px] items-center justify-center p-6'>
        <div className='text-center'>
          <p className='mb-4 text-sm text-muted-foreground'>
            {t('unableToDisplay')}
          </p>
          <Button
            onClick={() => reload()}
            variant='outline'
            className='min-w-[120px]'
            disabled={isPending}
          >
            {dashboardT('tryAgain')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
