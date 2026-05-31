import PageContainer from '@/components/layout/page-container';
import { RoleGuard } from '@/components/layout/role-guard';
import { TeamView } from '@/features/team/components/team-view';

export const metadata = { title: 'Dashboard: Visão do Time' };

export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Visão do Time'
      pageDescription='Acompanhe a disponibilidade, as rotinas e as atividades dos seus subordinados.'
    >
      <RoleGuard minRank={1}>
        <TeamView />
      </RoleGuard>
    </PageContainer>
  );
}
