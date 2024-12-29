'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { getStore, getStoreListing } from '@/utils/store';
import { useSearchParams, useParams } from 'next/navigation';

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
      console.log(res);
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
