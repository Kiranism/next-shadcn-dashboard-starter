import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import ProductTable from '@/components/tables/product-tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Employee, Product, users } from '@/constants/data';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Products', link: '/dashboard/product' }
];

type pageProps = {
  searchParams: SearchParams;
};

async function fetchProductData(
  page: number,
  pageLimit: number,
  search: string
) {
  const offset = (page - 1) * pageLimit; // Calculate the offset
  const searchQuery = search ? `&search=${search}` : ''; // If there's a search query
  const res = await fetch(
    `https://api.slingacademy.com/v1/sample-data/products?offset=${offset}&limit=${pageLimit}${searchQuery}`
  );

  return res.json();
}

export default async function page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');

  console.log('filters', page, pageLimit, search);

  const data = await fetchProductData(page, pageLimit, search);
  const totalProducts = data.total_products;
  const products: Product[] = data.products;

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={`Products (${totalProducts})`}
            description="Manage products (Server side table functionalities.)"
          />
          <Link
            href={'/'}
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <ProductTable data={products} totalData={totalProducts} />
      </div>
    </PageContainer>
  );
}
