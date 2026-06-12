import { NextRequest, NextResponse } from 'next/server';
import { FlowPublisherService } from '@/lib/services/flow-publisher.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id, flowId } = await params;
    const projectId = id;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Auth check should be here in a real app, skipping for internal simplicity or relying on middleware
    // const session = await getServerSession();
    // if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const publishedVersion = await FlowPublisherService.publish(
      projectId,
      flowId
    );

    return NextResponse.json({
      success: true,
      message: 'Flow published successfully',
      version: publishedVersion
    });
  } catch (error) {
    logger.error('API Publish Error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish flow' },
      { status: 500 }
    );
  }
}
