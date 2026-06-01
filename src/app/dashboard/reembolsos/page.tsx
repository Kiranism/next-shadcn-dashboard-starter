import PageContainer from '@/components/layout/page-container';
import { ReembolsosView } from '@/features/reembolsos/components/reembolsos-view';

export const metadata = { title: 'Dashboard: Reembolsos' };

export default function ReembolsosPage() {
  return (
    <PageContainer
      pageTitle='Reembolsos'
      pageDescription='Solicite e acompanhe seus pedidos de reembolso.'
    >
      <ReembolsosView />
    </PageContainer>
  );
}
