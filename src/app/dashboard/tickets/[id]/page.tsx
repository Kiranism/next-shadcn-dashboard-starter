'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, User, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';

import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';

const statusConfig = {
  open: { label: 'Open', variant: 'destructive' as const },
  in_progress: { label: 'In Progress', variant: 'default' as const },
  resolved: { label: 'Resolved', variant: 'default' as const },
  closed: { label: 'Closed', variant: 'secondary' as const }
};

const priorityConfig = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'default' as const },
  high: { label: 'High', variant: 'destructive' as const },
  urgent: { label: 'Urgent', variant: 'destructive' as const }
};

const statusOptions = [
  { value: 'open' as TicketStatus, label: 'Open' },
  { value: 'in_progress' as TicketStatus, label: 'In Progress' },
  { value: 'resolved' as TicketStatus, label: 'Resolved' },
  { value: 'closed' as TicketStatus, label: 'Closed' }
];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [solution, setSolution] = useState('');

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
        const ticketWithDates = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };
        setTicket(ticketWithDates);
        setSolution(ticketWithDates.solution || '');
      } else {
        toast.error(data.error || 'Failed to fetch ticket');
        router.push('/dashboard/tickets');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to fetch ticket');
      router.push('/dashboard/tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Ticket deleted successfully');
        router.push('/dashboard/tickets');
      } else {
        toast.error(data.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          solution: newStatus === 'resolved' ? solution : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                solution: data.data.solution,
                updatedAt: new Date(data.data.updatedAt)
              }
            : null
        );
        toast.success(
          `Ticket status updated to ${newStatus.replace('_', ' ')}`
        );
      } else {
        toast.error(data.error || 'Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-48' />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <Skeleton className='h-64' />
            <Skeleton className='h-64' />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!ticket) {
    return (
      <PageContainer>
        <div className='py-8 text-center'>
          <h3 className='text-lg font-medium text-gray-900'>
            Ticket not found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            The ticket you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button
            className='mt-4'
            onClick={() => router.push('/dashboard/tickets')}
          >
            Back to Tickets
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/dashboard/tickets')}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <Heading
                title={ticket.subject || ticket.title}
                description={`Ticket ID: ${ticket.id}`}
              />
              {ticket.category && (
                <Badge variant='outline' className='mt-2'>
                  {ticket.category}
                </Badge>
              )}
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive'>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the ticket and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className='bg-red-600 hover:bg-red-700'
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Ticket'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className='flex items-center space-x-2'>
          <Badge variant={statusConfig[ticket.status].variant}>
            {statusConfig[ticket.status].label}
          </Badge>
          <Badge variant={priorityConfig[ticket.priority].variant}>
            {priorityConfig[ticket.priority].label} Priority
          </Badge>
          {ticket.tags &&
            ticket.tags.map((tag) => (
              <Badge key={tag} variant='outline'>
                {tag}
              </Badge>
            ))}
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='text-muted-foreground text-sm font-medium'>
                  Description
                </h4>
                <p className='mt-1 text-sm whitespace-pre-wrap'>
                  {ticket.content}
                </p>
              </div>

              {ticket.solution && (
                <>
                  <Separator />
                  <div>
                    <h4 className='text-muted-foreground text-sm font-medium'>
                      Solution
                    </h4>
                    <p className='mt-1 text-sm whitespace-pre-wrap'>
                      {ticket.solution}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className='space-y-4'>
                <div className='flex items-start space-x-2'>
                  <User className='text-muted-foreground mt-1 h-4 w-4' />
                  <div className='space-y-1'>
                    <p className='text-muted-foreground text-xs'>Submitter</p>
                    <p className='text-sm font-medium'>
                      {ticket.nickname || ticket.submitterId}
                    </p>
                    {ticket.email && (
                      <p className='text-muted-foreground text-xs'>
                        {ticket.email}
                      </p>
                    )}
                    {ticket.walletAddress && (
                      <p className='text-muted-foreground font-mono text-xs'>
                        {ticket.walletAddress.slice(0, 6)}...
                        {ticket.walletAddress.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <User className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p className='text-muted-foreground text-xs'>Assigned To</p>
                    <p className='text-sm font-medium'>
                      {ticket.assignedTo || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Calendar className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p className='text-muted-foreground text-xs'>Created</p>
                    <p className='text-sm font-medium'>
                      {format(ticket.createdAt, 'PPP p')}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Clock className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p className='text-muted-foreground text-xs'>
                      Last Updated
                    </p>
                    <p className='text-sm font-medium'>
                      {format(ticket.updatedAt, 'PPP p')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
              <CardDescription>
                Update ticket status and add resolution notes
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value: TicketStatus) =>
                    handleStatusUpdate(value)
                  }
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Solution / Resolution Notes</Label>
                <Textarea
                  placeholder='Add solution or resolution notes...'
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className='min-h-[100px]'
                />
              </div>

              <Button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={isUpdatingStatus || ticket.status === 'resolved'}
                className='w-full'
              >
                {isUpdatingStatus ? 'Updating...' : 'Mark as Resolved'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
