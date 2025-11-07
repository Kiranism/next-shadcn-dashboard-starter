'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function GithubSignInButton() {
  return (
    <Button className='w-full' variant='outline' type='button'>
      <Icons.github className='mr-2 h-4 w-4' />
      Continue with Github
    </Button>
  );
}
