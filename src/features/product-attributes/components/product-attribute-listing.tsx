import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as ProductAttributeTable } from '@/components/ui/table/data-table';
import getProducts from '@/app/(server)/actions/getProducts';
import { IProduct, IProductAttribute } from 'types/schema/product.shema';
import getProductAttributes from '@/app/(server)/actions/getProductsAttributes';
import { columns } from './product-attributes-table/columns';

type ProductAttributeListingPage = {};

export default async function ProductAttributeListingPage({}: ProductAttributeListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };

  const prodData = await getProductAttributes({ ...filters });

  if (!prodData.ok) {
    // TODO: Add a proper error state table here
    return <>Error Loading Data...</>;
  }

  const data = prodData.data;

  const totalProducts = Math.ceil(data.payload.length / pageLimit);
  const attributes: IProductAttribute[] = data.payload;

  return (
    <ProductAttributeTable
      columns={columns}
      data={attributes}
      totalItems={totalProducts}
    />
  );
}
