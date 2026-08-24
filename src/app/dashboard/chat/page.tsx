import { auth } from '@clerk/nextjs/server';
import ChatViewPage from '@/features/chat/components/chat-view-page';

export const metadata = {
  title: 'Dashboard: Chat'
};

export default async function Page() {
  await auth.protect();

  return <ChatViewPage />;
}
