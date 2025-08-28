import { NextRequest, NextResponse } from 'next/server';
import { createTaskSchema } from '@/lib/validations/task';
import {
  getAllTasks,
  getTasks,
  createTask,
  getTaskStats
} from '@/lib/services/task-db-service';
import { auth } from '@clerk/nextjs/server';

// GET /api/tasks - Get all tasks or search tasks
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      const stats = await getTaskStats();
      return NextResponse.json({ success: true, data: stats });
    }

    // Parse search parameters for database service
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search') || searchParams.get('searchTerm');
    const projectName = searchParams.get('projectName');

    const filters = {
      page,
      limit,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && { search }),
      ...(projectName && { projectName })
    };

    // Get tasks using database service
    const result = await getTasks(filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Parse dates
    if (body.deadline) {
      body.deadline = new Date(body.deadline);
    }
    if (body.startTime) {
      body.startTime = new Date(body.startTime);
    }

    // Validate request body
    const validatedData = createTaskSchema.parse(body);

    // Create task
    const task = await createTask(validatedData, userId);

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid task data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
