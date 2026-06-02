import PageContainer from '@/components/layout/page-container';
import { PortfolioView } from '@/features/portfolio/components/portfolio-view';

export const metadata = { title: 'Dashboard: Portfólio' };

export default function PortfolioPage() {
  return (
    <PageContainer
      pageTitle='Portfólio'
      pageDescription='Serviços e soluções oferecidos pela Watt Consultoria.'
    >
      <PortfolioView />
    </PageContainer>
  );
}
