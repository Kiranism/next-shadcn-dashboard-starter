'use client';
import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { getStore } from '@/utils/store';
import { useParams } from 'next/navigation';

interface IStore {
  _id: string;
  storeName: string;
  description: string;
  social: string;
  website: string;
  location: string;
  displayPicture: string;
}

export default function StoreDetailsPage() {
  const params = useParams();
  const { storeId } = params;

  const [store, setStore] = React.useState<IStore>();

  React.useEffect(() => {
    getStore(storeId).then((res) => {
      // console.log(res);
      setStore(res?.store);
    });
  }, []);

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold capitalize">
          {store?.storeName}
          <div className="">
            <img
              src={store?.displayPicture}
              alt="my image"
              className="w-32 rounded-lg"
            />
            <CardDescription>{store?.description}</CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
