'use client';
import { Blogs, UserId } from '@/constants/data';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<Blogs>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: '_id',
    header: 'ID'
  },
  {
    accessorKey: 'title',
    header: 'TITLE'
  },
  {
    accessorKey: 'tag',
    header: 'TAG'
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
    accessorKey: 'author',
    header: 'AUTHOR',
    cell: ({ row }) => {
      const author = row.getValue<UserId | null>('author');
      return (
        <div>
          {author ? (
            <p>{`${author.firstname} ${author.lastname}`}</p> // Safely access the firstname and lastname
          ) : (
            <p>Null</p> // Fallback in case the customer object is null or undefined
          )}
        </div>
      );
    }
  },
  {
    id: 'actions'
    //cell: ({ row }) => <CellAction data={row.original} />
  }
];
