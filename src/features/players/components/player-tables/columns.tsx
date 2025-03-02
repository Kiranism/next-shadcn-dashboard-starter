'use client';

import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { Player } from '@/constants/data';

export const playerColumns: ColumnDef<Player>[] = [
  {
    accessorKey: 'picture',
    header: 'PICTURE',
    cell: ({ row }) => {
      const picture = row.getValue('picture') as string;
      const nickname = row.getValue('nickname') as string;
      return picture ? (
        <div className='relative h-[60px] w-[60px]'>
          <Image
            src={picture}
            alt={nickname}
            layout='fill'
            objectFit='cover'
            className='rounded-full'
          />
        </div>
      ) : (
        <div className='flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gray-200'>
          <span className='text-xl font-bold text-gray-700'>
            {nickname.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'nickname',
    header: 'NICKNAME'
  },
  {
    accessorKey: 'gender',
    header: 'GENDER',
    cell: ({ row }) => {
      const gender = row.getValue('gender');
      return gender === 1 ? 'Male' : 'Female';
    }
  },
  {
    accessorKey: 'level',
    header: 'LEVEL',
    cell: ({ row }) => {
      const level = row.getValue('level') as number;
      return (level / 100).toFixed(2);
    }
  }
];
