// Типизация восстановлена для обеспечения безопасности типов

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  Project
} from '@/types/bonus';

export class ProjectService {
  // Создание нового проекта
  static async createProject(data: CreateProjectInput): Promise<Project> {
    const project = await db.project.create({
      data: {
        name: data.name,
        domain: data.domain,
        bonusPercentage: data.bonusPercentage || 1.0,
        bonusExpiryDays: data.bonusExpiryDays || 365
      },
      include: {
        botSettings: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return project as any;
  }

  // Получение проекта по ID
  static async getProjectById(id: string): Promise<Project | null> {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        botSettings: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return project as any;
  }

  // Получение проекта по webhook secret
  static async getProjectByWebhookSecret(
    webhookSecret: string
  ): Promise<Project | null> {
    try {
      logger.info('ProjectService: поиск проекта по webhook secret', {
        webhookSecret,
        component: 'project-service'
      });

      // Сначала проверим подключение к БД
      await db.$queryRaw`SELECT 1`;

      let project = await db.project.findUnique({
        where: { webhookSecret },
        include: {
          botSettings: true,
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      // Fallback: если findUnique не нашел, попробуем findFirst
      if (!project) {
        logger.warn('ProjectService: findUnique не нашел, пробуем findFirst', {
          webhookSecret,
          component: 'project-service'
        });

        project = await db.project.findFirst({
          where: { webhookSecret },
          include: {
            botSettings: true,
            _count: {
              select: {
                users: true
              }
            }
          }
        });
      }

      if (project) {
        logger.info('ProjectService: проект найден', {
          projectId: project.id,
          projectName: project.name,
          webhookSecret,
          component: 'project-service'
        });
      } else {
        logger.warn('ProjectService: проект не найден', {
          webhookSecret,
          component: 'project-service'
        });

        // Попробуем найти любые проекты для отладки
        const allProjects = await db.project.findMany({
          select: {
            id: true,
            name: true,
            webhookSecret: true
          },
          take: 5
        });

        logger.info('ProjectService: существующие проекты (первые 5)', {
          projects: allProjects.map((p) => ({
            id: p.id,
            name: p.name,
            webhookSecret: p.webhookSecret
          })),
          component: 'project-service'
        });
      }

      return project as any;
    } catch (error) {
      logger.error('ProjectService: ошибка при поиске проекта', {
        webhookSecret,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'project-service'
      });
      throw error;
    }
  }

  // Получение проекта по домену
  static async getProjectByDomain(domain: string): Promise<Project | null> {
    const project = await db.project.findUnique({
      where: { domain },
      include: {
        botSettings: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return project as any;
  }

  // Получение всех проектов с пагинацией
  static async getProjects(
    page = 1,
    limit = 10
  ): Promise<{ projects: Project[]; total: number }> {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      db.project.findMany({
        skip,
        take: limit,
        include: {
          botSettings: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.project.count()
    ]);

    return { projects: projects as any, total };
  }

  // Обновление проекта
  static async updateProject(
    id: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    const project = await db.project.update({
      where: { id },
      data,
      include: {
        botSettings: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return project as any;
  }

  // Деактивация проекта
  static async deactivateProject(id: string): Promise<Project> {
    const project = await db.project.update({
      where: { id },
      data: { isActive: false },
      include: {
        botSettings: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return project as any;
  }

  // Получение статистики проекта
  static async getProjectStats(projectId: string) {
    const [users, bonuses, transactions, activeBonuses, expiredBonuses] =
      await Promise.all([
        db.user.count({
          where: { projectId, isActive: true }
        }),
        db.bonus.count({
          where: { user: { projectId } }
        }),
        db.transaction.count({
          where: { user: { projectId } }
        }),
        db.bonus.count({
          where: {
            user: { projectId },
            isUsed: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          }
        }),
        db.bonus.count({
          where: {
            user: { projectId },
            expiresAt: { lt: new Date() },
            isUsed: false
          }
        })
      ]);

    const spentBonuses = await db.transaction.aggregate({
      where: {
        user: { projectId },
        type: 'SPEND'
      },
      _sum: {
        amount: true
      }
    });

    return {
      totalUsers: users,
      totalBonuses: bonuses,
      totalTransactions: transactions,
      activeBonuses,
      expiredBonuses,
      spentBonuses: Number(spentBonuses._sum.amount || 0)
    };
  }
}
