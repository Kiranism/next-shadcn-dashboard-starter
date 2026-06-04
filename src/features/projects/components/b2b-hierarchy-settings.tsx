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
  PackagePlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  /** Sub текущего админа (для install-шаблона). */
  adminSub?: string;
  /** Колбэк после успешного toggle — родитель может перечитать проект. */
  onToggled?: (value: boolean) => void;
}

const BOT_TEMPLATE_ID = 'b2b-partner-cabinet';

export function B2bHierarchySettings({
  projectId,
  initialValue,
  adminSub,
  onToggled
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(Boolean(initialValue));
  const [saving, setSaving] = useState(false);
  const [installing, setInstalling] = useState(false);
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

  const toggle = async (next: boolean) => {
    setSaving(true);
    // Оптимистично переключаем — откатываем если PATCH упадёт.
    setEnabled(next);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enablePartnerRoles: next })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось сохранить');
      }
      toast({
        title: next ? 'B2B-иерархия включена' : 'B2B-иерархия выключена',
        description: next
          ? 'Доступны роли партнёров, страница иерархии и фильтр findReferrer.'
          : 'Поведение возвращено к c2c-режиму. Существующие назначения ролей сохранены.'
      });
      onToggled?.(next);
      router.refresh();
    } catch (e) {
      setEnabled(!next); // rollback
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось сохранить',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
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
      toast({
        title: 'Workflow «B2B Партнёр» импортирован',
        description:
          'Откройте конструктор workflow, чтобы настроить меню под свою команду.'
      });
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
          <div className='grid gap-3 sm:grid-cols-2'>
            <Link href={`/dashboard/projects/${projectId}/referral/hierarchy`}>
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
    </Card>
  );
}
