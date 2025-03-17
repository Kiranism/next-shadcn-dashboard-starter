import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as CategoryTable } from '@/components/ui/table/data-table';
import { ICategory } from 'types/schema/product.shema';
import { columns } from './category-tables/columns';
import getCategories from '@/app/(server)/actions/getCategories';

export default async function CategoryListingPage() {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };

  const brandsData = await getCategories(); // TODO: Add filters here

  if (!brandsData.ok) {
    // TODO: Add a proper error state table here
    return <>Error Loading Data...</>;
  }

  const data = brandsData.data;

  const totalCategories = Math.ceil(data.payload.length / pageLimit);
  const brands: ICategory[] = data.payload;

  return (
    <CategoryTable
      columns={columns}
      data={brands}
      totalItems={totalCategories}
    />
  );
}
