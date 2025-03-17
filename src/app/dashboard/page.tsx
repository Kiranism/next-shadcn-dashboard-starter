import { SiteConfig } from '@/constants/site-config';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user && !SiteConfig.featureFlags.disableAuth) {
    return redirect('/');
  } else {
    redirect('/dashboard/overview');
  }
}
