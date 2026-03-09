import SignUpView from '@/features/auth/components/sign-up-view';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Authentication | Sign Up',
  description: 'Sign up page.'
};

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard/overview');
  }

  return <SignUpView />;
}
