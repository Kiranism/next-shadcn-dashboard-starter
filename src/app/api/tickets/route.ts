import { NextRequest, NextResponse } from 'next/server';
import { createTicketSchema } from '@/lib/validations/ticket';
import { getTickets, getTicketStats } from '@/lib/services/ticket-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/tickets - Get all tickets or search tickets
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      const stats = await getTicketStats();
      return NextResponse.json({ success: true, data: stats });
    }

    // Parse search parameters for database service
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search') || searchParams.get('searchTerm');
    const submitter =
      searchParams.get('submitter') || searchParams.get('submitterId');
    const assignedTo = searchParams.get('assignedTo');
    const tags = searchParams.get('tags');
    const category = searchParams.get('category');
    const email = searchParams.get('email');

    const filters = {
      page,
      limit,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && { search }),
      ...(submitter && { submitter }),
      ...(assignedTo && { assignedTo }),
      ...(tags && { tags }),
      ...(category && { category }),
      ...(email && { email })
    };

    // Get tickets using database service
    const result = await getTickets(filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
