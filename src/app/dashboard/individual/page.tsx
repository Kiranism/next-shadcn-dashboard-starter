import PageContainer from '@/components/layout/page-container';
import { IndividualView } from './individual-view';

export const metadata = { title: 'Dashboard: Individual' };

export default function IndividualPage() {
  return (
    <PageContainer
      pageTitle='Individual'
      pageDescription='Gerencie suas atividades e compromissos pessoais.'
    >
      <IndividualView />
    </PageContainer>
  );
}
