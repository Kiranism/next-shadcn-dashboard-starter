import BreadCrumb from '@/components/breadcrumb';
import { columns } from '@/components/tables/product-tables/columns';
import { ProductTable } from '@/components/tables/product-tables/product-table';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getProducts } from '@/data/products';

const breadcrumbItems = [{ title: 'Employee', link: '/dashboard/employee' }];

type paramsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

export default async function page({ searchParams }: paramsProps) {
  const page = Number(searchParams.page) || 1;
  const pageLimit = Number(searchParams.limit) || 10;
  const country = searchParams.search || null;
  const offset = (page - 1) * pageLimit;

  const res = await fetch(
    `https://api.slingacademy.com/v1/sample-data/users?offset=${offset}&limit=${pageLimit}` +
      (country ? `&search=${country}` : '')
  );
  const productsList = await getProducts();
  const employeeRes = await res.json();
  const totalProducts = productsList.length; //1000
  const pageCount = Math.ceil(totalProducts / pageLimit);
  const product: Product[] = productsList;
  return (
    <>
      <div className="flex-1 space-y-4  p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Product (${totalProducts})`}
            description="Manage employees (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/product/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> aAdd New
          </Link>
        </div>
        <Separator />

        <ProductTable
          searchKey="product"
          pageNo={page}
          columns={columns}
          totalUsers={totalProducts}
          data={product}
          pageCount={pageCount}
        />
      </div>
    </>
  );
}
