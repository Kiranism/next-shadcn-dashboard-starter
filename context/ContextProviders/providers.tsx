'use client';
import UserProvider from '../UserProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
