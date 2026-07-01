import PageContainer from '@/components/layout/page-container';
import { GamificationView } from '@/features/gamification/components/gamification-view';

export const metadata = { title: 'Dashboard: Gamificação' };

export default function GamificationPage() {
  return (
    <PageContainer pageTitle='Gamificação' pageDescription='Casas, ciclos e recompensas.'>
      <GamificationView />
    </PageContainer>
  );
}
