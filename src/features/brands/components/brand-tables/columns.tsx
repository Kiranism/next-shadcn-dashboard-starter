'use client';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { IBrand } from 'types/schema/product.shema';
import TextCapsule from '@/components/text-capsule';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import Icons from '@/components/ui/icons';

export const columns: ColumnDef<IBrand>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
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
    cell: ({ row }) => (
      <Popover>
        <PopoverTrigger className='flex items-center justify-center gap-1'>
          {(row.original.categories?.length ?? 0) > 10
            ? '10+'
            : (row.original.categories?.length ?? 'No')}{' '}
          Categor
          {(row.original.categories?.length ?? 0) < 2 ? 'y' : 'ies'}
          <Icons.chevronDown className='rotate-0 transition-all data-[state=open]:rotate-180' />
        </PopoverTrigger>

        <PopoverContent className='flex flex-col gap-1'>
          <p>{row.original.name}</p>
          <p className='text-sm'>Categories</p>
          <ul className='list-inside list-disc text-xs'>
            {row.original.categories?.map(
              (cat, index) => index < 10 && <li key={cat.id}>{cat.name}</li>
            )}
            {(row.original.categories?.length ?? 0) > 10 && (
              <li>+${(row.original.categories?.length ?? 0) - 10} more</li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
