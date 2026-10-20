import { auth } from '@clerk/nextjs/server';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  await auth.protect();

  return <ProfileViewPage />;
}
