'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';

import { TicketForm } from '@/features/tickets/components/ticket-form';
import { CreateTicketInput } from '@/lib/validations/ticket';

export default function NewTicketPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateTicketInput) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Support ticket created successfully!');
        router.push('/dashboard/tickets');
      } else {
        toast.error(result.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  return (
    <PageContainer>
      <div className='space-y-4'>
        <Heading
          title='Create Support Ticket'
          description='Submit a new support request or report an issue'
        />

        <TicketForm onSubmit={handleSubmit} />
      </div>
    </PageContainer>
  );
}
