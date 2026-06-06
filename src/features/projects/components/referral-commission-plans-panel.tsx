/**
 * @file: src/features/projects/components/referral-commission-plans-panel.tsx
 * @description: Панель планов реферальных % и назначения пользователям-партнёрам.
 *               (b2b-referral-hierarchy Phase 6.1–6.6)
 *                 6.1 — поиск пользователя через `Command`-комбобокс вместо input userId
 *                 6.2 — debounced поиск через
 *                       /api/projects/{id}/users?search=&role=TRAINER,MANAGER,DIRECTOR
 *                 6.3 — роль badge + текущий outbound-план в результатах
 *                 6.4 — кнопка «Назначить всем тренерам» с диалогом подтверждения
 *                 6.5 — слайдер `maxPayoutDepth` 1..3 с подсказкой
 *                 6.6 — баннер «Используются персональные планы» когда
 *                       `referralPlansEnabled = true` (legacy ReferralLevel
 *                       editor спрятан в этом случае на уровне родителя)
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui (Command, Popover, Slider, Alert, Switch, Dialog)
 * @created: 2026-05-12
 * @updated: 2026-05-24
 * @author: AI Assistant + User
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Info,
  Loader2,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getPartnerRoleLabel } from '@/features/bonuses/components/partner-role-badge';
import { PartnerUserCombobox, type PartnerUser } from './partner-user-combobox';

type PlanLevel = {
  id?: string;
  level: number;
  percent: number;
  isActive?: boolean;
};

type Plan = {
  id: string;
  name: string;
  maxPayoutDepth: number;
  levels: PlanLevel[];
};

interface Props {
  projectId: string;
  /**
   * Включена ли b2b-иерархия. Когда true — фильтр в комбобоксе по партнёрской
   * роли + кнопка bulk-assign видна. По умолчанию `false` — поведение прежнее.
   */
  enablePartnerRoles?: boolean;
}

// Слайдер 1..3 — рекомендованная глубина для b2b (Phase 6.5).
// Большие значения (до 10) убраны из UI как малополезные. Старые планы с
// depth > 3 продолжат корректно работать на бэкенде, но при редактировании
// будут отображаться с предупреждением и предложением понизить.
const SLIDER_MIN = 1;
const SLIDER_MAX = 3;

const LEVEL_ROLE_LABELS = [
  'Тренер (L1)',
  'Менеджер (L2)',
  'Директор (L3)'
] as const;

function formatPlanLevels(
  levels: PlanLevel[],
  enablePartnerRoles: boolean
): string {
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  if (enablePartnerRoles) {
    return sorted
      .map(
        (l) =>
          `${LEVEL_ROLE_LABELS[l.level - 1] ?? `L${l.level}`}: ${l.percent}%`
      )
      .join(' · ');
  }
  return sorted.map((l) => `L${l.level}: ${l.percent}%`).join(' · ');
}

type AssignTarget = 'one' | 'role';

const ROLE_PLURAL: Record<'TRAINER' | 'MANAGER' | 'DIRECTOR', string> = {
  TRAINER: 'тренеров',
  MANAGER: 'менеджеров',
  DIRECTOR: 'руководителей'
};

