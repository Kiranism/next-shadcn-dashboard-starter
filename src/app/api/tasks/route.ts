import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { SceneTask, SceneTaskStatus } from '@/types/sceneTask';

type CreateTaskInput = {
  description?: string;
  videoUrl?: string;
  sceneNumber?: number;
  status: SceneTaskStatus;
  createdByUserId: string;
  assignedToUserId?: string;
  sceneId?: string;
};

export async function GET(
  req: Request
): Promise<NextResponse<SceneTask[] | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const assignedToUserId = searchParams.get('assignedToUserId');

    if (!statusParam) {
      return NextResponse.json(
        { error: 'Task status are required' },
        { status: 400 }
      );
    }

    // Validate that the status is a valid enum value
    if (
      !Object.values(SceneTaskStatus).includes(statusParam as SceneTaskStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const tasks = await prisma.sceneTask.findMany({
      where: {
        status: statusParam as any, // Use type assertion to bypass type check
        assignedToUserId
      },
      include: {
        scene: true,
        createdBy: true,
        assignedTo: true
      }
    });

    return NextResponse.json(tasks as unknown as SceneTask[]);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function PATCH(
  req: Request
): Promise<NextResponse<SceneTask | { error: string }>> {
  try {
    const data = await req.json();
    const { taskId, assignedToUserId } = data;

    if (!taskId || !assignedToUserId) {
      return NextResponse.json(
        { error: 'taskId and assignedToUserId are required' },
        { status: 400 }
      );
    }

    const task = await prisma.sceneTask.update({
      where: {
        id: taskId
      },
      data: {
        assignedToUserId,
        status: SceneTaskStatus.ASSIGNED
      },
      include: {
        scene: true,
        createdBy: true,
        assignedTo: true
      }
    });

    return NextResponse.json(task as unknown as SceneTask);
  } catch (error) {
    console.error('Error assigning task:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(
  req: Request
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    //TODO: need to check if the user is admin

    await prisma.sceneTask.update({
      where: {
        id: taskId
      },
      data: {
        status: SceneTaskStatus.DELETED as any
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
