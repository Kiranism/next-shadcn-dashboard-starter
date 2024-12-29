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
    accessorKey: 'description',
    header: 'DESCRIPTION'
  },

  {
    id: 'actions'
    //cell: ({ row }) => <CellAction data={row.original} />
  }
];
