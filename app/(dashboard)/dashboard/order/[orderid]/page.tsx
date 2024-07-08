'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BreadCrumb from '@/components/breadcrumb';
import { OrderForm } from '@/components/forms/order-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getOrder } from '@/data/orders';
import { Order } from '@/types/order';

export default function Page() {
  const params = useParams();
  const orderId = params.orderid as string;
  const [initialOrder, setInitialOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  console.log('orderId from params:', orderId);

  useEffect(() => {
    async function loadOrder() {
      console.log('orderId from params:', orderId);

      if (orderId) {
        try {
          setIsLoading(true);
          const order = await getOrder(Number(orderId));

          setInitialOrder(order);
        } catch (error) {
          console.error('Failed to fetch order:', error);
          // Handle error (e.g., show error message to user)
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);
  const breadcrumbItems = [
    { title: 'Orders', link: '/dashboard/orders' },
    {
      title: orderId ? 'Edit' : 'Create',
      link: `/dashboard/orders/${orderId || 'create'}`
    }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8">
        <BreadCrumb items={breadcrumbItems} />
        <OrderForm
          initialData={initialOrder}
          statuses={[
            'Confirmation Sent',
            'Confirmer',
            'Annulé',
            'Livré',
            'Mise en distribution',
            'Pas de réponse + SMS',
            'Refusé',
            'Retourné',
            'Whatsapp Invalid',
            'Suivi'
          ]}
          shippingCompanies={['FedEx', 'UPS', 'DHL']}
          agents={['Youssef', 'Chaimae', 'Agent3']}
        />
      </div>
    </ScrollArea>
  );
}
