'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Orders } from '@/constants/data';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

interface OrderProps {
  orders: Orders[];
}

export const RecentOrders: React.FC<OrderProps> = ({ orders }) => {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {orders.slice(0, 4).map((item, index) => (
        <div key={index}>
          <div
            className="flex items-center hover:cursor-pointer"
            onClick={() => router.push(`/dashboard/orders/${item.orderId}`)}
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
            </div>
            <div className="ml-auto font-medium">
              {item.subTotal ? `$${item.subTotal}` : '+$1,999.00'}
            </div>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  );
};
