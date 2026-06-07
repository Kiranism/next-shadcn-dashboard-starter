/**
 * @file: src/features/workflow/components/node-config-panels/schedule-trigger-config.tsx
 * @description: Редактор конфига триггера trigger.schedule (cron + аудитория + дедуп).
 *               Включает превью аудитории через POST /api/projects/:id/workflows/audience-preview.
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';
import type {
  ScheduleTriggerConfig,
  AudienceConfig,
  WorkflowNodeConfig
} from '@/types/workflow';

interface ScheduleTriggerConfigProps {
  nodeConfig: WorkflowNodeConfig;
  setNodeConfig: React.Dispatch<React.SetStateAction<WorkflowNodeConfig>>;
  projectId?: string;
}

const DEFAULT_CONFIG: ScheduleTriggerConfig = {
  cron: '0 9 * * *',
  timezone: 'Europe/Moscow',
  audience: { type: 'birthday_today' },
  dedupeWindow: 'year'
};

/** Часто используемые часовые пояса для быстрого выбора. */
const TIMEZONE_PRESETS = [
  { value: 'Europe/Moscow', label: 'Europe/Moscow (UTC+3)' },
  { value: 'Europe/Kaliningrad', label: 'Europe/Kaliningrad (UTC+2)' },
  { value: 'Europe/Samara', label: 'Europe/Samara (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Asia/Yekaterinburg (UTC+5)' },
  { value: 'Asia/Novosibirsk', label: 'Asia/Novosibirsk (UTC+7)' },
  { value: 'Asia/Vladivostok', label: 'Asia/Vladivostok (UTC+10)' },
  { value: 'UTC', label: 'UTC' }
];

const CRON_PRESETS = [
  { label: 'Каждый день в 9:00', value: '0 9 * * *' },
  { label: 'Каждый день в 12:00', value: '0 12 * * *' },
  { label: 'Каждый день в 18:00', value: '0 18 * * *' },
  { label: 'Понедельник в 10:00', value: '0 10 * * MON' },
  { label: 'Каждые 30 минут', value: '*/30 * * * *' }
];

