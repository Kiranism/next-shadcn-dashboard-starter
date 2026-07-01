import PageContainer from '@/components/layout/page-container';
import { UsersView } from '@/features/users/components/users-view';

export const metadata = { title: 'Dashboard: Usuários' };

export default function UsersPage() {
  return (
    <PageContainer
      pageTitle='Usuários'
      pageDescription='Gerencie as informações dos colaboradores cadastrados.'
    >
      <UsersView />
    </PageContainer>
  );
}
