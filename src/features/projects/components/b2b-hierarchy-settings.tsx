/**
 * @file: b2b-hierarchy-settings.tsx
 * @description: Карточка настроек «B2B Иерархия» в `project-settings-view`.
 *               (b2b-referral-hierarchy Phase 6.15, 6.16)
 *
 *               Содержит:
 *                 - Switch для `enablePartnerRoles` (PATCH /api/projects/[id])
 *                 - Подсказку с описанием эффекта и ссылкой на гайд
 *                 - Кнопку «Импортировать workflow B2B Партнёр» (POST
 *                   /api/templates/install с templateId=b2b-partner-cabinet)
 *                 - Quick-link на страницу иерархии (когда фича включена)
 *
 *               Полностью самостоятельный компонент: не требует данных от
 *               `formData` родителя и не пишет туда ничего. Обновление
 *               происходит через прямой PATCH-запрос — поэтому не остаётся
 *               «несохранённых изменений» в общей форме.
 *
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui (Switch, Card, Button), composite ConfirmDialog,
 *                next/link, useRouter
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Loader2,
  Network,
  PackagePlus,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Props {
  projectId: string;
  /** Текущее значение, прочитанное родителем при загрузке. */
  initialValue: boolean;
  initialTeamManagement?: boolean;
  initialJoinApproval?: boolean;
  /** Sub текущего админа (для install-шаблона). */
  adminSub?: string;
  /** Колбэк после успешного toggle — родитель может перечитать проект. */
  onToggled?: (value: boolean) => void;
}

const BOT_TEMPLATE_ID = 'b2b-partner-cabinet';

