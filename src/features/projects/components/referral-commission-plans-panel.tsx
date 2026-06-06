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
 * @dependencies: shadcn/ui (Command, Popover, Slider, Alert, Switch),
 *                composite ConfirmDialog
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
  UserPlus,
  Users
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
import { ConfirmDialog } from '@/components/composite/confirm-dialog';
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
import { useToast } from '@/hooks/use-toast';
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

  // Назначение outbound-плана конкретному пользователю
  const [assignUser, setAssignUser] = useState<PartnerUser | null>(null);
  const [assignPlanId, setAssignPlanId] = useState<string>('');

  // Bulk-assign (Phase 6.4)
  const [bulkPlanId, setBulkPlanId] = useState<string>('');
  const [bulkRole, setBulkRole] = useState<'TRAINER' | 'MANAGER' | 'DIRECTOR'>(
    'TRAINER'
  );
  const [bulkOnlyEmpty, setBulkOnlyEmpty] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<{
    total: number;
    empty: number;
    role: string;
  } | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoadingPreview, setBulkLoadingPreview] = useState(false);

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
    if (!assignUser) {
      toast({
        title: 'Выберите партнёра',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/users/${assignUser.id}/referral-outbound-plan`,
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
      toast({
        title: 'Назначено',
        description: assignPlanId
          ? `План «${planNameById[assignPlanId] ?? assignPlanId}» применён`
          : 'Outbound-план сброшен'
      });
      // Обновим состояние выбранного пользователя
      setAssignUser({
        ...assignUser,
        outboundReferralPlanId: assignPlanId || null
      });
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

  // ──────────────────────────────────────────────────────────────────
  // Phase 6.4 — Bulk assign
  // ──────────────────────────────────────────────────────────────────

  const openBulkConfirm = async (planId: string) => {
    if (!planId) return;
    setBulkPlanId(planId);
    setBulkLoadingPreview(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/referral-commission-plans/${planId}/bulk-assign?role=${bulkRole}`
      );
      if (!res.ok) throw new Error('preview failed');
      const data = await res.json();
      setBulkPreview({
        total: Number(data.total ?? 0),
        empty: Number(data.empty ?? 0),
        role: String(data.role ?? bulkRole)
      });
      setBulkConfirmOpen(true);
    } catch {
      toast({
        title: 'Не удалось получить превью',
        description: 'Проверьте подключение и попробуйте снова',
        variant: 'destructive'
      });
    } finally {
      setBulkLoadingPreview(false);
    }
  };

  const performBulkAssign = async () => {
    const res = await fetch(
      `/api/projects/${projectId}/referral-commission-plans/${bulkPlanId}/bulk-assign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: bulkRole, onlyEmpty: bulkOnlyEmpty })
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось назначить план');
    }
    const data = await res.json();
    toast({
      title: 'Готово',
      description: `Обновлено пользователей: ${data.updated}`
    });
    await load();
  };

  const roleLabel = (r: 'TRAINER' | 'MANAGER' | 'DIRECTOR') =>
    r === 'TRAINER'
      ? 'тренерам'
      : r === 'MANAGER'
        ? 'менеджерам'
        : 'руководителям';

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
          <AlertTitle>Как работать с планами в B2B</AlertTitle>
          <AlertDescription className='space-y-2 text-sm'>
            <p>
              1. Создайте план (например «Стандарт» или «Инфлюенсер») с
              процентами L1/L2/L3.
            </p>
            <p>
              2. Включите «Персональные планы» и выберите план по умолчанию.
            </p>
            <p>
              3. Назначьте план каждому партнёру (тренер / менеджер / директор)
              — кнопкой «Назначить тренерам» или в блоке «Назначить план
              партнёру» ниже.
            </p>
            <p className='text-muted-foreground'>
              При покупке клиента комиссия делится по цепочке вверх: тренер (L1)
              → менеджер (L2) → директор (L3). Проценты берутся из плана того
              партнёра, который пригласил клиента.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {enablePartnerRoles
              ? 'Планы комиссий для партнёров'
              : 'Персональные планы комиссий'}
          </CardTitle>
          <CardDescription>
            {enablePartnerRoles
              ? 'Определяют, сколько % получают тренер, менеджер и директор с каждой покупки приглашённого клиента. Не путать с бонусами для клиента во вкладке «Настройки».'
              : 'При включении для каждого нового приглашённого фиксируется план выплат: сначала outbound-план партнёра, иначе план по умолчанию.'}
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
            {/* Phase 6.5 — Slider 1..3 с подсказкой */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>
                  Глубина выплат:{' '}
                  <Badge variant='secondary' className='font-mono'>
                    {maxDepth}
                  </Badge>
                </Label>
              </div>
              <Slider
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={1}
                value={[maxDepth]}
                onValueChange={(v) => setMaxDepth(v[0] ?? 3)}
                className='py-2'
              />
              <p className='text-muted-foreground text-xs'>
                Сколько уровней вверх по дереву получают комиссию. Рекомендуется
                3 для b2b (тренер → менеджер → руководитель). Большая глубина
                почти не используется и ухудшает аналитику.
              </p>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {[l1, l2, l3].map((value, index) => (
              <div key={index} className='space-y-2'>
                <Label>
                  {enablePartnerRoles
                    ? LEVEL_ROLE_LABELS[index]
                    : `Уровень ${index + 1}`}{' '}
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
                {enablePartnerRoles && (
                  <p className='text-muted-foreground text-xs'>
                    {index === 0
                      ? 'Прямой пригласивший клиента'
                      : index === 1
                        ? 'Руководитель тренера'
                        : 'Руководитель сети'}
                  </p>
                )}
              </div>
            ))}
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
          <CardDescription>
            Выберите план и при необходимости назначьте его всем партнёрам одной
            роли разом.
          </CardDescription>
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
                    {formatPlanLevels(p.levels, enablePartnerRoles)}
                    {' · '}
                    глубина {p.maxPayoutDepth}
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  {/* Phase 6.4 — Bulk assign по роли */}
                  {enablePartnerRoles && (
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={() => void openBulkConfirm(p.id)}
                      disabled={saving || bulkLoadingPreview}
                    >
                      <Users className='mr-2 h-4 w-4' />
                      Назначить {roleLabel(bulkRole)}
                    </Button>
                  )}
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

          {enablePartnerRoles && plans.length > 0 && (
            <div className='flex flex-wrap items-end gap-3 rounded-md border border-dashed p-3'>
              <div className='space-y-1'>
                <Label className='text-xs'>Роль для bulk-назначения</Label>
                <Select
                  value={bulkRole}
                  onValueChange={(v) =>
                    setBulkRole(v as 'TRAINER' | 'MANAGER' | 'DIRECTOR')
                  }
                  disabled={saving}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='TRAINER'>Тренеры</SelectItem>
                    <SelectItem value='MANAGER'>Менеджеры</SelectItem>
                    <SelectItem value='DIRECTOR'>Руководители</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-xs'>
                <input
                  type='checkbox'
                  checked={bulkOnlyEmpty}
                  onChange={(e) => setBulkOnlyEmpty(e.target.checked)}
                />
                Только тем, у кого нет плана
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={enablePartnerRoles ? 'border-primary/30' : undefined}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <UserPlus className='h-5 w-5' />
            Назначить план партнёру
          </CardTitle>
          <CardDescription>
            Найдите пользователя по имени, email или телефону. Фильтр по роли
            применяется автоматически когда включена b2b-иерархия.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap items-end gap-3'>
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
                Текущий план:{' '}
                <span className='font-medium'>
                  {planNameById[assignUser.outboundReferralPlanId] ??
                    assignUser.outboundReferralPlanId}
                </span>
              </p>
            )}
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
            disabled={saving || !assignUser}
          >
            <UserPlus className='mr-2 h-4 w-4' />
            Сохранить
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика партнёра (API)</CardTitle>
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

      {/* Phase 6.4 — Confirm dialog для bulk-assign */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={`Назначить план «${
          bulkPlanId ? (planNameById[bulkPlanId] ?? bulkPlanId) : ''
        }»`}
        description={
          bulkPreview ? (
            <span>
              План будет применён{' '}
              <strong>
                {bulkOnlyEmpty
                  ? `${bulkPreview.empty} пользователям без плана`
                  : `всем ${bulkPreview.total} пользователям`}
              </strong>{' '}
              с ролью <strong>{roleLabel(bulkRole)}</strong>. Существующие
              атрибуции (рефералы, у которых уже зафиксирован план) останутся
              без изменений.
            </span>
          ) : (
            'Загрузка превью…'
          )
        }
        confirmLabel='Назначить'
        cancelLabel='Отмена'
        successMessage='План назначен'
        onConfirm={performBulkAssign}
      />
    </div>
  );
}
