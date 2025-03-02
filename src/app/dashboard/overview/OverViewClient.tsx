'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export default function OverViewClient() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Guest';

  return (
    <h2 className='text-2xl font-bold tracking-tight'>
      Hi, Welcome back {userName} 👋
    </h2>
  );
}
