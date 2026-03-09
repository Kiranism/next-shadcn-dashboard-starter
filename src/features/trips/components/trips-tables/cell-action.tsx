'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Eye } from 'lucide-react';
import { useState } from 'react';
import { TripDetailSheet } from '@/features/overview/components/trip-detail-sheet';

interface CellActionProps {
  data: any;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Menü öffnen</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsDetailOpen(true)}>
            <Eye className='mr-2 h-4 w-4' /> Details anzeigen
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Edit className='mr-2 h-4 w-4' /> Bearbeiten
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TripDetailSheet
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        tripId={data.id}
      />
    </>
  );
};
