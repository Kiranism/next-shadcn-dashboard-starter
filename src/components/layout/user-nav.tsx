'use client';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(currentUser);
      }
    };

    void loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };

  if (!user) {
    return (
      <Button asChild size='sm' variant='outline'>
        <Link href='/auth/sign-in'>Sign in</Link>
      </Button>
    );
  }

  return (
    <Button size='sm' variant='outline' onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
