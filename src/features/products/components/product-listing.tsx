import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { getProducts } from '../api/data';
import { productQueries } from '../api/queries';
import { ProductTable } from './product-tables';

export default function ProductListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categories }),
    ...(sort.length > 0 && { sort: JSON.stringify(sort) })
  };

  const queryClient = getQueryClient();

  // Same query key as the browser, but read from the server data layer directly:
  // the browser's queryFn calls /api/products, which the server can't reach with the user's session.
  void queryClient
    .query({ ...productQueries.list(filters), queryFn: () => getProducts(filters) })
    .catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductTable />
    </HydrationBoundary>
  );
}
