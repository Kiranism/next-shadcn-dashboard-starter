/**
 * @file: partner-role-badge.tsx
 * @description: Цветной badge для отображения партнёрской роли
 *               (b2b-referral-hierarchy Phase 2). Используется в таблице
 *               пользователей и в диалогах профиля.
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui Badge
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PartnerRole = 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';

const ROLE_LABEL: Record<PartnerRole, string> = {
  CLIENT: 'Клиент',
  TRAINER: 'Тренер',
  MANAGER: 'Менеджер',
  DIRECTOR: 'Руководитель'
};

const ROLE_CLASS: Record<PartnerRole, string> = {
  CLIENT: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-300',
  TRAINER: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300',
  MANAGER:
    'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-300',
  DIRECTOR:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-300'
};

interface PartnerRoleBadgeProps {
  role: PartnerRole | string | null | undefined;
  className?: string;
}

export const PARTNER_ROLE_OPTIONS: Array<{
  value: PartnerRole;
  label: string;
}> = (Object.keys(ROLE_LABEL) as PartnerRole[]).map((value) => ({
  value,
  label: ROLE_LABEL[value]
}));

export function getPartnerRoleLabel(role?: string | null): string {
  if (!role) return ROLE_LABEL.CLIENT;
  return ROLE_LABEL[role as PartnerRole] ?? role;
}

/**
 * Цветной badge с локализованным названием партнёрской роли.
 * Если передана неизвестная строка — фолбэк на CLIENT-стиль.
 */
export function PartnerRoleBadge({ role, className }: PartnerRoleBadgeProps) {
  const safeRole: PartnerRole =
    role && role in ROLE_LABEL ? (role as PartnerRole) : 'CLIENT';

  return (
    <Badge
      variant='outline'
      className={cn(ROLE_CLASS[safeRole], 'font-medium', className)}
    >
      {ROLE_LABEL[safeRole]}
    </Badge>
  );
}
