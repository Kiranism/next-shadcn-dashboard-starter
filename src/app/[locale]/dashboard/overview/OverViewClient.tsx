'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function OverViewClient() {
  const t = useTranslations('Dashboard');
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Guest';

  return (
    <h2 className='text-2xl font-bold tracking-tight'>
      {t('welcome', { name: userName })}
    </h2>
  );
}
