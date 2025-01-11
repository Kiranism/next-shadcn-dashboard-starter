import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Import cookies

export default async function Dashboard() {
  const session = await auth();
  const nextCookies = await cookies(); // Get cookies object
  const loggedin = nextCookies.get('user');

  if (!loggedin) {
    return redirect('/');
  } else {
    redirect('/dashboard/overview');
  }
}
