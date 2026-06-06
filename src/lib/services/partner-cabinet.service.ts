/**
 * @file: partner-cabinet.service.ts
 * @description: Обработка callback-кнопок партнёрского кабинета в Telegram/MAX
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import type { Context } from 'grammy';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  PartnerTeamService,
  type TeamListFilter
} from './partner-team.service';

function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatName(u: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
}): string {
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || u.phone || u.email || 'Без имени';
}

function roleLabel(role: string): string {
  switch (role) {
    case 'DIRECTOR':
      return 'Руководитель';
    case 'MANAGER':
      return 'Менеджер';
    case 'TRAINER':
      return 'Тренер';
    default:
      return 'Клиент';
  }
}

async function resolveUserId(
  projectId: string,
  ctx: Context
): Promise<string | null> {
  const fromId = ctx.from?.id;
  if (!fromId) return null;

  const user = await db.user.findFirst({
    where: { projectId, telegramId: BigInt(fromId) },
    select: { id: true, partnerRole: true }
  });
  return user?.id ?? null;
}

const FILTER_LABELS: Record<TeamListFilter, string> = {
  direct: 'Прямые',
  clients: 'Клиенты',
  partners: 'Партнёры',
  all: 'Вся команда'
};

export class PartnerCabinetService {
  static async tryHandleTelegramCallback(
    projectId: string,
    ctx: Context
  ): Promise<boolean> {
    const data = ctx.callbackQuery?.data;
    if (!data) return false;

    const userId = await resolveUserId(projectId, ctx);
    if (!userId) return false;

    try {
      if (data.startsWith('partner_join_approve:')) {
        const requestId = data.split(':')[1];
        await PartnerTeamService.approveJoinRequest({
          projectId,
          requestId,
          reviewerUserId: userId
        });
        await ctx.answerCallbackQuery({ text: '✅ Заявка одобрена' });
        await ctx.reply('✅ Клиент добавлен в вашу команду.');
        return true;
      }

      if (data.startsWith('partner_join_reject:')) {
        const requestId = data.split(':')[1];
        await PartnerTeamService.rejectJoinRequest({
          projectId,
          requestId,
          reviewerUserId: userId
        });
        await ctx.answerCallbackQuery({ text: 'Заявка отклонена' });
        await ctx.reply('❌ Заявка отклонена.');
        return true;
      }

      if (data.startsWith('partner_team_remove:')) {
        const subjectId = data.split(':')[1];
        await PartnerTeamService.removeFromTeam({
          projectId,
          managerUserId: userId,
          subjectUserId: subjectId
        });
        await ctx.answerCallbackQuery({ text: 'Убран из команды' });
        await ctx.reply('👤 Участник убран из вашей команды.');
        return true;
      }

      if (data === 'partner_requests') {
        await this.renderPendingRequests(projectId, userId, ctx);
        return true;
      }

      if (data.startsWith('partner_team_page:')) {
        const page = Number.parseInt(data.split(':')[1] ?? '0', 10);
        await this.renderTeamList(
          projectId,
          userId,
          ctx,
          'direct',
          Number.isFinite(page) && page >= 0 ? page : 0
        );
        return true;
      }

      if (data.startsWith('partner_team_tab:')) {
        const parts = data.split(':');
        const filter = (parts[1] ?? 'direct') as TeamListFilter;
        const page = Number.parseInt(parts[2] ?? '0', 10);
        await this.renderTeamList(projectId, userId, ctx, filter, page);
        return true;
      }
    } catch (err) {
      logger.warn('PartnerCabinetService callback failed', {
        data,
        projectId,
        err: err instanceof Error ? err.message : String(err)
      });
      await ctx
        .answerCallbackQuery({
          text: err instanceof Error ? err.message : 'Ошибка',
          show_alert: true
        })
        .catch(() => {});
      return true;
    }

    return false;
  }

  static async renderTeamList(
    projectId: string,
    userId: string,
    ctx: Context,
    filter: TeamListFilter = 'direct',
    page = 0,
    pageSize = 5
  ) {
    const me = await db.user.findFirst({
      where: { id: userId, projectId },
      select: { partnerRole: true }
    });

    const result = await PartnerTeamService.listTeam({
      projectId,
      viewerUserId: userId,
      filter,
      page: page + 1,
      pageSize
    });

    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

    if (result.total === 0) {
      await ctx.reply(
        `👥 <b>Моя команда</b> · ${FILTER_LABELS[filter]}\n\nПока пусто.`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    const lines = [
      `<b>👥 Моя команда</b> · ${FILTER_LABELS[filter]} (${result.total})`,
      `Стр. ${page + 1} / ${totalPages}`,
      ''
    ];

    result.items.forEach((u, idx) => {
      lines.push(
        `${idx + 1 + page * pageSize}. <b>${u.name}</b> · ${roleLabel(u.partnerRole)}\n   💼 ${formatRub(u.totalPurchases)} · 💰 ${formatRub(u.commissionEarned)}`
      );
    });

    const canManage = me && me.partnerRole !== 'CLIENT';

    const detailButtons = result.items.map((u) => {
      const row: Array<{ text: string; callback_data: string }> = [
        {
          text: `📊 ${u.name.slice(0, 20)}`,
          callback_data: `partner_subject:${u.id}`
        }
      ];
      if (
        canManage &&
        u.id !== userId &&
        !['DIRECTOR', 'MANAGER'].includes(u.partnerRole)
      ) {
        row.push({
          text: '➖',
          callback_data: `partner_team_remove:${u.id}`
        });
      }
      return row;
    });

    const tabRow = [
      { text: '👤 Клиенты', callback_data: 'partner_team_tab:clients:0' },
      { text: '🏃 Партнёры', callback_data: 'partner_team_tab:partners:0' },
      { text: '🌳 Все', callback_data: 'partner_team_tab:all:0' }
    ];

    const pager: Array<{ text: string; callback_data: string }> = [];
    if (page > 0) {
      pager.push({
        text: '⬅️',
        callback_data: `partner_team_tab:${filter}:${page - 1}`
      });
    }
    if (page + 1 < totalPages) {
      pager.push({
        text: '➡️',
        callback_data: `partner_team_tab:${filter}:${page + 1}`
      });
    }

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          tabRow,
          ...detailButtons,
          ...(pager.length ? [pager] : []),
          [{ text: '📥 Заявки', callback_data: 'partner_requests' }],
          [{ text: '⬅️ Меню', callback_data: 'back_to_menu' }]
        ]
      }
    });
  }

  static async renderPendingRequests(
    projectId: string,
    userId: string,
    ctx: Context
  ) {
    const requests = await PartnerTeamService.listPendingRequestsForReviewer(
      projectId,
      userId
    );

    if (requests.length === 0) {
      await ctx.reply('📥 Нет ожидающих заявок.');
      return;
    }

    for (const req of requests.slice(0, 5)) {
      const name = req.user ? formatName(req.user) : req.userId;
      await ctx.reply(`📥 <b>Заявка</b>\n${name}`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Принять',
                callback_data: `partner_join_approve:${req.id}`
              },
              {
                text: '❌ Отклонить',
                callback_data: `partner_join_reject:${req.id}`
              }
            ]
          ]
        }
      });
    }
  }
}
