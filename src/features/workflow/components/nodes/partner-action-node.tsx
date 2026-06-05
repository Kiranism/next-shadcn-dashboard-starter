/**
 * @file: partner-action-node.tsx
 * @description: Ноды B2B-партнёрских действий в конструкторе workflow
 * @project: SaaS Bonus System
 * @dependencies: React Flow, shadcn/ui
 * @created: 2026-06-04
 * @author: AI Assistant + User
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkflowNodeData, WorkflowNodeType } from '@/types/workflow';

const PARTNER_ACTION_HINTS: Partial<Record<WorkflowNodeType, string>> = {
  'action.partner_org_summary': 'Сводка по организации (только DIRECTOR)',
  'action.partner_team': 'Список команды с пагинацией',
  'action.partner_link': 'Реферальная ссылка партнёра',
  'action.partner_payouts': 'История реферальных выплат',
  'action.partner_subject_stats': 'Статистика подопечного'
};

export const PartnerActionNode = memo(({ data, type }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const hint =
    (type && PARTNER_ACTION_HINTS[type as WorkflowNodeType]) ||
    'B2B действие партнёра';

  return (
    <Card className='w-64 border-indigo-500 shadow-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>
          <Building2 className='mr-2 inline-block h-4 w-4 text-indigo-500' />
          {nodeData.label}
        </CardTitle>
        <span className='rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'>
          B2B
        </span>
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className='text-muted-foreground line-clamp-2 text-sm'>{hint}</p>
        {type ? (
          <p className='font-mono text-[10px] text-indigo-600/80 dark:text-indigo-300/80'>
            {type}
          </p>
        ) : null}
      </CardContent>
      <Handle
        type='target'
        position={Position.Top}
        className='!border-2 !bg-indigo-500'
        style={{
          width: 14,
          height: 14,
          border: '2px solid white',
          borderRadius: '50%'
        }}
      />
      <Handle
        type='source'
        position={Position.Bottom}
        className='!border-2 !bg-indigo-500'
        style={{
          width: 14,
          height: 14,
          border: '2px solid white',
          borderRadius: '50%'
        }}
      />
    </Card>
  );
});

PartnerActionNode.displayName = 'PartnerActionNode';
