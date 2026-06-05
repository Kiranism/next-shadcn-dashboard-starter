/**
 * @file: src/features/workflow/components/nodes/workflow-node-types.tsx
 * @description: Типы нод для React Flow конструктора workflow
 * @project: SaaS Bonus System
 * @dependencies: React Flow, Node components
 * @created: 2025-01-11
 * @author: AI Assistant + User
 */

import type { NodeTypes } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types/workflow';

// Import workflow node components
import { TriggerNode } from './trigger-node';
import { MessageNode } from './message-node';
import { ConditionNode } from './condition-node';
import { ActionNode } from './action-node';
import { DelayNode } from './delay-node';
import { EndNode } from './end-node';
import { ContactRequestNode } from './contact-request-node';
import { PartnerActionNode } from './partner-action-node';

// Define workflow node types mapping (новая система типов из плана)
export const workflowNodeTypes: NodeTypes = {
  // Триггеры - все используют TriggerNode
  'trigger.command': TriggerNode,
  'trigger.message': TriggerNode,
  'trigger.callback': TriggerNode,
  'trigger.webhook': TriggerNode,
  'trigger.schedule': TriggerNode,

  // Сообщения
  message: MessageNode,
  'message.keyboard.inline': MessageNode,
  'message.keyboard.reply': MessageNode,
  'message.photo': MessageNode,
  'message.video': MessageNode,
  'message.document': MessageNode,
  'message.edit': MessageNode,
  'message.delete': MessageNode,

  // Действия - все используют ActionNode
  'action.api_request': ActionNode,
  'action.database_query': ActionNode,
  'action.set_variable': ActionNode,
  'action.get_variable': ActionNode,
  'action.request_contact': ContactRequestNode,
  'action.send_notification': ActionNode,
  'action.check_user_linked': ActionNode,
  'action.find_user_by_contact': ActionNode,
  'action.link_telegram_account': ActionNode,
  'action.get_user_balance': ActionNode,
  'action.check_channel_subscription': ActionNode,
  'action.menu_command': ActionNode,

  // B2B партнёрские действия
  'action.partner_team': PartnerActionNode,
  'action.partner_subject_stats': PartnerActionNode,
  'action.partner_payouts': PartnerActionNode,
  'action.partner_link': PartnerActionNode,
  'action.partner_org_summary': PartnerActionNode,

  // Условия
  condition: ConditionNode,

  // Поток управления
  'flow.delay': DelayNode,
  'flow.loop': ActionNode,
  'flow.sub_workflow': ActionNode,
  'flow.jump': ActionNode,
  'flow.switch': ActionNode,
  'flow.end': EndNode,

  // Интеграции
  'integration.webhook': ActionNode,
  'integration.analytics': ActionNode
};
