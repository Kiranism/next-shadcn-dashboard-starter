import { auth } from '@clerk/nextjs/server';
import NotificationsPage from '@/features/notifications/components/notifications-page';

export const metadata = {
  title: 'Dashboard: Notifications'
};

export default async function Page() {
  await auth.protect();

  return <NotificationsPage />;
}
