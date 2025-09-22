/**
 * @file: project-logs-view.tsx
 * @description: Компонент для отображения логов webhook интеграции
 * @project: SaaS Bonus System
 * @dependencies: React, UI components, API
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { WebhookLogEntry } from '@/types/api-responses';

interface ProjectLogsViewProps {
  params: Promise<{ id: string }>;
  embedded?: boolean;
}

export function ProjectLogsView({
  params,
  embedded = false
}: ProjectLogsViewProps) {
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<WebhookLogEntry | null>(null);
  const resolvedParams = useParams();
  const projectId = resolvedParams?.id as string;

  useEffect(() => {
    if (!projectId) return;
    loadLogs();
  }, [projectId]);

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/projects/${projectId}/integration/logs?limit=50`
      );
      if (!response.ok) throw new Error('Failed to load logs');

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Ошибка загрузки логов'
      );
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function getStatusBadge(status: number) {
    if (status >= 200 && status < 300) {
      return (
        <Badge variant='default' className='bg-green-100 text-green-800'>
          {status}
        </Badge>
      );
    } else if (status >= 400 && status < 500) {
      return <Badge variant='destructive'>{status}</Badge>;
    } else if (status >= 500) {
      return (
        <Badge variant='destructive' className='bg-red-100 text-red-800'>
          {status}
        </Badge>
      );
    }
    return <Badge variant='secondary'>{status}</Badge>;
  }

  function getSuccessBadge(success: boolean) {
    return success ? (
      <Badge variant='default' className='bg-green-100 text-green-800'>
        <CheckCircle className='mr-1 h-3 w-3' />
        Успешно
      </Badge>
    ) : (
      <Badge variant='destructive'>
        <AlertCircle className='mr-1 h-3 w-3' />
        Ошибка
      </Badge>
    );
  }

  // Фильтрация логов
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && log.status >= 200 && log.status < 300) ||
      (statusFilter === 'error' && log.status >= 400);

    const matchesSuccess =
      successFilter === 'all' ||
      (successFilter === 'true' && log.success) ||
      (successFilter === 'false' && !log.success);

    return matchesSearch && matchesStatus && matchesSuccess;
  });

  if (loading) {
    const skeleton = (
      <div className='animate-pulse'>
        <div className='mb-4 h-8 w-1/4 rounded bg-gray-200'></div>
        <div className='h-64 rounded bg-gray-200'></div>
      </div>
    );
    return embedded ? skeleton : <PageContainer>{skeleton}</PageContainer>;
  }

  if (error) {
    const errorBlock = (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
    return embedded ? errorBlock : <PageContainer>{errorBlock}</PageContainer>;
  }

  const body = (
    <div className='space-y-6'>
      {/* Заголовок */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Логи интеграции</h1>
          <p className='text-muted-foreground mt-2'>
            История вызовов webhook API для проекта
          </p>
        </div>
        <Button onClick={loadLogs} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего запросов
            </CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Успешных</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {logs.filter((log) => log.success).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Ошибок</CardTitle>
            <AlertCircle className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {logs.filter((log) => !log.success).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Последний запрос
            </CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-muted-foreground text-sm'>
              {logs.length > 0 ? formatDate(logs[0].createdAt) : 'Нет данных'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='search'>Поиск</Label>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                <Input
                  id='search'
                  placeholder='Поиск по endpoint...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Статус</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Выберите статус' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='success'>Успешные (2xx)</SelectItem>
                  <SelectItem value='error'>Ошибки (4xx+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Результат</Label>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Выберите результат' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='true'>Успешные</SelectItem>
                  <SelectItem value='false'>Ошибки</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Действия</Label>
              <Button variant='outline' className='w-full'>
                <Download className='mr-2 h-4 w-4' />
                Экспорт
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица логов */}
      <Card>
        <CardHeader>
          <CardTitle>История запросов ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Последние webhook запросы к вашему проекту
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className='py-8 text-center'>
              <AlertCircle className='text-muted-foreground mx-auto h-12 w-12' />
              <h3 className='mt-2 text-sm font-semibold text-gray-900'>
                Нет логов
              </h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                {logs.length === 0
                  ? 'Пока нет webhook запросов к этому проекту'
                  : 'Нет логов, соответствующих выбранным фильтрам'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className='hover:bg-muted/50 rounded-lg border p-4 transition-colors'
                >
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{log.method}</Badge>
                      <code className='font-mono text-sm'>{log.endpoint}</code>
                    </div>
                    <div className='flex items-center gap-2'>
                      {getStatusBadge(log.status)}
                      {getSuccessBadge(log.success)}
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    <div className='flex items-center gap-4'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {formatDate(log.createdAt)}
                      </span>
                      <span>ID: {log.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно с деталями лога */}
      {selectedLog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <Card className='max-h-[80vh] w-full max-w-4xl overflow-hidden'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Детали запроса</CardTitle>
                <CardDescription>
                  {selectedLog.method} {selectedLog.endpoint}
                </CardDescription>
              </div>
              <Button variant='ghost' onClick={() => setSelectedLog(null)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className='overflow-auto'>
              <Tabs defaultValue='request' className='space-y-4'>
                <TabsList>
                  <TabsTrigger value='request'>Запрос</TabsTrigger>
                  <TabsTrigger value='response'>Ответ</TabsTrigger>
                  <TabsTrigger value='headers'>Заголовки</TabsTrigger>
                </TabsList>

                <TabsContent value='request' className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Тело запроса</Label>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedLog.body, null, 2)
                        )
                      }
                    >
                      <Copy className='mr-1 h-4 w-4' />
                      Копировать
                    </Button>
                  </div>
                  <pre className='bg-muted overflow-x-auto rounded-lg p-4 text-sm'>
                    <code>{JSON.stringify(selectedLog.body, null, 2)}</code>
                  </pre>
                </TabsContent>

                <TabsContent value='response' className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Тело ответа</Label>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedLog.response, null, 2)
                        )
                      }
                    >
                      <Copy className='mr-1 h-4 w-4' />
                      Копировать
                    </Button>
                  </div>
                  <pre className='bg-muted overflow-x-auto rounded-lg p-4 text-sm'>
                    <code>{JSON.stringify(selectedLog.response, null, 2)}</code>
                  </pre>
                </TabsContent>

                <TabsContent value='headers' className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Заголовки запроса</Label>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedLog.headers, null, 2)
                        )
                      }
                    >
                      <Copy className='mr-1 h-4 w-4' />
                      Копировать
                    </Button>
                  </div>
                  <pre className='bg-muted overflow-x-auto rounded-lg p-4 text-sm'>
                    <code>{JSON.stringify(selectedLog.headers, null, 2)}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return embedded ? body : <PageContainer scrollable>{body}</PageContainer>;
}
