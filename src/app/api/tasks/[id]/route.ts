import { NextRequest, NextResponse } from 'next/server';
import { updateTaskSchema, taskIdSchema } from '@/lib/validations/task';
import {
  getTaskById,
  updateTask,
  deleteTask,
  updateParticipantCount
} from '@/lib/services/task-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/tasks/[id] - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    const resolvedParams = await params;
    const taskId = taskIdSchema.parse(resolvedParams.id);

    // Get task
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    const resolvedParams = await params;
    const taskId = taskIdSchema.parse(resolvedParams.id);

    const body = await request.json();

    // Parse dates if present
    if (body.deadline) {
      body.deadline = new Date(body.deadline);
    }
    if (body.startTime) {
      body.startTime = new Date(body.startTime);
    }

    // Validate request body
    const validatedData = updateTaskSchema.parse(body);

    // Update task
    const updatedTask = await updateTask(taskId, validatedData);

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid task data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    const resolvedParams = await params;
    const taskId = taskIdSchema.parse(resolvedParams.id);

    // Delete task
    const deleted = await deleteTask(taskId);

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update participant count
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate task ID
    const resolvedParams = await params;
    const taskId = taskIdSchema.parse(resolvedParams.id);

    const body = await request.json();
    const { action, increment } = body;

    if (action === 'updateParticipants') {
      const updatedTask = await updateParticipantCount(taskId, increment || 1);

      if (!updatedTask) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: updatedTask });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating task participants:', error);

    if (
      error instanceof Error &&
      error.message.includes('Maximum participants')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update task participants' },
      { status: 500 }
    );
  }
}
