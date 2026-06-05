/**
 * @file: callback-trigger-match.ts
 * @description: Сопоставление incoming callback_data с trigger.callback нодами workflow
 * @project: SaaS Bonus System
 * @dependencies: workflow types
 * @created: 2026-06-04
 * @author: AI Assistant + User
 */

import type { WorkflowNode } from '@/types/workflow';

/** Читает паттерн из конфига ноды (поддерживает legacy поле `data`). */
export function getTriggerCallbackPattern(
  node: WorkflowNode
): string | undefined {
  const cfg = node.data?.config?.['trigger.callback'] as
    | { callbackData?: string; data?: string }
    | undefined;
  const pattern = cfg?.callbackData ?? cfg?.data;
  return typeof pattern === 'string' && pattern.length > 0
    ? pattern
    : undefined;
}

/**
 * Совпадение callback_data с паттерном триггера.
 * Точное совпадение или префикс `pattern:param` (пагинация, id подопечного).
 */
export function matchesCallbackPattern(
  pattern: string,
  incoming: string
): boolean {
  if (pattern === incoming) return true;
  return incoming.startsWith(`${pattern}:`);
}

/** Ищет trigger.callback ноду для входящего callback_data. */
export function findCallbackTriggerNode(
  nodes: WorkflowNode[],
  incomingCallbackData: string
): WorkflowNode | undefined {
  for (const node of nodes) {
    if (node.type !== 'trigger.callback') continue;
    const pattern = getTriggerCallbackPattern(node);
    if (pattern && matchesCallbackPattern(pattern, incomingCallbackData)) {
      return node;
    }
  }
  return undefined;
}
