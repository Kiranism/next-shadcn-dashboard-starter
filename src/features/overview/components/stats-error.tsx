'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';

interface StatsErrorAlertProps {
  message: string;
  action: React.ReactNode;
}

// Presentational shell for overview stat error boundaries. Each error.tsx owns
// its retry wiring (useTransition + router.refresh + reset) and passes the
// button in via `action` so the recovery path stays visible in the route file.
export function StatsErrorAlert({ message, action }: StatsErrorAlertProps) {
  return (
    <Alert variant='destructive'>
      <Icons.alertCircle className='h-4 w-4' />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className='flex flex-col items-start gap-3'>
        <span>{message}</span>
        {action}
      </AlertDescription>
    </Alert>
  );
}
