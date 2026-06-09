/**
 * @file: use-project-users.ts
 * @description: Hook для управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: react, logger, schemas
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { validateWithSchema, createUserSchema } from '@/lib/validation/schemas';
import { formatUserDisplayName } from '@/lib/user-display';
import type { DisplayUser as User } from '../types';

interface UseProjectUsersOptions {
  projectId?: string;
  initialUsers?: User[];
  pageSize?: number;
  searchTerm?: string;
  /**
   * Фильтр по партнёрской роли (b2b-referral-hierarchy). Массив ролей
   * передаётся в API как `?role=TRAINER,MANAGER`. Когда пуст или не задан,
   * фильтр не применяется (возвращаются все роли, включая CLIENT).
   */
  roles?: Array<'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR'>;
}

interface UseProjectUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalUsers: number;
  activeUsers: number;
  totalBonuses: number;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  loadUsers: (page?: number) => Promise<void>;
  createUser: (userData: any) => Promise<User | null>;
  refreshUsers: () => Promise<void>;
  searchUsers: (term: string) => User[];
  setSearchTerm: (term: string) => void;
  exportUsers: () => void;
}

export function useProjectUsers({
  projectId,
  initialUsers = [],
  pageSize = 50,
  searchTerm = '',
  roles
}: UseProjectUsersOptions = {}): UseProjectUsersReturn {
  // Защита от ошибок инициализации - проверяем базовые типы
  if (typeof pageSize !== 'number' || pageSize <= 0) {
    console.warn(
      '[useProjectUsers] Invalid pageSize, using default:',
      pageSize
    );
    pageSize = 50;
  }

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchTerm);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBonuses: 0
  });

  // Используем статистику из API
  const totalUsers = stats.totalUsers;
  const activeUsers = stats.activeUsers;
  const totalBonuses = stats.totalBonuses;

  /**
   * Загрузка пользователей проекта
   */
  const loadUsers = useCallback(
    async (page = 1) => {
      // Дополнительная защита от ошибок инициализации
      if (
        !projectId ||
        typeof projectId !== 'string' ||
        projectId.trim() === ''
      ) {
        logger.warn(
          'Cannot load users: invalid projectId',
          { projectId, type: typeof projectId },
          'use-project-users'
        );
        return;
      }

      // Проверяем, что все необходимые зависимости инициализированы
      if (typeof pageSize !== 'number' || pageSize <= 0) {
        logger.warn(
          'Cannot load users: invalid pageSize',
          { pageSize, type: typeof pageSize },
          'use-project-users'
        );
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        logger.info(
          'Loading project users',
          { projectId, page, pageSize, searchTerm: currentSearchTerm },
          'use-project-users'
        );

        // Создаем URL с параметрами пагинации и поиска
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString()
        });

        if (currentSearchTerm.trim()) {
          params.set('search', currentSearchTerm.trim());
        }

        if (roles && roles.length > 0) {
          params.set('role', roles.join(','));
        }

        const response = await fetch(
          `/api/projects/${projectId}/users?${params}`,
          {
            cache: 'no-store' // Отключаем кеш для актуальных данных
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP Error ${response.status}`);
        }

        const payload = await response.json();

        const usersArray: any[] = Array.isArray(payload?.users)
          ? payload.users
          : [];
        const totalCount =
          payload?.pagination?.total || payload?.total || usersArray.length;
        const totalPagesCount =
          payload?.pagination?.pages ||
          payload?.totalPages ||
          Math.ceil(totalCount / pageSize);

        if (!Array.isArray(usersArray)) {
          throw new Error('Invalid response format: expected users array');
        }

        // Форматируем пользователей для корректного отображения
        const formattedUsers: User[] = usersArray.map(
          (user: any, index: number) => ({
            id: user.id || `user-${index}`,
            name: formatUserDisplayName({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              fallback: `Пользователь ${index + 1}`
            }),
            email: user.email || '',
            phone: user.phone || '',
            avatar:
              user.avatar ||
              `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
            bonusBalance: Number(Number(user.bonusBalance).toFixed(2)) || 0,
            totalEarned: Number(Number(user.totalEarned).toFixed(2)) || 0,
            createdAt: new Date(
              user.registeredAt || user.createdAt || Date.now()
            ),
            updatedAt: new Date(user.updatedAt || Date.now()),
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate ? new Date(user.birthDate) : null,
            registeredAt: user.registeredAt,
            currentLevel: user.currentLevel,
            telegramId: user.telegramId || null,
            telegramUsername: user.telegramUsername,
            isActive:
              user.isActive !== undefined ? Boolean(user.isActive) : false,
            referralCode: user.referralCode,
            totalPurchases: user.totalPurchases,
            partnerRole: user.partnerRole || 'CLIENT',
            outboundReferralPlanId: user.outboundReferralPlanId ?? null
          })
        );

        setUsers(formattedUsers);
        setCurrentPage(page);
        setTotalCount(totalCount);
        setTotalPages(totalPagesCount);

        // Сохраняем статистику из API
        if (payload?.stats) {
          setStats({
            totalUsers: payload.stats.totalUsers || totalCount,
            activeUsers: payload.stats.activeUsers || 0,
            totalBonuses: payload.stats.totalBonuses || 0
          });
        }

        logger.info(
          'Project users loaded successfully',
          {
            projectId,
            count: formattedUsers.length,
            totalUsers: totalCount,
            page,
            totalPages: totalPagesCount,
            searchTerm: currentSearchTerm
          },
          'use-project-users'
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);

        logger.error(
          'Failed to load project users',
          {
            projectId,
            error: errorMessage
          },
          'use-project-users'
        );

        // В случае ошибки используем демо данные в development
        if (process.env.NODE_ENV === 'development') {
          setUsers(getDemoUsers());
          logger.warn(
            'Using demo data due to API error',
            { projectId },
            'use-project-users'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, pageSize, currentSearchTerm, roles?.join(',') ?? '']
  );

  /**
   * Создание нового пользователя
   */
  const createUser = useCallback(
    async (userData: any): Promise<User | null> => {
      if (!projectId) {
        logger.warn(
          'Cannot create user: projectId not provided',
          {},
          'use-project-users'
        );
        return null;
      }

      try {
        // Валидируем данные перед отправкой
        const validatedData = validateWithSchema(createUserSchema, {
          ...userData,
          projectId
        });

        logger.info(
          'Creating new user',
          {
            projectId,
            email: validatedData.email,
            phone: validatedData.phone
          },
          'use-project-users'
        );

        const response = await fetch(`/api/projects/${projectId}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create user');
        }

        const newUser = await response.json();

        // Добавляем нового пользователя в локальное состояние
        const formattedUser: User = {
          id: newUser.id,
          name:
            `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() ||
            'Без имени',
          email: newUser.email || '',
          phone: newUser.phone || '',
          avatar: `https://api.slingacademy.com/public/sample-users/${Math.floor(Math.random() * 10) + 1}.png`,
          bonusBalance: 0,
          totalEarned: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setUsers((prev) => [formattedUser, ...prev]);

        logger.info(
          'User created successfully',
          {
            projectId,
            userId: newUser.id,
            email: newUser.email
          },
          'use-project-users'
        );

        // Перезагружаем данные для синхронизации
        setTimeout(() => loadUsers(), 1500);

        return formattedUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        logger.error(
          'Failed to create user',
          {
            projectId,
            error: errorMessage,
            userData: { ...userData, projectId: undefined } // Убираем projectId из логов
          },
          'use-project-users'
        );

        throw new Error(errorMessage);
      }
    },
    [projectId, loadUsers]
  );

  /**
   * Обновление списка пользователей
   */
  const refreshUsers = useCallback(async () => {
    logger.info('Refreshing users list', { projectId }, 'use-project-users');
    await loadUsers();
  }, [loadUsers, projectId]);

  /**
   * Поиск пользователей
   */
  const searchUsers = useCallback(
    (term: string): User[] => {
      // Теперь поиск работает через API, эта функция просто возвращает текущих пользователей
      return users;
    },
    [users]
  );

  const setSearchTerm = useCallback((term: string) => {
    setCurrentSearchTerm(term);
  }, []);

  /**
   * Экспорт пользователей в CSV
   */
  const exportUsers = useCallback(() => {
    try {
      logger.info(
        'Exporting users to CSV',
        { projectId, count: users.length },
        'use-project-users'
      );

      const headers = [
        'Имя',
        'Email',
        'Баланс бонусов',
        'Всего заработано',
        'Дата регистрации'
      ];
      const csvData = users.map((user) => [
        user.name,
        user.email,
        user.bonusBalance,
        user.totalEarned,
        user.createdAt.toLocaleDateString('ru-RU')
      ]);

      const csvContent = [headers, ...csvData]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `users_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.info(
        'Users exported successfully',
        { projectId, count: users.length },
        'use-project-users'
      );
    } catch (error) {
      logger.error(
        'Failed to export users',
        {
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'use-project-users'
      );

      throw new Error('Не удалось экспортировать данные');
    }
  }, [users, projectId]);

  // Загружаем пользователей при изменении projectId или searchTerm
  useEffect(() => {
    if (projectId) {
      // При изменении поискового запроса возвращаемся на первую страницу
      loadUsers(1);
    }
  }, [projectId, currentSearchTerm, loadUsers]);

  return {
    users,
    isLoading,
    error,
    totalUsers: totalCount,
    activeUsers,
    totalBonuses,
    currentPage,
    totalPages,
    totalCount,
    loadUsers,
    createUser,
    refreshUsers,
    searchUsers,
    setSearchTerm,
    exportUsers
  };
}

/**
 * Демо данные для development
 */
function getDemoUsers(): User[] {
  return [
    {
      id: 'demo-1',
      name: 'Иван Петров',
      email: 'ivan.petrov@example.com',
      avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
      bonusBalance: 1500,
      totalEarned: 3000,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'demo-2',
      name: 'Мария Сидорова',
      email: 'maria.sidorova@example.com',
      avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
      bonusBalance: 750,
      totalEarned: 1200,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    }
  ];
}
