'use client';

import { User } from '@supabase/supabase-js';

type LoginPageProps = {
  user: User | null;
};

export default function LoginPage({ user }: LoginPageProps) {
  return (
    <div>
      <h1>Login Page</h1>
    </div>
  );
}
