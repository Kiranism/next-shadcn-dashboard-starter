'use client';
import { ColumnDef } from '@tanstack/react-table';
import TextCapsule from '@/components/text-capsule';
import { cn } from '@/lib/utils';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { IProductAttribute } from 'types/schema/product.shema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<IProductAttribute>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    id: 'attr-val',
    header: 'Attribute Value',
    cell: ({ row }) => row.original.attributeValue.value
  },
  {
    id: 'attr-group',
    header: 'Attribute Group',
    cell: ({ row }) => row.original.attributeValue.attributeGroup.title
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ row }) =>
      row.original.created_at
        ? new Date(row.original.created_at).toLocaleDateString('en-GB')
        : 'N/A'
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
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
