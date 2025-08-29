import { NextRequest, NextResponse } from 'next/server';
import {
  reviewSubmissionSchema,
  submissionIdSchema
} from '@/lib/validations/submission';
import {
  getSubmissionById,
  reviewSubmission
} from '@/lib/services/submission-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/submissions/[id] - Get submission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate submission ID
    const resolvedParams = await params;
    const submissionId = submissionIdSchema.parse(resolvedParams.id);

    // Get submission
    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('Error in GET /api/submissions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

// PATCH /api/submissions/[id] - Review submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate submission ID
    const resolvedParams = await params;
    const submissionId = submissionIdSchema.parse(resolvedParams.id);

    const body = await request.json();

    // Validate request body
    const validatedData = reviewSubmissionSchema.parse(body);

    // Review submission
    const updatedSubmission = await reviewSubmission(
      submissionId,
      validatedData,
      userId
    );

    if (!updatedSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission reviewed successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/submissions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    );
  }
}
