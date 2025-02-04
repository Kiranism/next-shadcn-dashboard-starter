'use client';
import { Orders, UserId, Fulfilled } from '@/constants/data';
import { Row } from '@tanstack/react-table'; // Import Row type
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const user = cookies.get('user');

export const columns: ColumnDef<Orders>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'orderId',
    header: 'ID'
  },
  {
    accessorKey: 'createdAt',
    header: 'DATE',
    cell: ({ row }) => {
      const order_date = row.getValue<string>('createdAt');
      return (
        <p>{`${new Date(order_date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`}</p>
      );
    }
  },
  // {
  //   accessorKey: 'storeId',
  //   header: 'STORE',
  //   cell: ({ row }) => {
  //     const storeName = row.getValue<Store>('storeId');
  //     return (
  //       <div>
  //         <p>{`${storeName.storeName}`}</p>
  //       </div>
  //     );
  //   }
  // },
  {
    accessorKey: 'userId',
    header: 'CUSTOMER',
    cell: ({ row }) => {
      const customer = row.getValue<UserId | null>('userId');
      //const name = row.getValue<string | null>('email');
      return (
        <div>
          {customer ? (
            <p>{`${customer.firstname} ${customer.lastname}`}</p> // Safely access the firstname and lastname
          ) : (
            <p>Guest Checkout</p> // Fallback in case the customer object is null or undefined
          )}
        </div>
      );
    }
  },
  ...(user?.role === 'store'
    ? [
        {
          accessorKey: 'fulfilled',
          header: 'FULFILLED',
          cell: ({ row }: { row: Row<any> }) => {
            const fulfilledArray = row.getValue<Array<Fulfilled>>('fulfilled');
            return (
              <div>
                {fulfilledArray && fulfilledArray.length > 0 ? (
                  fulfilledArray.map((fulfilledItem: any, index: any) => (
                    <p key={index}>{fulfilledItem.fulfilled ? 'Yes' : 'No'}</p>
                  ))
                ) : (
                  <p>No Data</p>
                )}
              </div>
            );
          }
        }
      ]
    : []),

  {
    id: 'actions'
    //cell: ({ row }) => <CellAction data={row.original} />
  }
];