export function ReferralCommissionPlansPanel({
  projectId,
  enablePartnerRoles = false
}: Props) {
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

  // Единый диалог назначения плана
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssignTarget>('one');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignUser, setAssignUser] = useState<PartnerUser | null>(null);
  const [assignRole, setAssignRole] = useState<
    'TRAINER' | 'MANAGER' | 'DIRECTOR'
  >('TRAINER');
  /** true = не перезаписывать партнёров, у которых уже есть свой план */
  const [assignOnlyWithoutPlan, setAssignOnlyWithoutPlan] = useState(true);
  const [rolePreview, setRolePreview] = useState<{
    total: number;
    empty: number;
  } | null>(null);
  const [loadingRolePreview, setLoadingRolePreview] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);

  const planNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of plans) map[p.id] = p.name;
    return map;
  }, [plans]);

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

  const openAssignDialog = (preselectedPlanId?: string) => {
    setAssignPlanId(preselectedPlanId ?? defaultPlanId ?? plans[0]?.id ?? '');
    setAssignTarget('one');
    setAssignUser(null);
    setAssignRole('TRAINER');
    setAssignOnlyWithoutPlan(true);
    setRolePreview(null);
    setAssignDialogOpen(true);
  };

  const loadRolePreview = useCallback(async () => {
    if (!assignPlanId || assignTarget !== 'role') {
      setRolePreview(null);
      return;
    }
    setLoadingRolePreview(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans/${assignPlanId}/bulk-assign?role=${assignRole}`
      );
      if (!res.ok) throw new Error('preview failed');
      const data = await res.json();
      setRolePreview({
        total: Number(data.total ?? 0),
        empty: Number(data.empty ?? 0)
      });
    } catch {
      setRolePreview(null);
    } finally {
      setLoadingRolePreview(false);
    }
  }, [assignPlanId, assignRole, assignTarget, projectId]);

  useEffect(() => {
    if (!assignDialogOpen || assignTarget !== 'role') return;
    void loadRolePreview();
  }, [assignDialogOpen, assignTarget, loadRolePreview]);

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
      setCreatePlanOpen(false);
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

  const submitAssign = async () => {
    if (!assignPlanId) {
      toast({ title: 'Выберите план', variant: 'destructive' });
      return;
    }

    if (assignTarget === 'one') {
      if (!assignUser) {
        toast({ title: 'Выберите партнёра', variant: 'destructive' });
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/users/${assignUser.id}/referral-outbound-plan`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ outboundReferralPlanId: assignPlanId })
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'assign failed');
        }
        toast({
          title: 'План назначен',
          description: `«${planNameById[assignPlanId]}» → ${assignUser.name}`
        });
        setAssignDialogOpen(false);
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
      return;
    }

    const affected = assignOnlyWithoutPlan
      ? (rolePreview?.empty ?? 0)
      : (rolePreview?.total ?? 0);

    if (affected === 0) {
      toast({
        title: 'Никого не затронет',
        description: assignOnlyWithoutPlan
          ? `У всех ${ROLE_PLURAL[assignRole]} уже есть свой план`
          : `В проекте нет ${ROLE_PLURAL[assignRole]}`,
        variant: 'destructive'
      });
      return;
    }

    if (
      !assignOnlyWithoutPlan &&
      rolePreview &&
      rolePreview.total > rolePreview.empty &&
      !confirm(
        `Перезаписать план у ${rolePreview.total} ${ROLE_PLURAL[assignRole]}? У ${rolePreview.total - rolePreview.empty} уже есть другой план.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans/${assignPlanId}/bulk-assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: assignRole,
            onlyEmpty: assignOnlyWithoutPlan
          })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось назначить');
      }
      const data = await res.json();
      toast({
        title: 'План назначен',
        description: `«${planNameById[assignPlanId]}» → ${data.updated} ${ROLE_PLURAL[assignRole]}`
      });
      setAssignDialogOpen(false);
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

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const showBanner = referralPlansEnabled;

  return (
    <div className='space-y-6'>
      {/* Phase 6.6 — баннер при включённых персональных планах */}
      {showBanner && (
        <Alert className='border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/40'>
          <Info className='h-4 w-4 text-emerald-600' />
          <AlertTitle>Используются персональные планы комиссий</AlertTitle>
          <AlertDescription>
            Старые уровни реферальной программы (вкладка «Настройки» → «Уровни»)
            больше не применяются для новых атрибуций. Существующие начисления
            остаются неизменными — атрибуция зафиксирована.
          </AlertDescription>
        </Alert>
      )}

      {enablePartnerRoles && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Планы комиссий ≠ бонусы клиентам</AlertTitle>
          <AlertDescription className='text-sm'>
            Здесь задаётся, сколько % от покупки получают тренер (L1), менеджер
            (L2) и директор (L3). Бонусы для клиентов — во вкладке «Настройки».
            Приоритет плана: персональный outbound → план организации → план по
            умолчанию.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className='flex flex-row items-start justify-between gap-4'>
          <div>
            <CardTitle>Настройки планов</CardTitle>
            <CardDescription>
              Включите персональные планы и выберите дефолт для новых
              приглашённых
            </CardDescription>
          </div>
          <div className='flex shrink-0 flex-wrap gap-2'>
            {plans.length > 0 && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => openAssignDialog()}
              >
                <UserPlus className='mr-2 h-4 w-4' />
                Назначить план
              </Button>
            )}
            <Button
              type='button'
              size='sm'
              onClick={() => setCreatePlanOpen(true)}
            >
              <Plus className='mr-2 h-4 w-4' />
              Новый план
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
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
              size='sm'
              onClick={() => void seedFromLegacy()}
              disabled={saving}
            >
              Из текущей программы
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Планы ({plans.length})</CardTitle>
          <CardDescription>
            Проценты выплат по уровням иерархии с каждой покупки приглашённого
            клиента
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {plans.length === 0 ? (
            <p className='text-muted-foreground py-4 text-center text-sm'>
              Планов пока нет.{' '}
              <button
                type='button'
                className='text-primary underline'
                onClick={() => setCreatePlanOpen(true)}
              >
                Создать первый
              </button>
            </p>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between gap-3 rounded-lg border p-3'
              >
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-medium'>{p.name}</span>
                    {defaultPlanId === p.id && (
                      <Badge variant='secondary' className='text-xs'>
                        по умолчанию
                      </Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground mt-0.5 text-sm'>
                    {formatPlanLevels(p.levels, enablePartnerRoles)}
                    {' · '}
                    глубина {p.maxPayoutDepth}
                  </p>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='secondary'
                    onClick={() => openAssignDialog(p.id)}
                  >
                    Назначить
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    className='text-destructive hover:text-destructive'
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

      {/* Create plan dialog */}
      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Новый план комиссий</DialogTitle>
            <DialogDescription>
              До 3 уровней выплат в процентах от суммы покупки
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='space-y-2'>
              <Label>Название</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Глубина выплат:{' '}
                <Badge variant='secondary' className='font-mono'>
                  {maxDepth}
                </Badge>
              </Label>
              <Slider
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={1}
                value={[maxDepth]}
                onValueChange={(v) => setMaxDepth(v[0] ?? 3)}
                className='py-2'
              />
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              {[l1, l2, l3].map((value, index) => {
                const levelNum = index + 1;
                if (levelNum > maxDepth) return null;
                return (
                  <div key={index} className='space-y-2'>
                    <Label>
                      {enablePartnerRoles
                        ? LEVEL_ROLE_LABELS[index]
                        : `Уровень ${levelNum}`}{' '}
                      %
                    </Label>
                    <Input
                      type='number'
                      value={value}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (index === 0) setL1(n);
                        else if (index === 1) setL2(n);
                        else setL3(n);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreatePlanOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => void createPlan()} disabled={saving}>
              {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Назначить план — один диалог: одному партнёру или всей роли */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Назначить план комиссий</DialogTitle>
            <DialogDescription>
              План определяет проценты L1/L2/L3 для клиентов, которых пригласил
              партнёр
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-5 py-2'>
            <div className='space-y-2'>
              <Label>Какой план</Label>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder='Выберите план' />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {defaultPlanId === p.id ? ' (по умолчанию)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-3'>
              <Label>Кому назначить</Label>
              <RadioGroup
                value={assignTarget}
                onValueChange={(v) => setAssignTarget(v as AssignTarget)}
                className='grid gap-2'
              >
                <label
                  htmlFor='assign-one'
                  className='hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3'
                >
                  <RadioGroupItem
                    value='one'
                    id='assign-one'
                    className='mt-0.5'
                  />
                  <div>
                    <p className='text-sm font-medium'>Одному партнёру</p>
                    <p className='text-muted-foreground text-xs'>
                      Найти по имени, email или телефону
                    </p>
                  </div>
                </label>
                {enablePartnerRoles && (
                  <label
                    htmlFor='assign-role'
                    className='hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3'
                  >
                    <RadioGroupItem
                      value='role'
                      id='assign-role'
                      className='mt-0.5'
                    />
                    <div>
                      <p className='text-sm font-medium'>
                        Всем партнёрам одной роли
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Например, всем тренерам сразу
                      </p>
                    </div>
                  </label>
                )}
              </RadioGroup>
            </div>

            {assignTarget === 'one' ? (
              <div className='space-y-2'>
                <Label>Партнёр</Label>
                <PartnerUserCombobox
                  projectId={projectId}
                  value={assignUser?.id ?? ''}
                  onChange={(u) => setAssignUser(u)}
                  partnerRolesOnly={enablePartnerRoles}
                  planNameById={planNameById}
                  disabled={saving}
                />
                {assignUser?.outboundReferralPlanId && (
                  <p className='text-muted-foreground text-xs'>
                    Сейчас:{' '}
                    {planNameById[assignUser.outboundReferralPlanId] ??
                      'другой план'}
                  </p>
                )}
              </div>
            ) : (
              <div className='space-y-4 rounded-lg border p-3'>
                <div className='space-y-2'>
                  <Label>Роль</Label>
                  <Select
                    value={assignRole}
                    onValueChange={(v) =>
                      setAssignRole(v as 'TRAINER' | 'MANAGER' | 'DIRECTOR')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='TRAINER'>Тренеры</SelectItem>
                      <SelectItem value='MANAGER'>Менеджеры</SelectItem>
                      <SelectItem value='DIRECTOR'>Руководители</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className='flex cursor-pointer items-start gap-2 text-sm'>
                  <input
                    type='checkbox'
                    className='mt-1'
                    checked={assignOnlyWithoutPlan}
                    onChange={(e) => setAssignOnlyWithoutPlan(e.target.checked)}
                  />
                  <span>
                    Только тем, у кого ещё нет своего плана
                    <span className='text-muted-foreground block text-xs'>
                      Не перезаписывать уже настроенных партнёров
                    </span>
                  </span>
                </label>
                <div className='bg-muted/50 rounded-md px-3 py-2 text-sm'>
                  {loadingRolePreview ? (
                    <span className='text-muted-foreground flex items-center gap-2'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Считаем…
                    </span>
                  ) : rolePreview ? (
                    <>
                      Будет назначено:{' '}
                      <strong>
                        {assignOnlyWithoutPlan
                          ? rolePreview.empty
                          : rolePreview.total}
                      </strong>{' '}
                      {ROLE_PLURAL[assignRole]}
                      {!assignOnlyWithoutPlan &&
                        rolePreview.total > rolePreview.empty && (
                          <span className='text-muted-foreground block text-xs'>
                            из них {rolePreview.total - rolePreview.empty} уже
                            имеют другой план — он будет заменён
                          </span>
                        )}
                    </>
                  ) : (
                    <span className='text-muted-foreground'>
                      Выберите роль для подсчёта
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAssignDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={() => void submitAssign()} disabled={saving}>
              {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
