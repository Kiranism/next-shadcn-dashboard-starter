import { ScrollArea } from '@/components/ui/scroll-area';
import StoreDetails from './store-details';
import PageContainer from '@/components/layout/page-container';
import StoreListingPage from './store-listing-page';

export default function StoreViewPage() {
  return (
    <PageContainer>
      <StoreDetails />
      <StoreListingPage />
    </PageContainer>
  );
}
