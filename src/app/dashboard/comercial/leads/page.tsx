import PageContainer from '@/components/layout/page-container';
import { LeadsView } from '@/features/leads/components/leads-view';

export const metadata = { title: 'Dashboard: Leads' };

export default function LeadsPage() {
  return (
    <PageContainer
      pageTitle='Leads'
      pageDescription='Consulte e gerencie os prospects do setor comercial.'
    >
      <LeadsView />
    </PageContainer>
  );
}
