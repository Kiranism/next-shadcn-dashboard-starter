'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useBonusStore } from '../stores/bonus-store';
import { UsersTable } from './users-table';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { BonusStatsCards } from './bonus-stats-cards';
import type { User, BonusTransaction, BonusStats } from '../types';

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
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria.sidorova@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    bonusBalance: 750,
    totalEarned: 1200,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Алексей Иванов',
    email: 'alexey.ivanov@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    bonusBalance: 2250,
    totalEarned: 4500,
    createdAt: new Date('2023-12-10'),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Елена Козлова',
    email: 'elena.kozlova@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    bonusBalance: 0,
    totalEarned: 800,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Дмитрий Волков',
    email: 'dmitry.volkov@example.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    bonusBalance: 320,
    totalEarned: 950,
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date(),
  },
];

const demoTransactions: BonusTransaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'EARN',
    amount: 500,
    description: 'Бонус за покупку на сумму 5000₽',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: '1',
    type: 'EARN',
    amount: 1000,
    description: 'Приветственный бонус',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: '2',
    type: 'EARN',
    amount: 250,
    description: 'Бонус за отзыв',
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    userId: '2',
    type: 'SPEND',
    amount: -700,
    description: 'Списание за заказ #12345',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const demoStats: BonusStats = {
  totalUsers: 5,
  totalActiveBonuses: 4820,
  totalExpiredThisMonth: 1200,
  averageBalance: 964,
  totalEarnedThisMonth: 2800,
  totalSpentThisMonth: 1650,
};

export function BonusManagementPage() {
  const { 
    users, 
    setUsers, 
    setTransactions, 
    setStats, 
    selectedUsers,
    clearSelection 
  } = useBonusStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Инициализация демо данных
  useEffect(() => {
    const initializeDemoData = async () => {
      setIsLoading(true);
      
      // Симуляция загрузки данных
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(demoUsers);
      setTransactions(demoTransactions);
      setStats(demoStats);
      setIsLoading(false);
    };

    initializeDemoData();
  }, [setUsers, setTransactions, setStats]);

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportData = () => {
    const csvData = users.map(user => ({
      'Имя': user.name,
      'Email': user.email,
      'Баланс бонусов': user.bonusBalance,
      'Всего заработано': user.totalEarned,
      'Дата регистрации': user.createdAt.toLocaleDateString('ru-RU'),
      'Последнее обновление': user.updatedAt.toLocaleDateString('ru-RU'),
    }));
    
    console.log('Экспорт данных:', csvData);
    // Здесь была бы реальная логика экспорта в CSV
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Управление бонусами</h1>
          <p className="text-muted-foreground">
            Управляйте бонусными программами и балансами пользователей
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>
      </div>

      {/* Статистические карты */}
      <BonusStatsCards isLoading={isLoading} />

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Пользователи
              </CardTitle>
              <CardDescription>
                Всего пользователей: {users.length}
                {selectedUsers.length > 0 && (
                  <span className="ml-2">
                    • Выбрано: <Badge variant="secondary">{selectedUsers.length}</Badge>
                  </span>
                )}
              </CardDescription>
            </div>
            
            {selectedUsers.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Снять выделение
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Поиск */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Таблица пользователей */}
          <UsersTable users={filteredUsers} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Уведомления об истекающих бонусах */}
      {!isLoading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Внимание: Истекающие бонусы
            </CardTitle>
            <CardDescription className="text-amber-700">
              У некоторых пользователей есть бонусы, которые скоро истекут
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Истекает в течение 7 дней:</span>
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  750 бонусов у 2 пользователей
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Истекает завтра:</span>
                <Badge variant="destructive">
                  250 бонусов у 1 пользователя
                </Badge>
              </div>
            </div>
            <Button size="sm" className="mt-3" variant="outline">
              Отправить уведомления
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Тулбар массовых операций */}
      <BulkActionsToolbar />
    </div>
  );
}