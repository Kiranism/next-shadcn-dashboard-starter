import { NextRequest, NextResponse } from 'next/server';
import {
  updateTicketSchema,
  updateTicketStatusSchema,
  ticketIdSchema
} from '@/lib/validations/ticket';
import {
  getTicketById,
  updateTicket,
  updateTicketStatus,
  deleteTicket
} from '@/lib/services/ticket-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/tickets/[id] - Get ticket by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ticket ID
    const resolvedParams = await params;
    const ticketId = ticketIdSchema.parse(resolvedParams.id);

    // Get ticket
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/[id] - Update ticket basic info
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ticket ID
    const resolvedParams = await params;
    const ticketId = ticketIdSchema.parse(resolvedParams.id);

    const body = await request.json();

    // Validate request body
    const validatedData = updateTicketSchema.parse(body);

    // Update ticket
    const updatedTicket = await updateTicket(ticketId, validatedData);

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid ticket data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ticket ID
    const resolvedParams = await params;
    const ticketId = ticketIdSchema.parse(resolvedParams.id);

    const body = await request.json();

    // Validate request body
    const validatedData = updateTicketStatusSchema.parse(body);

    // Update ticket status
    const updatedTicket = await updateTicketStatus(
      ticketId,
      validatedData.status,
      validatedData.solution
    );

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket status:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid status data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update ticket status' },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ticket ID
    const resolvedParams = await params;
    const ticketId = ticketIdSchema.parse(resolvedParams.id);

    // Delete ticket
    const deleted = await deleteTicket(ticketId);

    if (!deleted) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
