/**
 * @file: bonus-levels-management.tsx
 * @description: Компонент для управления уровнями бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { BonusLevel } from '@/types/bonus';
import { BonusLevelDialog } from './bonus-level-dialog';

interface BonusLevelsManagementProps {
  projectId: string;
}

export function BonusLevelsManagement({ projectId }: BonusLevelsManagementProps) {
  const [levels, setLevels] = useState<BonusLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<BonusLevel | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadLevels();
  }, [projectId]);

  async function loadLevels() {
    try {
      const response = await fetch(`/api/projects/${projectId}/bonus-levels`);
      if (!response.ok) throw new Error('Failed to load bonus levels');
      
      const data = await response.json();
      setLevels(data.items || []);
    } catch (error) {
      toast.error('Ошибка загрузки уровней');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(levelId: string) {
    if (!confirm('Вы уверены, что хотите удалить этот уровень?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/bonus-levels/${levelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete level');

      toast.success('Уровень удален');
      loadLevels();
    } catch (error) {
      toast.error('Ошибка удаления уровня');
    }
  }

  async function handleReorder(levelId: string, direction: 'up' | 'down') {
    setReordering(true);
    
    try {
      const currentIndex = levels.findIndex(l => l.id === levelId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= levels.length) return;

      // Оптимистичное обновление UI
      const newLevels = [...levels];
      [newLevels[currentIndex], newLevels[newIndex]] = [newLevels[newIndex], newLevels[currentIndex]];
      setLevels(newLevels);

      const levelIds = newLevels.map(l => l.id);
      
      const response = await fetch(`/api/projects/${projectId}/bonus-levels/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelIds })
      });

      if (!response.ok) {
        loadLevels(); // Восстановить оригинальный порядок
        throw new Error('Failed to reorder');
      }
    } catch (error) {
      toast.error('Ошибка изменения порядка');
    } finally {
      setReordering(false);
    }
  }

  async function handleResetDefaults() {
    if (!confirm('Это действие сбросит все уровни и создаст стандартные (Базовый, Серебряный, Золотой). Продолжить?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/bonus-levels/reset-defaults`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reset defaults');

      toast.success('Уровни сброшены на стандартные');
      loadLevels();
    } catch (error) {
      toast.error('Ошибка сброса уровней');
    }
  }

  function handleEdit(level: BonusLevel) {
    setEditingLevel(level);
    setIsDialogOpen(true);
  }

  function handleCreate() {
    setEditingLevel(null);
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setEditingLevel(null);
    loadLevels();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Уровни бонусной программы</CardTitle>
            <CardDescription>
              Настройте уровни с разными процентами начисления и лимитами оплаты
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить уровень
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Уровни не настроены</AlertTitle>
              <AlertDescription>
                Создайте уровни бонусной программы или используйте стандартные настройки
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Порядок</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Сумма покупок</TableHead>
                  <TableHead>% начисления</TableHead>
                  <TableHead>% оплаты</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level, index) => (
                  <TableRow key={level.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleReorder(level.id, 'up')}
                          disabled={index === 0 || reordering}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleReorder(level.id, 'down')}
                          disabled={index === levels.length - 1 || reordering}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>
                      {level.minAmount} ₽
                      {level.maxAmount && ` - ${level.maxAmount} ₽`}
                      {!level.maxAmount && index === levels.length - 1 && ' и выше'}
                    </TableCell>
                    <TableCell>{level.bonusPercent}%</TableCell>
                    <TableCell>{level.paymentPercent}%</TableCell>
                    <TableCell>
                      <Badge variant={level.isActive ? 'default' : 'secondary'}>
                        {level.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(level)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(level.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {levels.length > 0 && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Как работают уровни</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Уровень пользователя определяется автоматически по сумме всех покупок</li>
                  <li>Процент начисления применяется при каждой новой покупке</li>
                  <li>Процент оплаты ограничивает максимальную долю заказа, оплачиваемую бонусами</li>
                  <li>При изменении уровней, пользователи автоматически переходят на новые условия</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <BonusLevelDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        projectId={projectId}
        level={editingLevel}
      />
    </>
  );
}