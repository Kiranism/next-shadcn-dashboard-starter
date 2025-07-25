import { NextRequest, NextResponse } from 'next/server';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  settings: {
    allowBonuses: boolean;
    maxBonusAmount: number;
    notifications: boolean;
  };
}

// Демо данные
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Telegram Bot Assistant',
    description: 'AI-powered customer support bot',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    settings: {
      allowBonuses: true,
      maxBonusAmount: 1000,
      notifications: true
    }
  }
];

/**
 * GET /api/projects/[id]
 * Получить проект по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('Fetching project:', id);

    const project = mockProjects.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Обновить проект
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Updating project:', id, body);

    const projectIndex = mockProjects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Обновляем проект
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...body,
      id, // ID не должен изменяться
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockProjects[projectIndex],
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Удалить проект
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('Deleting project:', id);

    const projectIndex = mockProjects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Удаляем проект
    const deletedProject = mockProjects.splice(projectIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedProject,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
