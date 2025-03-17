'use client';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { IProduct } from 'types/schema/product.shema';
import TextCapsule from '@/components/text-capsule';
import { cn } from '@/lib/utils';

export const columns: ColumnDef<IProduct>[] = [
  {
    accessorKey: 'thumbnail',
    header: 'Image',
    cell: ({ row }) => {
      return (
        <div className='relative aspect-square'>
          <Image
            src={row.getValue('thumbnail')}
            alt={row.getValue('title')}
            fill
            className='rounded-lg'
          />
        </div>
      );
    }
  },
  {
    accessorKey: 'title',
    header: 'Name'
  },
  {
    accessorKey: 'description',
    header: 'Description'
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
      <TextCapsule
        className={cn(
          'bg-red-500 text-white',
          row.original.is_active && 'bg-green-500'
        )}
      >
        {row.original.is_active ? 'Active' : 'Inactive'}
      </TextCapsule>
    )
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category.name
  },
  {
    accessorKey: 'regularPrice',
    header: 'Regular Price'
  },
  {
    accessorKey: 'discountPrice',
    header: 'Discount Price'
  },
  {
    accessorKey: 'stockAmount',
    header: 'Stock'
  },
  {
    accessorKey: 'holdAmount',
    header: 'Hold'
  },
  {
    accessorKey: 'soldAmount',
    header: 'Sold'
  },
  {
    accessorKey: 'thresholdAMount',
    header: 'Threshold'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
