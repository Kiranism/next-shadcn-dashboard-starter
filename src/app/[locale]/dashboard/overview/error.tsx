'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function OverviewError({ error }: { error: Error }) {
  const t = useTranslations('Errors');

  return (
    <Alert variant='destructive'>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {t('failedToLoad')}: {error.message}
      </AlertDescription>
    </Alert>
  );
}
