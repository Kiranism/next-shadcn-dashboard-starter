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
import type { User } from '../types';

interface UseProjectUsersOptions {
  projectId?: string;
  initialUsers?: User[];
}

interface UseProjectUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalUsers: number;
  activeUsers: number;
  totalBonuses: number;

  // Actions
  loadUsers: () => Promise<void>;
  createUser: (userData: any) => Promise<User | null>;
  refreshUsers: () => Promise<void>;
  searchUsers: (term: string) => User[];
  exportUsers: () => void;
}

export function useProjectUsers({
  projectId,
  initialUsers = []
}: UseProjectUsersOptions = {}): UseProjectUsersReturn {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Производные состояния
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.bonusBalance > 0).length;
  const totalBonuses = users.reduce((sum, user) => sum + user.bonusBalance, 0);

  /**
   * Загрузка пользователей проекта
   */
  const loadUsers = useCallback(async () => {
    if (!projectId) {
      logger.warn(
        'Cannot load users: projectId not provided',
        {},
        'use-project-users'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('Loading project users', { projectId }, 'use-project-users');

      const response = await fetch(`/api/projects/${projectId}/users`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      const payload = await response.json();

      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
          ? payload.users
          : [];

      if (!Array.isArray(list)) {
        throw new Error('Invalid response format: expected users array');
      }

      // Форматируем пользователей для корректного отображения
      const formattedUsers: User[] = list.map((user: any, index: number) => ({
        id: user.id || `user-${index}`,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.email || `Пользователь ${index + 1}`,
        email: user.email || '',
        phone: user.phone || '',
        avatar:
          user.avatar ||
          `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
        bonusBalance: Number(user.bonusBalance) || 0,
        totalEarned: Number(user.totalEarned) || 0,
        createdAt: new Date(user.registeredAt || user.createdAt || Date.now()),
        updatedAt: new Date(user.updatedAt || Date.now()),
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        registeredAt: user.registeredAt,
        currentLevel: user.currentLevel
      }));

      setUsers(formattedUsers);

      logger.info(
        'Project users loaded successfully',
        {
          projectId,
          count: formattedUsers.length,
          totalBonuses: formattedUsers.reduce(
            (sum, user) => sum + user.bonusBalance,
            0
          )
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
  }, [projectId]);

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
      if (!term.trim()) return users;

      const searchTerm = term.toLowerCase();
      return users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
      );
    },
    [users]
  );

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

  // Загружаем пользователей при изменении projectId
  useEffect(() => {
    if (projectId) {
      loadUsers();
    }
  }, [projectId, loadUsers]);

  return {
    users,
    isLoading,
    error,
    totalUsers,
    activeUsers,
    totalBonuses,
    loadUsers,
    createUser,
    refreshUsers,
    searchUsers,
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
