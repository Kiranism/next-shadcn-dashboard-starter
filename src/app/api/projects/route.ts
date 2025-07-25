import { NextRequest, NextResponse } from 'next/server';

// Типы данных
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

// Демо данные проектов
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
  },
  {
    id: '2',
    name: 'E-commerce Integration',
    description: 'Online store management system',
    status: 'active',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
    settings: {
      allowBonuses: true,
      maxBonusAmount: 5000,
      notifications: false
    }
  }
];

/**
 * GET /api/projects
 * Получить список всех проектов
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Fetching projects:', { status, limit, offset });

    let filteredProjects = [...mockProjects];

    // Фильтрация по статусу
    if (status) {
      filteredProjects = filteredProjects.filter((p) => p.status === status);
    }

    // Пагинация
    const paginatedProjects = filteredProjects.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        total: filteredProjects.length,
        limit,
        offset,
        hasMore: offset + limit < filteredProjects.length
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Создать новый проект
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProject: Project = {
      id: Date.now().toString(),
      name: body.name || 'Untitled Project',
      description: body.description || '',
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowBonuses: body.settings?.allowBonuses ?? true,
        maxBonusAmount: body.settings?.maxBonusAmount ?? 1000,
        notifications: body.settings?.notifications ?? true
      }
    };

    console.log('Creating new project:', newProject);

    // В реальном проекте здесь была бы запись в БД
    mockProjects.push(newProject);

    return NextResponse.json(
      {
        success: true,
        data: newProject,
        message: 'Project created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
