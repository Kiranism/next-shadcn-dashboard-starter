import { redirect } from 'next/navigation';

export default function AuthPage(): never {
  redirect('/auth/sign-in');
}
