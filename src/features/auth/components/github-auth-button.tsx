'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function GithubSignInButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={() => {
        // Navigate to the social sign-in route, preserving any callbackUrl.
        const base = '/auth/social/github';
        const href = callbackUrl
          ? `${base}?callbackUrl=${encodeURIComponent(callbackUrl)}`
          : base;
        window.location.href = href;
      }}
    >
      <Icons.github className='mr-2 h-4 w-4' />
      Continue with Github
    </Button>
  );
}
