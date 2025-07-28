'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Coins,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserCreateDialog } from './user-create-dialog';
import type { User } from '../types';

// Демо данные
const demoUsers: User[] = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    bonusBalance: 1500,
    totalEarned: 3000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria.sidorova@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    bonusBalance: 750,
    totalEarned: 1200,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Алексей Козлов',
    email: 'alex.kozlov@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    bonusBalance: 2250,
    totalEarned: 4500,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  }
];

export function BonusManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  // Хук для уведомлений
  const { toast } = useToast();
  const router = useRouter();

  // Состояние для выбранного проекта
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  // Загрузка списка проектов
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projects = await response.json();
        console.log('Загружены проекты:', projects);
        setAvailableProjects(projects);

        // Автоматически выбираем первый активный проект
        if (projects.length > 0) {
          const activeProject =
            projects.find((p: any) => p.isActive) || projects[0];
          setCurrentProjectId(activeProject.id);
          console.log('Выбран проект:', activeProject.id, activeProject.name);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      // Fallback на известный рабочий project ID
      setCurrentProjectId('cmdkloj85000cv8o0611rblp3');
    }
  };

  // Инициализация проектов
  useEffect(() => {
    loadProjects();
  }, []);

  const loadData = async () => {
    if (!currentProjectId) {
      console.log('Project ID не установлен, ожидаем загрузки проектов...');
      return;
    }

    setIsLoading(true);
    try {
      // Загружаем реальных пользователей из API
      const usersResponse = await fetch(
        `/api/projects/${currentProjectId}/users`
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Загружены пользователи из API:', usersData); // Для отладки

        // Проверяем, что получили массив
        if (Array.isArray(usersData) && usersData.length > 0) {
          // Форматируем данные для соответствия типу User
          const formattedUsers = usersData.map((user, index) => ({
            id: user.id || `user-${index}`,
            name:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.email || `Пользователь ${index + 1}`,
            email: user.email || '',
            avatar:
              user.avatar ||
              `https://api.slingacademy.com/public/sample-users/${(index % 5) + 1}.png`,
            bonusBalance: Number(user.bonusBalance) || 0,
            totalEarned: Number(user.totalEarned) || 0,
            createdAt: new Date(
              user.registeredAt || user.createdAt || Date.now()
            ),
            updatedAt: new Date(user.updatedAt || Date.now())
          }));

          console.log('Форматированные пользователи:', formattedUsers); // Для отладки
          setUsers(formattedUsers);
        } else {
          console.log(
            'Пустой массив пользователей из API, используем демо данные'
          );
          setUsers(demoUsers);
        }
      } else {
        console.warn(
          `API недоступен (${usersResponse.status}), используем демо данные`
        );
        setUsers(demoUsers);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // В случае ошибки используем демо данные
      setUsers(demoUsers);
    } finally {
      setIsLoading(false);
    }
  };

  // Инициализация данных когда project ID установлен
  useEffect(() => {
    if (currentProjectId) {
      console.log('Загружаем данные для проекта:', currentProjectId);
      loadData();
    }
  }, [currentProjectId]); // Перезагружаем когда меняется project ID

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportData = () => {
    if (!users || users.length === 0) {
      toast({
        title: 'Предупреждение',
        description: 'Нет данных для экспорта',
        variant: 'destructive'
      });
      return;
    }

    // Создаем CSV данные
    const csvHeaders = [
      'ID',
      'Имя',
      'Email',
      'Баланс бонусов',
      'Всего заработано',
      'Дата регистрации'
    ];
    const csvData = users.map((user) => [
      user.id,
      user.name,
      user.email,
      user.bonusBalance,
      user.totalEarned,
      user.createdAt.toLocaleDateString('ru-RU')
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Создаем и скачиваем файл
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `users_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Успех',
      description: 'Данные экспортированы в CSV файл'
    });
  };

  const handleSettings = () => {
    router.push('/dashboard/projects');
    toast({
      title: 'Переход',
      description: 'Переходим к настройкам проектов'
    });
  };

  const handleAddUser = () => {
    if (!currentProjectId) {
      toast({
        title: 'Ошибка',
        description: 'Проект не выбран. Пожалуйста, подождите загрузки данных.',
        variant: 'destructive'
      });
      return;
    }
    setShowCreateUserDialog(true);
  };

  const handleCreateUserSuccess = (newUser: User) => {
    console.log('Создан новый пользователь:', newUser); // Для отладки

    // Немедленно добавляем пользователя в локальное состояние
    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    console.log('Обновленный список пользователей:', updatedUsers); // Для отладки

    // Перезагружаем данные из API для синхронизации через небольшую задержку
    setTimeout(() => {
      console.log('Перезагружаем данные из API...');
      loadData();
    }, 1000);

    toast({
      title: 'Успех',
      description: 'Пользователь успешно добавлен'
    });
  };

  // Если проект не загружен, показываем загрузку
  if (!currentProjectId && !isLoading) {
    return (
      <div className='p-6'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground'>Загрузка проектов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Заголовок и действия */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Управление бонусами
          </h1>
          <p className='text-muted-foreground'>
            Управление пользователями и их бонусными счетами
            {availableProjects.length > 0 && currentProjectId && (
              <span className='bg-muted ml-2 rounded px-2 py-1 text-sm'>
                Проект:{' '}
                {availableProjects.find((p) => p.id === currentProjectId)
                  ?.name || 'Неизвестен'}
              </span>
            )}
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <Button variant='outline' onClick={handleExportData}>
            <Download className='mr-2 h-4 w-4' />
            Экспорт
          </Button>
          <Button variant='outline' onClick={handleSettings}>
            <Settings className='mr-2 h-4 w-4' />
            Настройки
          </Button>
          <Button onClick={handleAddUser} disabled={!currentProjectId}>
            <Plus className='mr-2 h-4 w-4' />
            Добавить пользователя
          </Button>
        </div>
      </div>

      {/* Статистические карты */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего пользователей
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активные бонусы
            </CardTitle>
            <Coins className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.reduce((sum, user) => sum + user.bonusBalance, 0)}₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего заработано
            </CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.reduce((sum, user) => sum + user.totalEarned, 0)}₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Средний баланс
            </CardTitle>
            <Coins className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.length > 0
                ? Math.round(
                    users.reduce((sum, user) => sum + user.bonusBalance, 0) /
                      users.length
                  )
                : 0}
              ₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2'>
            <Search className='text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Поиск по имени или email...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='max-w-sm'
            />
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>
            Управление пользователями и их бонусными счетами (
            {filteredUsers.length} пользователей)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='bg-muted h-16 animate-pulse rounded' />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-muted-foreground'>Пользователи не найдены</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center space-x-4'>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className='h-10 w-10 rounded-full'
                    />
                    <div>
                      <p className='font-medium'>{user.name}</p>
                      <p className='text-muted-foreground text-sm'>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='text-right'>
                      <p className='font-medium'>{user.bonusBalance}₽</p>
                      <p className='text-muted-foreground text-sm'>
                        Заработано: {user.totalEarned}₽
                      </p>
                    </div>
                    <Badge variant='default'>Активен</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Уведомления об истекающих бонусах */}
      {!isLoading && users.length > 0 && (
        <Card className='border-amber-200 bg-amber-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-amber-800'>
              <AlertTriangle className='h-5 w-5' />
              Внимание: Истекающие бонусы
            </CardTitle>
            <CardDescription className='text-amber-700'>
              У некоторых пользователей есть бонусы, которые скоро истекут
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>Истекает в течение 7 дней:</span>
                <Badge
                  variant='outline'
                  className='border-amber-300 text-amber-700'
                >
                  750 бонусов у 2 пользователей
                </Badge>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span>Истекает в течение 30 дней:</span>
                <Badge
                  variant='outline'
                  className='border-amber-300 text-amber-700'
                >
                  1250 бонусов у 5 пользователей
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Тулбар массовых операций */}
      {/* <BulkActionsToolbar /> */}

      {/* Диалог создания пользователя */}
      <UserCreateDialog
        projectId={currentProjectId || ''} // Передаем текущий projectId
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        onSuccess={handleCreateUserSuccess}
      />
    </div>
  );
}
