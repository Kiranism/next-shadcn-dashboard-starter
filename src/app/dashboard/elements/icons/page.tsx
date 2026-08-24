import { auth } from '@clerk/nextjs/server';
import IconsViewPage from '@/features/elements/components/icons-view-page';

export const metadata = {
  title: 'Dashboard : Icons'
};

export default async function page() {
  await auth.protect();

  return <IconsViewPage />;
}
