/**
 * @file: src/features/projects/components/project-users-view.tsx
 * @description: Компонент управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: React, data table components
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Search,
  Gift,
  Minus,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  Badge as BadgeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import type { Project, User, Bonus } from '@/types/bonus';
import { UserCreateDialog } from './user-create-dialog';
import { BonusAwardDialog } from './bonus-award-dialog';

interface ProjectUsersViewProps {
  projectId: string;
}

interface UserWithBonuses extends User {
  totalBonuses: number;
  activeBonuses: number;
  lastActivity: Date | null;
}

export function ProjectUsersView({ projectId }: ProjectUsersViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserWithBonuses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBonuses | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем проект
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Загружаем пользователей
      const usersResponse = await fetch(`/api/projects/${projectId}/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUser = (newUser: UserWithBonuses) => {
    setUsers(prev => [newUser, ...prev]);
    toast({
      title: 'Успех',
      description: 'Пользователь успешно добавлен',
    });
  };

  const handleBonusSuccess = () => {
    loadData(); // Перезагружаем данные для обновления балансов
    setSelectedUser(null);
  };

  const handleOpenBonusDialog = (user: UserWithBonuses) => {
    setSelectedUser(user);
    setShowBonusDialog(true);
  };

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.telegramUsername?.toLowerCase().includes(query)
    );
  });

  // Колонки для таблицы
  const columns: ColumnDef<UserWithBonuses>[] = [
    {
      id: 'user',
      header: 'Пользователь',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <div className="font-medium">
                {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Без имени'}
              </div>
              <div className="text-sm text-muted-foreground">
                {user.email || user.phone || `ID: ${user.id.slice(0, 8)}...`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: 'Контакты',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="space-y-1">
            {user.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {user.phone}
              </div>
            )}
            {user.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {user.email}
              </div>
            )}
            {user.telegramUsername && (
              <div className="flex items-center text-sm">
                <BadgeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                @{user.telegramUsername}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'bonuses',
      header: 'Бонусы',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600">
              {user.activeBonuses}₽
            </div>
            <div className="text-sm text-muted-foreground">
              Всего: {user.totalBonuses}₽
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Статус',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="space-y-1">
            <Badge variant={user.isActive ? 'default' : 'secondary'}>
              {user.isActive ? 'Активен' : 'Неактивен'}
            </Badge>
            {user.telegramId && (
              <Badge variant="outline">Telegram</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'dates',
      header: 'Даты',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Рег: {new Date(user.registeredAt).toLocaleDateString('ru-RU')}
            </div>
            {user.lastActivity && (
              <div>
                Активность: {new Date(user.lastActivity).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Действия',
      accessorFn: (user: UserWithBonuses) => user,
      cell: ({ getValue }: any) => {
        const user = getValue() as UserWithBonuses;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenBonusDialog(user)}
            >
              <Gift className="h-4 w-4 mr-1" />
              Начислить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Реализовать списание бонусов
                toast({
                  title: 'В разработке',
                  description: 'Функция списания бонусов будет добавлена',
                });
              }}
            >
              <Minus className="h-4 w-4 mr-1" />
              Списать
            </Button>
          </div>
        );
      },
         },
   ];

   // Создаем table с помощью useDataTable hook
   const { table } = useDataTable({
     data: filteredUsers,
     columns,
     pageCount: Math.ceil(filteredUsers.length / 10),
     shallow: false,
     debounceMs: 500
   });

   if (loading) {
    return (
      <div className="flex flex-1 flex-col space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к проектам
          </Button>
          <div>
            <Heading
              title={`Пользователи: ${project?.name || 'Проект'}`}
              description={`Управление пользователями и их бонусами (${filteredUsers.length} пользователей)`}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateUserDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего бонусов</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + (user.totalBonuses || 0), 0)}₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных бонусов</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + (user.activeBonuses || 0), 0)}₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>
            Управление пользователями проекта и их бонусными счетами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable table={table}>
            <DataTableToolbar table={table} />
          </DataTable>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserCreateDialog
        projectId={projectId}
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        onSuccess={handleCreateUser}
      />

      {selectedUser && (
        <BonusAwardDialog
          projectId={projectId}
          userId={selectedUser.id}
          userName={selectedUser.firstName || selectedUser.lastName ? 
            `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() : 
            'Без имени'
          }
          userContact={selectedUser.email || selectedUser.phone || `ID: ${selectedUser.id.slice(0, 8)}...`}
          open={showBonusDialog}
          onOpenChange={setShowBonusDialog}
          onSuccess={handleBonusSuccess}
        />
      )}
    </div>
  );
} 