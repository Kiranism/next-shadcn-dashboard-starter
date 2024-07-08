import BreadCrumb from '@/components/breadcrumb';
import { columns } from '@/components/tables/order-tables/columns';
import { OrderTable } from '@/components/tables/order-tables/order-table';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Order } from '@/types/order';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getOrders } from '@/data/orders';

const breadcrumbItems = [{ title: 'Orders', link: '/dashboard/orders' }];

type ParamsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

export default async function OrdersPage({ searchParams }: ParamsProps) {
  const page = Number(searchParams.page) || 1;
  const pageLimit = Number(searchParams.limit) || 10;
  const searchTerm = (searchParams.search as string) || '';
  const offset = (page - 1) * pageLimit;

  const ordersList = await getOrders(offset, pageLimit, searchTerm);
  const totalOrders = 156 || 0;
  const pageCount = Math.ceil(totalOrders / pageLimit);
  const orders: Order[] = ordersList || [];

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Orders (${totalOrders})`}
            description="Manage orders (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/orders/new'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Order
          </Link>
        </div>
        <Separator />

        <OrderTable
          searchKey="customer_name"
          pageNo={page}
          columns={columns}
          totalOrders={totalOrders}
          data={orders}
          pageCount={pageCount}
        />
      </div>
    </>
  );
}
