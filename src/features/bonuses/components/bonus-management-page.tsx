/**
 * @file: bonus-management-page-refactored.tsx
 * @description: Улучшенная версия страницы управления бонусами
 * @project: SaaS Bonus System
 * @dependencies: react, hooks, ui components
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Download,
  Settings,
  Plus,
  RefreshCw,
  AlertCircle,
  Users,
  Filter,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Hooks
import { useProjects } from '../hooks/use-projects';
import { useProjectUsers } from '../hooks/use-project-users';

// Components
import { BonusStatsCards } from './bonus-stats-cards';
import { UserCreateDialog } from './user-create-dialog';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { EnhancedBulkActionsToolbar } from './enhanced-bulk-actions-toolbar';
import { RichNotificationDialog } from './rich-notification-dialog';

// Types
import type { User } from '../types';

interface BonusManagementPageProps {
  className?: string;
}

export function BonusManagementPageRefactored({
  className
}: BonusManagementPageProps = {}) {
  const router = useRouter();
  const { toast } = useToast();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showRichNotificationDialog, setShowRichNotificationDialog] =
    useState(false);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Custom hooks
  const {
    projects,
    currentProjectId,
    currentProject,
    isLoading: projectsLoading,
    error: projectsError,
    selectProject
  } = useProjects({
    autoSelectFirst: true,
    fallbackProjectId: 'cmdkloj85000cv8o0611rblp3' // Fallback project ID
  });

  const {
    users,
    isLoading: usersLoading,
    error: usersError,
    totalUsers,
    activeUsers,
    totalBonuses,
    createUser,
    refreshUsers,
    searchUsers,
    exportUsers
  } = useProjectUsers({
    projectId: currentProjectId || undefined
  });

  // Memoized values
  const filteredUsers = useMemo(() => {
    return searchUsers(searchTerm);
  }, [searchUsers, searchTerm]);

  const statsData = useMemo(
    () => ({
      totalUsers,
      activeUsers,
      totalBonuses,
      expiringSoonBonuses: Math.floor(totalBonuses * 0.15), // Mock для демо
      monthlyGrowth: 12 // Mock для демо
    }),
    [totalUsers, activeUsers, totalBonuses]
  );

  const isLoading = projectsLoading || usersLoading;
  const hasError = projectsError || usersError;

  // Event handlers
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setSelectedUsers(new Set()); // Сбрасываем выбор при поиске

      logger.debug(
        'Users search performed',
        {
          searchTerm: term,
          resultsCount: searchUsers(term).length,
          projectId: currentProjectId
        },
        'bonus-management'
      );
    },
    [searchUsers, currentProjectId]
  );

  const handleUserSelection = useCallback(
    (userId: string, selected: boolean) => {
      setSelectedUsers((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    },
    []
  );

  const openHistory = useCallback(
    async (userId: string, page = 1) => {
      if (!currentProjectId) return;
      setHistoryLoading(true);
      setHistoryUserId(userId);
      try {
        const res = await fetch(
          `/api/projects/${currentProjectId}/users/${userId}/bonuses?page=${page}&limit=20`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        setHistoryItems(data?.transactions || []);
        setHistoryTotal(data?.pagination?.total || 0);
        setHistoryPage(page);
      } finally {
        setHistoryLoading(false);
      }
    },
    [currentProjectId]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
      } else {
        setSelectedUsers(new Set());
      }
    },
    [filteredUsers]
  );

  const handleCreateUser = useCallback(
    async (userData: any) => {
      try {
        // Если пришёл уже созданный пользователь (из диалога), не создаём повторно
        const alreadyCreated = userData && typeof userData.id === 'string';

        if (!alreadyCreated) {
          logger.info(
            'Creating new user',
            { projectId: currentProjectId },
            'bonus-management'
          );
          await createUser(userData);
        }

        await refreshUsers();
        setShowCreateUserDialog(false);

        toast({
          title: 'Пользователь создан',
          description: `Пользователь ${userData.firstName || userData.email} успешно добавлен`
        });

        logger.info(
          'User created successfully',
          {
            projectId: currentProjectId,
            userEmail: userData.email
          },
          'bonus-management'
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        toast({
          title: 'Ошибка создания пользователя',
          description: errorMessage,
          variant: 'destructive'
        });

        logger.error(
          'Failed to create user',
          {
            projectId: currentProjectId,
            error: errorMessage
          },
          'bonus-management'
        );
      }
    },
    [createUser, refreshUsers, currentProjectId, toast]
  );

  const handleExport = useCallback(async () => {
    try {
      logger.info(
        'Exporting users',
        {
          projectId: currentProjectId,
          count: users.length
        },
        'bonus-management'
      );

      await exportUsers();

      toast({
        title: 'Экспорт завершен',
        description: `Данные ${users.length} пользователей экспортированы в CSV`
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: 'Ошибка экспорта',
        description: errorMessage,
        variant: 'destructive'
      });

      logger.error(
        'Failed to export users',
        {
          projectId: currentProjectId,
          error: errorMessage
        },
        'bonus-management'
      );
    }
  }, [exportUsers, users.length, currentProjectId, toast]);

  const handleRefresh = useCallback(async () => {
    try {
      logger.info(
        'Refreshing users data',
        { projectId: currentProjectId },
        'bonus-management'
      );

      await refreshUsers();
      setSelectedUsers(new Set()); // Сбрасываем выбор

      toast({
        title: 'Данные обновлены',
        description: 'Список пользователей успешно обновлен'
      });
    } catch (error) {
      toast({
        title: 'Ошибка обновления',
        description: 'Не удалось обновить данные',
        variant: 'destructive'
      });
    }
  }, [refreshUsers, currentProjectId, toast]);

  const handleProjectSettings = useCallback(() => {
    if (currentProjectId) {
      router.push(`/dashboard/projects/${currentProjectId}/settings`);
    }
  }, [currentProjectId, router]);

  // Render error state
  if (hasError && !isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{projectsError || usersError}</AlertDescription>
        </Alert>

        <div className='flex justify-center'>
          <Button onClick={() => window.location.reload()} variant='outline'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className ?? ''}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Управление бонусами
          </h1>
          <p className='text-muted-foreground'>
            {currentProject
              ? `Проект: ${currentProject.name}`
              : 'Управление пользователями и бонусной программой'}
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          {projects.length > 1 && (
            <select
              value={currentProjectId || ''}
              onChange={(e) => selectProject(e.target.value)}
              className='rounded-md border px-3 py-2 text-sm'
              disabled={isLoading}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Обновить
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <BonusStatsCards
        stats={statsData}
        isLoading={isLoading}
        error={hasError ? projectsError || usersError : null}
      />

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center space-x-2'>
                <Users className='h-5 w-5' />
                <span>Пользователи</span>
                {!isLoading && (
                  <Badge variant='secondary'>
                    {filteredUsers.length} из {totalUsers}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Управление пользователями бонусной программы
              </CardDescription>
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className='mr-2 h-4 w-4' />
                Фильтры
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={handleExport}
                disabled={users.length === 0 || isLoading}
              >
                <Download className='mr-2 h-4 w-4' />
                Скачать
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={handleProjectSettings}
                disabled={!currentProjectId}
              >
                <Settings className='mr-2 h-4 w-4' />
                Настройки
              </Button>

              <Button
                size='sm'
                onClick={() => setShowCreateUserDialog(true)}
                disabled={!currentProjectId}
              >
                <Plus className='mr-2 h-4 w-4' />
                Добавить пользователя
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className='flex items-center space-x-4'>
            <div className='relative max-w-sm flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='Поиск по имени, email или телефону...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='pl-10'
                disabled={isLoading}
              />
            </div>

            {selectedUsers.size > 0 && (
              <Badge variant='default'>Выбрано: {selectedUsers.size}</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Подсказка по рассылкам */}
          {filteredUsers.length > 0 && selectedUsers.size === 0 && (
            <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='flex items-center gap-2 text-sm text-blue-700'>
                <MessageSquare className='h-4 w-4' />
                <span className='font-medium'>💡 Как отправить рассылку:</span>
              </div>
              <p className='mt-1 text-sm text-blue-600'>
                1. Выберите пользователей (поставьте галочки) 2. Снизу появится
                панель с кнопкой &quot;Уведомления&quot; 3. Выберите &quot;📢
                Расширенные уведомления&quot; для отправки рассылок с картинками
                и кнопками
              </p>
            </div>
          )}

          {/* Users List */}
          <UsersDisplayArea
            users={filteredUsers}
            selectedUsers={selectedUsers}
            isLoading={isLoading}
            onUserSelection={handleUserSelection}
            onSelectAll={handleSelectAll}
            onOpenHistory={openHistory}
          />
        </CardContent>
      </Card>

      {/* Enhanced Bulk Actions Toolbar */}
      <EnhancedBulkActionsToolbar
        selectedUserIds={Array.from(selectedUsers)}
        selectedCount={selectedUsers.size}
        onClearSelection={() => setSelectedUsers(new Set())}
        onShowRichNotifications={() => setShowRichNotificationDialog(true)}
      />

      {/* Create User Dialog */}
      <UserCreateDialog
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        onSuccess={handleCreateUser}
        projectId={currentProjectId || ''}
      />

      {/* Rich Notification Dialog */}
      <RichNotificationDialog
        open={showRichNotificationDialog}
        onOpenChange={setShowRichNotificationDialog}
        selectedUserIds={Array.from(selectedUsers)}
        projectId={currentProjectId || ''}
      />

      {/* История операций пользователя */}
      <Dialog
        open={!!historyUserId}
        onOpenChange={(o) => !o && setHistoryUserId(null)}
      >
        <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>История операций</DialogTitle>
          </DialogHeader>
          <div className='flex-1 overflow-hidden'>
            {historyLoading ? (
              <div className='text-muted-foreground p-6 text-sm'>Загрузка…</div>
            ) : historyItems.length === 0 ? (
              <div className='text-muted-foreground p-6 text-sm'>
                Нет операций
              </div>
            ) : (
              <div className='space-y-3 h-full flex flex-col'>
                <div className='flex-1 overflow-auto border rounded-lg'>
                  <Table>
                    <TableHeader className='sticky top-0 bg-background z-10'>
                      <TableRow>
                        <TableHead className='w-[160px]'>Дата</TableHead>
                        <TableHead className='w-[120px] text-center'>
                          Тип
                        </TableHead>
                        <TableHead className='w-[120px] text-right'>
                          Сумма
                        </TableHead>
                        <TableHead className='min-w-[250px]'>Описание</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className='text-sm'>
                            {new Date(t.createdAt).toLocaleString('ru-RU')}
                          </TableCell>
                          <TableCell className='text-center'>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                t.type === 'EARN'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {t.type === 'EARN' ? 'Начисление' : 'Списание'}
                            </span>
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            {t.type === 'EARN' ? '+' : '-'}
                            {Number(t.amount).toFixed(2)}₽
                          </TableCell>
                          <TableCell
                            className='text-sm break-words'
                            title={t.description || ''}
                          >
                            {t.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className='flex items-center justify-between border-t pt-4 text-sm'>
                  <span className='text-muted-foreground'>
                    Показано{' '}
                    {historyItems.length > 0 ? (historyPage - 1) * 20 + 1 : 0}–
                    {historyItems.length > 0
                      ? Math.min(historyPage * 20, historyTotal)
                      : 0}{' '}
                    из {historyTotal}
                  </span>
                  <div className='space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={historyPage <= 1}
                      onClick={() => openHistory(historyUserId!, historyPage - 1)}
                    >
                      Назад
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={historyPage * 20 >= historyTotal}
                      onClick={() => openHistory(historyUserId!, historyPage + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Компонент отображения списка пользователей
 */
interface UsersDisplayAreaProps {
  users: User[];
  selectedUsers: Set<string>;
  isLoading: boolean;
  onUserSelection: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onOpenHistory: (userId: string) => void;
}

const UsersDisplayArea = memo<UsersDisplayAreaProps>(
  ({
    users,
    selectedUsers,
    isLoading,
    onUserSelection,
    onSelectAll,
    onOpenHistory
  }) => {
    if (isLoading) {
      return (
        <div className='space-y-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='p-4'>
              <div className='flex items-center space-x-4'>
                <div className='bg-muted h-10 w-10 animate-pulse rounded-full' />
                <div className='flex-1 space-y-2'>
                  <div className='bg-muted h-4 w-48 animate-pulse rounded' />
                  <div className='bg-muted h-3 w-32 animate-pulse rounded' />
                </div>
                <div className='bg-muted h-6 w-16 animate-pulse rounded' />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className='py-12 text-center'>
          <Users className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
          <h3 className='mb-2 text-lg font-semibold'>
            Пользователей не найдено
          </h3>
          <p className='text-muted-foreground mb-4'>
            Попробуйте изменить условия поиска или добавьте первого пользователя
          </p>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        {/* Select All Control */}
        <div className='flex items-center space-x-2 border-b p-2'>
          <input
            type='checkbox'
            checked={selectedUsers.size === users.length && users.length > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className='rounded border-gray-300'
          />
          <span className='text-muted-foreground text-sm'>
            Выбрать все ({users.length})
          </span>
        </div>

        {/* Users List */}
        <div className='grid gap-4'>
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              selected={selectedUsers.has(user.id)}
              onSelectionChange={(selected) =>
                onUserSelection(user.id, selected)
              }
              onOpenHistory={() => onOpenHistory(user.id)}
            />
          ))}
        </div>
      </div>
    );
  }
);

UsersDisplayArea.displayName = 'UsersDisplayArea';

/**
 * Компонент карточки пользователя
 */
interface UserCardProps {
  user: User;
  selected: boolean;
  onSelectionChange: (selected: boolean) => void;
  onOpenHistory: () => void;
}

const UserCard = memo<UserCardProps>(
  ({ user, selected, onSelectionChange, onOpenHistory }) => {
    const isActive = user.bonusBalance > 0;

    return (
      <Card
        className={`transition-all duration-200 ${selected ? 'ring-primary ring-2' : ''}`}
      >
        <CardContent className='p-4'>
          <div className='flex items-center space-x-4'>
            <input
              type='checkbox'
              checked={selected}
              onChange={(e) => onSelectionChange(e.target.checked)}
              className='rounded border-gray-300'
            />

            <Image
              src={user.avatar || '/default-avatar.png'}
              alt={user.name}
              width={40}
              height={40}
              className='h-10 w-10 rounded-full object-cover'
            />

            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <h4 className='font-medium'>{user.name}</h4>
                {isActive && <Badge variant='default'>Активный</Badge>}
              </div>
              <div className='text-muted-foreground space-y-1 text-sm'>
                <div>{user.email}</div>
                {user.phone && <div>{user.phone}</div>}
                <div>
                  Регистрация: {user.createdAt.toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>

            <div className='text-right'>
              <div className='text-lg font-semibold'>
                {Number(user.bonusBalance).toFixed(2)}₽
              </div>
              <div className='text-muted-foreground text-sm'>
                Заработано: {Number(user.totalEarned).toFixed(2)}₽
              </div>
              <div className='mt-2'>
                <Button variant='outline' size='sm' onClick={onOpenHistory}>
                  История
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

UserCard.displayName = 'UserCard';

export default BonusManagementPageRefactored;
