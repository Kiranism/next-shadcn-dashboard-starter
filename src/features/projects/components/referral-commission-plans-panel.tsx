/**
 * @file: src/features/projects/components/referral-commission-plans-panel.tsx
 * @description: Панель планов реферальных % и назначения блогерам (MVP)
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type Plan = {
  id: string;
  name: string;
  maxPayoutDepth: number;
  levels: PlanLevel[];
};

export function ReferralCommissionPlansPanel({
  projectId
}: {
  projectId: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralPlansEnabled, setReferralPlansEnabled] = useState(false);
  const [defaultPlanId, setDefaultPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [newName, setNewName] = useState('Инфлюенсер');
  const [l1, setL1] = useState(10);
  const [l2, setL2] = useState(3);
  const [l3, setL3] = useState(1);
  const [maxDepth, setMaxDepth] = useState(3);

  const [assignUserId, setAssignUserId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-settings`
      );
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setReferralPlansEnabled(Boolean(data.referralPlansEnabled));
      setDefaultPlanId(data.defaultReferralCommissionPlanId ?? null);
      setPlans(data.plans || []);
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки планов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async (next?: {
    enabled?: boolean;
    defaultId?: string | null;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralPlansEnabled: next?.enabled ?? referralPlansEnabled,
            defaultReferralCommissionPlanId:
              next?.defaultId !== undefined ? next.defaultId : defaultPlanId
          })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'save failed');
      }
      toast({ title: 'Сохранено' });
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не сохранилось',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const seedFromLegacy = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans/seed-from-legacy`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'seed failed');
      }
      toast({
        title: 'Готово',
        description: 'Создан план по умолчанию из текущих уровней программы'
      });
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const createPlan = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            maxPayoutDepth: maxDepth,
            levels: [
              { level: 1, percent: l1, isActive: l1 > 0 },
              { level: 2, percent: l2, isActive: l2 > 0 },
              { level: 3, percent: l3, isActive: l3 > 0 }
            ]
          })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'create failed');
      }
      toast({ title: 'План создан' });
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Удалить план?')) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans/${planId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'delete failed');
      }
      toast({ title: 'Удалено' });
      await load();
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const assignOutbound = async () => {
    if (!assignUserId.trim()) {
      toast({
        title: 'Укажите userId',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/users/${assignUserId.trim()}/referral-outbound-plan`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outboundReferralPlanId: assignPlanId || null
          })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'assign failed');
      }
      toast({ title: 'Назначено' });
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Персональные планы комиссий</CardTitle>
          <CardDescription>
            При включении для каждого нового приглашённого фиксируется план
            выплат: сначала план блогера (outbound), иначе план по умолчанию.
            Изменение процентов у блогера не затрагивает уже зарегистрированных
            рефералов.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <Label htmlFor='ref-plans-enabled'>
                Включить персональные планы
              </Label>
              <p className='text-muted-foreground text-sm'>
                Без дефолтного плана новые атрибуции не создаются
              </p>
            </div>
            <Switch
              id='ref-plans-enabled'
              checked={referralPlansEnabled}
              onCheckedChange={(v) => {
                setReferralPlansEnabled(v);
                void saveSettings({ enabled: v });
              }}
              disabled={saving}
            />
          </div>

          <div className='flex flex-wrap items-end gap-3'>
            <div className='space-y-2'>
              <Label>План по умолчанию</Label>
              <Select
                value={defaultPlanId ?? '__none__'}
                onValueChange={(v) => {
                  const id = v === '__none__' ? null : v;
                  setDefaultPlanId(id);
                  void saveSettings({ defaultId: id });
                }}
                disabled={saving || !plans.length}
              >
                <SelectTrigger className='w-[260px]'>
                  <SelectValue placeholder='Не выбран' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__none__'>— не выбран —</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type='button'
              variant='secondary'
              onClick={() => void seedFromLegacy()}
              disabled={saving}
            >
              Создать план из текущей программы
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Новый план</CardTitle>
          <CardDescription>
            До 3 уровней выплат (в процентах от покупки)
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Название</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className='space-y-2'>
              <Label>Глубина выплат</Label>
              <Input
                type='number'
                min={1}
                max={10}
                value={maxDepth}
                onChange={(e) =>
                  setMaxDepth(
                    Math.min(10, Math.max(1, Number(e.target.value) || 1))
                  )
                }
              />
            </div>
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-2'>
              <Label>Уровень 1 %</Label>
              <Input
                type='number'
                value={l1}
                onChange={(e) => setL1(Number(e.target.value))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Уровень 2 %</Label>
              <Input
                type='number'
                value={l2}
                onChange={(e) => setL2(Number(e.target.value))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Уровень 3 %</Label>
              <Input
                type='number'
                value={l3}
                onChange={(e) => setL3(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            type='button'
            onClick={() => void createPlan()}
            disabled={saving}
          >
            <Plus className='mr-2 h-4 w-4' />
            Создать план
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Планы</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {plans.length === 0 ? (
            <p className='text-muted-foreground text-sm'>Пока нет планов</p>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'
              >
                <div>
                  <div className='font-medium'>{p.name}</div>
                  <div className='text-muted-foreground font-mono text-xs'>
                    {p.id}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    Уровни:{' '}
                    {p.levels.map((l) => `${l.level}:${l.percent}%`).join(', ')}{' '}
                    · глубина {p.maxPayoutDepth}
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    className='text-destructive'
                    onClick={() => void deletePlan(p.id)}
                    disabled={saving || defaultPlanId === p.id}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Назначить план блогеру</CardTitle>
          <CardDescription>
            User ID из списка пользователей; при регистрации по его ссылке
            применится этот план (если включены персональные планы и выбран
            дефолт при отсутствии outbound).
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap items-end gap-3'>
          <div className='space-y-2'>
            <Label>User ID</Label>
            <Input
              placeholder='cuid пользователя'
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className='w-[280px]'
            />
          </div>
          <div className='space-y-2'>
            <Label>План</Label>
            <Select
              value={assignPlanId || '__clear__'}
              onValueChange={(v) => setAssignPlanId(v === '__clear__' ? '' : v)}
            >
              <SelectTrigger className='w-[220px]'>
                <SelectValue placeholder='План' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__clear__'>Сбросить</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type='button'
            onClick={() => void assignOutbound()}
            disabled={saving}
          >
            Сохранить
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика блогера (API)</CardTitle>
          <CardDescription>
            GET{' '}
            <code className='bg-muted rounded px-1 text-xs'>
              /api/projects/{projectId}/referral-insights/{'{userId}'}
            </code>{' '}
            — владелец проекта (авторизованный админ) видит агрегаты по
            указанному пользователю. Для «руководителя» без доступа к админке
            используйте выдачу grant: POST{' '}
            <code className='bg-muted rounded px-1 text-xs'>
              /api/projects/.../referral-stats-grants
            </code>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