export function ScheduleTriggerConfigPanel({
  nodeConfig,
  setNodeConfig,
  projectId
}: ScheduleTriggerConfigProps) {
  const config: ScheduleTriggerConfig =
    nodeConfig['trigger.schedule'] ?? DEFAULT_CONFIG;

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    total: number;
    type: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const updateConfig = useCallback(
    (patch: Partial<ScheduleTriggerConfig>) => {
      setNodeConfig((prev) => ({
        ...prev,
        'trigger.schedule': {
          ...DEFAULT_CONFIG,
          ...(prev['trigger.schedule'] ?? {}),
          ...patch
        }
      }));
    },
    [setNodeConfig]
  );

  const updateAudience = useCallback(
    (patch: Partial<AudienceConfig>) => {
      const current = config.audience ?? { type: 'birthday_today' };
      updateConfig({
        audience: {
          ...current,
          ...patch,
          params: {
            ...(current.params ?? {}),
            ...(patch.params ?? {})
          }
        }
      });
    },
    [config.audience, updateConfig]
  );

  const handlePreview = useCallback(async () => {
    if (!projectId) {
      setPreviewError('Сначала сохраните workflow для проекта');
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/workflows/audience-preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config.audience)
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPreviewResult({ total: data.total, type: data.type });
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Ошибка');
      setPreviewResult(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [config.audience, projectId]);

  const audienceType = config.audience?.type ?? 'birthday_today';
  const daysBefore = useMemo(
    () => config.audience?.params?.daysBefore ?? 7,
    [config.audience?.params?.daysBefore]
  );
  const daysAfter = useMemo(
    () => config.audience?.params?.daysAfter ?? 1,
    [config.audience?.params?.daysAfter]
  );

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='scheduleCron'>Cron-выражение</Label>
        <Input
          id='scheduleCron'
          value={config.cron}
          onChange={(e) => updateConfig({ cron: e.target.value })}
          placeholder='0 9 * * *'
          className='font-mono'
        />
        <div className='flex flex-wrap gap-1'>
          {CRON_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type='button'
              variant='outline'
              size='sm'
              onClick={() => updateConfig({ cron: preset.value })}
              className='h-7 text-xs'
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>
          Формат: мин час день_месяца месяц день_недели
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='scheduleTimezone'>Часовой пояс</Label>
        <Select
          value={config.timezone || 'Europe/Moscow'}
          onValueChange={(v) => updateConfig({ timezone: v })}
        >
          <SelectTrigger id='scheduleTimezone'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_PRESETS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='audienceType'>Аудитория</Label>
        <Select
          value={audienceType}
          onValueChange={(v) =>
            updateAudience({ type: v as AudienceConfig['type'] })
          }
        >
          <SelectTrigger id='audienceType'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='birthday_today'>
              🎂 День рождения сегодня
            </SelectItem>
            <SelectItem value='birthday_in_days'>
              📅 За N дней до дня рождения
            </SelectItem>
            <SelectItem value='birthday_after_days'>
              📆 Через N дней после дня рождения
            </SelectItem>
            <SelectItem value='all_active_users'>
              👥 Все активные пользователи
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {audienceType === 'birthday_in_days' && (
        <div className='space-y-2'>
          <Label htmlFor='daysBefore'>За сколько дней до ДР</Label>
          <Input
            id='daysBefore'
            type='number'
            min={1}
            max={365}
            value={daysBefore}
            onChange={(e) =>
              updateAudience({
                params: { daysBefore: Number(e.target.value) }
              })
            }
          />
        </div>
      )}

      {audienceType === 'birthday_after_days' && (
        <div className='space-y-2'>
          <Label htmlFor='daysAfter'>Через сколько дней после ДР</Label>
          <Input
            id='daysAfter'
            type='number'
            min={1}
            max={365}
            value={daysAfter}
            onChange={(e) =>
              updateAudience({
                params: { daysAfter: Number(e.target.value) }
              })
            }
          />
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='dedupeWindow'>Защита от повторов</Label>
        <Select
          value={config.dedupeWindow ?? 'day'}
          onValueChange={(v) =>
            updateConfig({
              dedupeWindow: v as ScheduleTriggerConfig['dedupeWindow']
            })
          }
        >
          <SelectTrigger id='dedupeWindow'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='day'>Раз в сутки</SelectItem>
            <SelectItem value='week'>Раз в неделю</SelectItem>
            <SelectItem value='month'>Раз в месяц</SelectItem>
            <SelectItem value='year'>Раз в год (для ДР)</SelectItem>
            <SelectItem value='none'>Без дедупликации</SelectItem>
          </SelectContent>
        </Select>
        <p className='text-muted-foreground text-xs'>
          Не запускать workflow для одного пользователя чаще, чем раз в
          выбранный период.
        </p>
      </div>

      <div className='bg-muted/30 space-y-2 rounded-md border p-3'>
        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2 text-sm font-medium'>
            <Users className='h-4 w-4' />
            Превью аудитории
          </span>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            onClick={handlePreview}
            disabled={previewLoading || !projectId}
          >
            {previewLoading && (
              <Loader2 className='mr-2 h-3 w-3 animate-spin' />
            )}
            Посчитать
          </Button>
        </div>
        {previewResult && (
          <p className='text-sm'>
            Под условие подходит <strong>{previewResult.total}</strong>{' '}
            {previewResult.total === 1 ? 'пользователь' : 'пользователей'}
          </p>
        )}
        {previewError && (
          <p className='text-destructive text-xs'>{previewError}</p>
        )}
        {!previewResult && !previewError && !previewLoading && (
          <p className='text-muted-foreground text-xs'>
            Нажмите «Посчитать» — узнаете, сколько пользователей сейчас попадает
            под условие.
          </p>
        )}
      </div>
    </div>
  );
}
