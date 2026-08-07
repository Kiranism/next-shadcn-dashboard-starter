import PageContainer from '@/components/layout/page-container';
import { AiChatDemo } from '@/features/ai-chat/components/ai-chat-demo';

export const metadata = {
  title: 'Dashboard: AI Chat'
};

export default function Page() {
  return (
    <PageContainer>
      <AiChatDemo />
    </PageContainer>
  );
}
