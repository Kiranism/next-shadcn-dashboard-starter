/**
 * @file: src/features/workflow/components/nodes/trigger-node.tsx
 * @description: Компонент ноды "Триггер" для конструктора workflow
 * @project: SaaS Bonus System
 * @dependencies: React Flow, shadcn/ui
 * @created: 2025-01-11
 * @author: AI Assistant + User
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';
import type { WorkflowNodeData } from '@/types/workflow';

export const TriggerNode = memo(({ data }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const triggerType = nodeData.type;
  const config = nodeData.config || {};
  const triggerValue =
    config['trigger.command']?.command ||
    config['trigger.message']?.pattern ||
    config['trigger.callback']?.callbackData ||
    config['trigger.schedule']?.cron ||
    'Нажмите для редактирования';

  const getTriggerDisplayText = () => {
    switch (triggerType) {
      case 'trigger.command':
        return `Команда: ${triggerValue}`;
      case 'trigger.message':
        return `Сообщение: ${triggerValue}`;
      case 'trigger.callback':
        return `Callback: ${triggerValue}`;
      case 'trigger.webhook':
        return `Webhook: ${triggerValue}`;
      case 'trigger.contact':
        return 'Получен контакт';
      case 'trigger.schedule': {
        const audienceType = config['trigger.schedule']?.audience?.type;
        const audienceLabel = (() => {
          switch (audienceType) {
            case 'birthday_today':
              return 'день рождения';
            case 'birthday_in_days':
              return `за ${config['trigger.schedule']?.audience?.params?.daysBefore ?? '?'} дн. до ДР`;
            case 'all_active_users':
              return 'все активные';
            default:
              return audienceType ?? 'аудитория не выбрана';
          }
        })();
        return `${triggerValue} · ${audienceLabel}`;
      }
      default: {
        const typeLabel = triggerType
          ? String(triggerType).replace('trigger.', '')
          : 'Старт';
        return `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}: ${triggerValue}`;
      }
    }
  };

  return (
    <Card className='w-64 border-green-500 shadow-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>
          <Play className='mr-2 inline-block h-4 w-4 text-green-500' />
          {nodeData.label}
        </CardTitle>
        <span className='text-muted-foreground text-xs'>Триггер</span>
      </CardHeader>
      <CardContent className='space-y-2'>
        <p className='text-muted-foreground line-clamp-2 text-sm'>
          {getTriggerDisplayText()}
        </p>
      </CardContent>
      <Handle
        type='source'
        position={Position.Bottom}
        className='!h-4 !w-4 !border-2 !bg-green-500'
        style={{
          width: '14px',
          height: '14px',
          border: '2px solid white',
          borderRadius: '50%'
        }}
      />
    </Card>
  );
});

TriggerNode.displayName = 'TriggerNode';
