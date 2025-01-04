import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/');
  } else {
    redirect('/dashboard/overview');
  }
}