export function B2bHierarchySettings({
  projectId,
  initialValue,
  initialTeamManagement = true,
  initialJoinApproval = false,
  adminSub,
  onToggled
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(Boolean(initialValue));
  const [teamManagement, setTeamManagement] = useState(
    Boolean(initialTeamManagement)
  );
  const [joinApproval, setJoinApproval] = useState(
    Boolean(initialJoinApproval)
  );
  const [saving, setSaving] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [installedWorkflowId, setInstalledWorkflowId] = useState<string | null>(
    null
  );
  /** Clerk sub для install API; подгружаем с /api/auth/me, если родитель не передал. */
  const [resolvedAdminId, setResolvedAdminId] = useState<string | undefined>(
    adminSub
  );

  useEffect(() => {
    if (adminSub) {
      setResolvedAdminId(adminSub);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = (await res.json()) as { id?: string };
        if (!cancelled && data.id) setResolvedAdminId(data.id);
      } catch {
        /* auth/me недоступен — install всё равно авторизуется по cookie */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminSub]);

  const patchProject = async (
    payload: Record<string, boolean>,
    rollback: () => void
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось сохранить');
      }
      router.refresh();
    } catch (e) {
      rollback();
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось сохранить',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (next: boolean) => {
    setEnabled(next);
    await patchProject({ enablePartnerRoles: next }, () => setEnabled(!next));
    if (next) {
      toast({
        title: 'B2B-иерархия включена',
        description:
          'Доступны роли партнёров, страница иерархии и фильтр findReferrer.'
      });
    } else {
      toast({
        title: 'B2B-иерархия выключена',
        description:
          'Поведение возвращено к c2c-режиму. Существующие назначения ролей сохранены.'
      });
    }
    onToggled?.(next);
  };

  const toggleTeamManagement = async (next: boolean) => {
    setTeamManagement(next);
    await patchProject({ enablePartnerTeamManagement: next }, () =>
      setTeamManagement(!next)
    );
    toast({
      title: next
        ? 'Управление командой включено'
        : 'Управление командой выключено'
    });
  };

  const toggleJoinApproval = async (next: boolean) => {
    setJoinApproval(next);
    await patchProject({ referralJoinRequiresApproval: next }, () =>
      setJoinApproval(!next)
    );
    toast({
      title: next
        ? 'Режим заявок на вступление включён'
        : 'Рефералы привязываются сразу'
    });
  };

  const installTemplate = async () => {
    setInstalling(true);
    try {
      const res = await fetch('/api/templates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: BOT_TEMPLATE_ID,
          projectId,
          ...(resolvedAdminId ? { userId: resolvedAdminId } : {})
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось установить шаблон');
      }
      setInstalledWorkflowId(
        typeof data.workflowId === 'string' ? data.workflowId : null
      );
      setShowInstallSuccess(true);
      toast({
        title: 'Workflow «B2B Партнёр» импортирован',
        description: 'Сценарий активен. Откройте конструктор для проверки.'
      });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Не удалось импортировать',
        description: e instanceof Error ? e.message : 'Попробуйте позже',
        variant: 'destructive'
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Network className='h-5 w-5 text-purple-500' />
          B2B Иерархия партнёров
        </CardTitle>
        <CardDescription>
          Включает b2b-режим: роли (CLIENT / TRAINER / MANAGER / DIRECTOR),
          фильтр в findReferrer (только партнёры могут приглашать), страница
          иерархии и меню для партнёрских ролей в Telegram-боте.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-start justify-between gap-4 rounded-lg border p-4'>
          <div className='space-y-1'>
            <Label htmlFor='enable-partner-roles' className='cursor-pointer'>
              Включить B2B-иерархию
            </Label>
            <p className='text-muted-foreground text-sm'>
              По умолчанию выключено. Все существующие проекты не затронуты —
              c2c-логика сохраняется. Подробнее —{' '}
              <a
                href='/docs/b2b-referral-hierarchy-guide.md'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary underline'
              >
                в гайде
              </a>
              .
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {saving && <Loader2 className='h-4 w-4 animate-spin' />}
            <Switch
              id='enable-partner-roles'
              checked={enabled}
              onCheckedChange={toggle}
              disabled={saving}
            />
          </div>
        </div>

        {enabled && (
          <>
            <div className='flex items-start justify-between gap-4 rounded-lg border p-4'>
              <div className='space-y-1'>
                <Label
                  htmlFor='enable-team-management'
                  className='cursor-pointer'
                >
                  Управление командой в боте
                </Label>
                <p className='text-muted-foreground text-sm'>
                  Менеджеры и директора видят команду, могут одобрять заявки и
                  убирать подопечных из своей ветки.
                </p>
              </div>
              <Switch
                id='enable-team-management'
                checked={teamManagement}
                onCheckedChange={toggleTeamManagement}
                disabled={saving}
              />
            </div>

            <div className='flex items-start justify-between gap-4 rounded-lg border p-4'>
              <div className='space-y-1'>
                <Label
                  htmlFor='join-requires-approval'
                  className='cursor-pointer'
                >
                  Заявки на вступление по реф. ссылке
                </Label>
                <p className='text-muted-foreground text-sm'>
                  Новый клиент по utm_ref не привязывается сразу — реферер
                  получает уведомление и подтверждает в Telegram.
                </p>
              </div>
              <Switch
                id='join-requires-approval'
                checked={joinApproval}
                onCheckedChange={toggleJoinApproval}
                disabled={saving || !teamManagement}
              />
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <Link
                href={`/dashboard/projects/${projectId}/referral/hierarchy`}
              >
                <Button
                  type='button'
                  variant='outline'
                  className='w-full justify-start'
                >
                  <Building2 className='mr-2 h-4 w-4' />
                  Открыть дерево партнёров
                  <ArrowRight className='ml-auto h-4 w-4 opacity-50' />
                </Button>
              </Link>
              <Button
                type='button'
                variant='outline'
                onClick={installTemplate}
                disabled={installing}
                className='w-full cursor-pointer justify-start'
              >
                {installing ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <PackagePlus className='mr-2 h-4 w-4' />
                )}
                Импортировать workflow «B2B Партнёр»
              </Button>
            </div>
          </>
        )}

        <div className='text-muted-foreground rounded-md border-l-2 border-amber-300 bg-amber-50/50 p-3 text-xs dark:border-amber-700 dark:bg-amber-950/20'>
          <strong>Что меняется при включении:</strong>
          <ul className='mt-1 list-inside list-disc space-y-0.5'>
            <li>Реферальную ссылку могут выдавать только партнёры</li>
            <li>Появляются колонка «Роль» и фильтр в таблице пользователей</li>
            <li>В боте — меню по роли (тренер, менеджер, руководитель)</li>
            <li>Уведомления о комиссии и новых членах команды</li>
            <li>Доступна страница иерархии и CSV-экспорт</li>
          </ul>
        </div>
      </CardContent>

      <Dialog open={showInstallSuccess} onOpenChange={setShowInstallSuccess}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
              <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
            <DialogTitle className='text-center text-xl'>
              Workflow импортирован
            </DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground py-2 text-center text-sm'>
            «B2B Партнёр» установлен и активирован. Проверьте сценарий в
            конструкторе и протестируйте бота в Telegram.
          </p>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowInstallSuccess(false)}
            >
              Закрыть
            </Button>
            <Button
              type='button'
              onClick={() => {
                const href = installedWorkflowId
                  ? `/dashboard/projects/${projectId}/workflow?workflowId=${installedWorkflowId}`
                  : `/dashboard/projects/${projectId}/workflow`;
                setShowInstallSuccess(false);
                router.push(href);
              }}
            >
              Перейти в конструктор
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
