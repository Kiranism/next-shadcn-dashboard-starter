'use client';

import { useState } from 'react';
import { Eye, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TaskSubmission } from '@/types/submission';

interface CellActionProps {
  data: TaskSubmission;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleView = () => {
    router.push(`/dashboard/submissions/${data.id}`);
  };

  const handleReview = async (reviewStatus: 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/submissions/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to review submission');
      }

      toast.success(`Submission ${reviewStatus} successfully`);
      router.refresh();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleView}>
          <Eye className='mr-2 h-4 w-4' />
          View Details
        </DropdownMenuItem>
        {data.reviewStatus === 'pending' && (
          <>
            <DropdownMenuItem
              onClick={() => handleReview('approved')}
              disabled={isLoading}
            >
              <CheckCircle className='mr-2 h-4 w-4 text-green-600' />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleReview('rejected')}
              disabled={isLoading}
            >
              <XCircle className='mr-2 h-4 w-4 text-red-600' />
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
