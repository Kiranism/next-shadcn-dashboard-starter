'use client';
import { Listing, ListingImage } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

export const columns: ColumnDef<Listing>[] = [
  {
    accessorKey: 'listingImage',
    header: 'IMAGE',
    cell: ({ row }) => {
      const images = row.getValue<ListingImage[]>('listingImage');
      const imageUrl = images?.[0]?.url || '';
      return (
        <div className="relative aspect-square">
          <Image src={imageUrl} alt={'listing'} fill className="rounded-lg" />
        </div>
      );
    }
  },
  {
    accessorKey: 'listingName',
    header: 'NAME'
  },
  {
    accessorKey: 'category',
    header: 'CATEGORY'
  },
  {
    accessorKey: 'price',
    header: 'PRICE'
  },
  {
    accessorKey: 'quantity',
    header: 'QUANTITY'
  },
  {
    accessorKey: 'sku',
    header: 'SKU'
  },
  {
    accessorKey: 'upc',
    header: 'UPC'
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
  {
    accessorKey: 'description',
    header: 'DESCRIPTION'
  },

  {
    id: 'actions'
    //cell: ({ row }) => <CellAction data={row.original} />
  }
];
