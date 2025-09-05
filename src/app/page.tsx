import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard');
  }
}
