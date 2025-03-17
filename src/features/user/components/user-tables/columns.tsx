'use client';
import { ColumnDef } from '@tanstack/react-table';
import TextCapsule from '@/components/text-capsule';
import { cn } from '@/lib/utils';
import { IUserBase } from 'types/schema/user.schema';
import { AvatarPicker } from '@/components/ui/avatar-picker';

export const columns: ColumnDef<IUserBase>[] = [
  {
    id: 'avatar',
    header: 'Image',
    cell: ({ row }) => {
      return (
        <AvatarPicker
          src={row.original.name}
          alt={'User Profile Picture'}
          readOnly
          className='size-10 p-0'
        />
      );
    }
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role'
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
  }
  //   {
  //     id: 'actions',
  //     cell: ({ row }) => <CellAction data={row.original} />
  //   }
];
