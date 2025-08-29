import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSubmissions,
  getSubmissions,
  getSubmissionStats
} from '@/lib/services/submission-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/submissions - Get all submissions or search submissions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      const stats = await getSubmissionStats();
      return NextResponse.json({ success: true, data: stats });
    }

    // Parse search parameters for database service
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const reviewStatus = searchParams.get('reviewStatus');
    const taskId = searchParams.get('taskId');
    const submissionUserId = searchParams.get('userId');
    const reviewedBy = searchParams.get('reviewedBy');
    const search = searchParams.get('search') || searchParams.get('searchTerm');

    const filters = {
      page,
      limit,
      ...(reviewStatus && { reviewStatus }),
      ...(taskId && { taskId }),
      ...(submissionUserId && { userId: submissionUserId }),
      ...(reviewedBy && { reviewedBy }),
      ...(search && { search })
    };

    // Get submissions using database service
    const result = await getSubmissions(filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in GET /api/submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
