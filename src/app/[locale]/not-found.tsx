'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { defaultLocale } from '@/config/locales';
import { useSession } from 'next-auth/react';

export default function NotFound() {
  const t = useTranslations('NotFound');
  // Use useSession to check if user is authenticated
  const { data: session, status } = useSession();

  // Determine the redirect path based on authentication status
  const redirectPath = session ? '/dashboard' : `/${defaultLocale}`;

  return (
    <div className='absolute left-1/2 top-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <div className='space-y-4'>
        <h1 className='text-4xl font-bold'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('description')}</p>
        <Button asChild>
          <Link href={redirectPath}>
            {session
              ? t('goToDashboard', { fallback: 'Go to Dashboard' })
              : t('returnToLogin', { fallback: 'Return to Login' })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
