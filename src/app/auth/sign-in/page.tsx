import { SignInForm } from '@/features/auth/components/sign-in-form';
import { Suspense } from 'react';

export const metadata = { title: 'Sign In' };

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
