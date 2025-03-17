import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as BrandTable } from '@/components/ui/table/data-table';
import { columns } from './brand-tables/columns';
import { IBrand } from 'types/schema/product.shema';
import getBrands from '@/app/(server)/actions/getBrands';

export default async function BrandsListingPage() {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const categories = searchParamsCache.get('categories');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categories: categories })
  };

  const brandsData = await getBrands(); // TODO: Add filters here

  if (!brandsData.ok) {
    // TODO: Add a proper error state table here
    return <>Error Loading Data...</>;
  }

  const data = brandsData.data;

  const totalBrands = Math.ceil(data.payload.length / pageLimit);
  const brands: IBrand[] = data.payload;

  return (
    <BrandTable columns={columns} data={brands} totalItems={totalBrands} />
  );
}
