import StoreDetails from '../[storeId]/_components/store-details';
import PageContainer from '@/components/layout/page-container';
import StoreListingPage from '../[storeId]/_components/store-listing-page';

export default function StoreViewPage() {
  return (
    <PageContainer>
      <StoreDetails />
      <StoreListingPage />
    </PageContainer>
  );
}
