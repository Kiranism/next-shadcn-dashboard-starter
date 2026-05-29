import { redirect } from 'next/navigation';

export default function SignUpPage() {
  redirect('/auth/sign-in');
}
