'use client';

import { CurrentUserContextType } from '@/@types/user';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OrderItem, Orders } from '@/constants/data';
import { UserContext } from '@/context/UserProvider';
import { useRouter } from 'next/navigation';
import React from 'react';

interface OrderProps {
  orders: Orders[];
}

export const RecentOrders: React.FC<OrderProps> = ({ orders }) => {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();

  const [totalPrice, setTotalPrice] = React.useState<any>([]);

  console.log(totalPrice);

  React.useEffect(() => {
    const totalPrices = orders.map((order) =>
      order.item.reduce(
        (sum: number, item: OrderItem) => sum + item.price * item.quantity,
        0
      )
    );

    setTotalPrice(totalPrices);
  }, [orders]); // This effect depends on `order`

  console.log(totalPrice);

  return (
    <div className="space-y-8">
      {orders.slice(0, 4).map((item, index) => (
        <div key={index}>
          <div
            className="flex items-center hover:cursor-pointer"
            onClick={() =>
              router.push(
                `/dashboard/orders/${item.orderId}?id=${item._id}&storeId=${item?.item[0]?.storeId || ''}`
              )
            }
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="uppercase">
                {item?.userId.firstname.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{`${item.userId.firstname} ${item.userId.lastname}`}</p>
              <p className="text-sm text-muted-foreground">
                {item.userId.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {`${new Date(item.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`}
              </p>
              <p>
                {' '}
                {user?.role === 'store' && (
                  <>
                    {item.fulfilled[0].fulfilled != false ? (
                      <span className="me-2 rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        Shipped
                      </span>
                    ) : (
                      <span className="me-2 rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                        Not Shipped
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="ml-auto font-medium">
              {user?.role === 'admin' &&
                item.subTotal &&
                `$${item.subTotal.toFixed(2)}`}
              {user?.role === 'store' && (
                <div key={index}>
                  <p>{`$${totalPrice[index].toFixed(2)}`}</p>
                </div>
              )}
            </div>
          </div>
          {/* <Separator /> */}
        </div>
      ))}
    </div>
  );
};
