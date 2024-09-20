import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import ProductTable from '@/components/tables/product-tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Employee, users } from '@/constants/data';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Product', link: '/dashboard/product' }
];

type pageProps = {
  searchParams: SearchParams;
};

async function fetchData(page: number, pageLimit: number, search: string) {
  const res = await fetch(
    `https://api.slingacademy.com/v1/sample-data/users?offset=${
      page - 1
    }&limit=${pageLimit}` + (search ? `&search=${search}` : '')
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

  const data = await fetchData(page, pageLimit, search);
  const totalUsers = data.total_users; //1000
  const pageCount = Math.ceil(totalUsers / pageLimit);
  const employee: Employee[] = data.users;

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={`Users (${totalUsers})`}
            description="Manage users (Client side table functionalities.)"
          />
          <Link
            href={'/'}
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <ProductTable data={employee} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}
