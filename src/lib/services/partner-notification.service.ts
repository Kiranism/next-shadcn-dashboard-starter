/**
 * @file: src/lib/services/partner-notification.service.ts
 * @description: Уведомления партнёрам в b2b-иерархии — рассылка по дереву
 *               предков при появлении нового члена команды. Уведомления
 *               о начислении самой комиссии остаются в `sendBonusNotification`
 *               и обогащаются именем клиента/уровнем там же.
 * @project: SaaS Bonus System
 * @dependencies: db, logger, referral-commission.service, telegram bot-manager,
 *                max-bot bot-manager
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { cachedGetAncestorChain } from './referral-commission.service';
import { botManager } from '@/lib/telegram/bot-manager';
import { maxBotManager } from '@/lib/max-bot/bot-manager';

interface AncestorProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  telegramId: bigint | null;
  maxId: bigint | null;
  metadata: unknown;
  partnerRole: string | null;
}

interface NewMemberProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

const COMPONENT = 'partner-notification-service';

export class PartnerNotificationService {
  /**
   * Уведомить дерево предков о появлении нового члена команды.
   * Запускается из `UserService.createUser` сразу после
   * `syncAttributionForInvitedUser` (Phase 5.4) и работает неблокирующе:
   * исключения логируются, но не пробрасываются — иначе сломали бы
   * регистрацию пользователя.
   *
   * @see Requirement 7.2 — рассылка вверх по `Referral_Chain`
   * @see Requirement 7.3 — респект к настройкам бота / отсутствию `telegramId`
   * @see Requirement 7.4 — opt-out через `user.metadata.notifications.referralEvents`
   */
  static async notifyAncestorsAboutNewMember(
    newUserId: string,
    projectId: string
  ): Promise<void> {
    try {
      // 1) Проект с фичу-флагом и максимальной глубиной выплат.
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: {
          enablePartnerRoles: true,
          defaultReferralCommissionPlan: { select: { maxPayoutDepth: true } }
        }
      });

      // Phase 5.5 — без флага не уведомляем (legacy c2c-режим).
      if (!project?.enablePartnerRoles) {
        return;
      }

      const maxDepth =
        project.defaultReferralCommissionPlan?.maxPayoutDepth ?? 3;

      // 2) Профиль нового пользователя (для имени в сообщении).
      const newUser = (await db.user.findUnique({
        where: { id: newUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      })) as NewMemberProfile | null;

      if (!newUser) {
        logger.warn('notifyAncestorsAboutNewMember: new user not found', {
          newUserId,
          projectId,
          component: COMPONENT
        });
        return;
      }

      // 3) Цепочка предков (ближайший первый = level 1).
      const ancestors = await cachedGetAncestorChain(
        newUserId,
        projectId,
        maxDepth
      );
      if (ancestors.length === 0) {
        return;
      }

      // 4) Профили предков одним запросом (не делаем N запросов в цикле).
      const ancestorProfiles = (await db.user.findMany({
        where: { id: { in: ancestors } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          telegramId: true,
          maxId: true,
          metadata: true,
          partnerRole: true
        }
      })) as AncestorProfile[];

      const profileById = new Map<string, AncestorProfile>(
        ancestorProfiles.map((p) => [p.id, p])
      );
      const newMemberName = formatName(newUser);

      // 5) Идём по уровням в порядке возрастания глубины.
      for (let i = 0; i < ancestors.length; i += 1) {
        const ancestorId = ancestors[i];
        const level = i + 1;
        const profile = profileById.get(ancestorId);
        if (!profile) {
          continue;
        }

        // Phase 5.2 — opt-out: `metadata.notifications.referralEvents === false`.
        if (isOptedOut(profile.metadata)) {
          logger.info('partner-notification skipped (opt-out)', {
            ancestorId,
            projectId,
            level,
            component: COMPONENT
          });
          continue;
        }

        // Если ни одна платформа не привязана — пропускаем тихо (Requirement 7.3).
        if (!profile.telegramId && !profile.maxId) {
          continue;
        }

        const message = buildMessageForLevel(level, newMemberName);

        await this.dispatchPartnerNotification(projectId, profile, message);
      }
    } catch (error) {
      // Регистрация не должна падать из-за уведомлений.
      logger.error('notifyAncestorsAboutNewMember failed', {
        newUserId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
        component: COMPONENT
      });
    }
  }

  /**
   * Отправка одному партнёру в Telegram + MAX (паттерн как в
   * `sendBonusNotification`). Любая ошибка отправки логируется и не
   * пробрасывается дальше.
   *
   * Метод намеренно `static` (а не `private`) — упрощает unit-тестирование
   * через `jest.spyOn(PartnerNotificationService, 'dispatchPartnerNotification')`.
   *
   * @see Phase 5.3 — лог всех попыток
   */
  static async dispatchPartnerNotification(
    projectId: string,
    profile: Pick<
      AncestorProfile,
      'id' | 'telegramId' | 'maxId' | 'partnerRole'
    >,
    message: string,
    replyMarkup?: {
      inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
    }
  ): Promise<void> {
    // Telegram
    if (profile.telegramId) {
      try {
        const botInstance = botManager.getBot(projectId);
        if (botInstance?.isActive) {
          await botInstance.bot.api.sendMessage(
            Number(profile.telegramId),
            message,
            {
              parse_mode: 'HTML',
              ...(replyMarkup ? { reply_markup: replyMarkup } : {})
            }
          );
          logger.info('partner-notification sent (telegram)', {
            ancestorId: profile.id,
            projectId,
            component: COMPONENT
          });
        } else {
          logger.warn('partner-notification telegram bot inactive', {
            ancestorId: profile.id,
            projectId,
            component: COMPONENT
          });
        }
      } catch (err) {
        logger.warn('partner-notification telegram failed', {
          ancestorId: profile.id,
          projectId,
          err: err instanceof Error ? err.message : String(err),
          component: COMPONENT
        });
      }
    }

    // MAX
    if (profile.maxId) {
      try {
        await maxBotManager.sendMessageToUser(
          projectId,
          Number(profile.maxId),
          message
        );
        logger.info('partner-notification sent (max)', {
          ancestorId: profile.id,
          projectId,
          component: COMPONENT
        });
      } catch (err) {
        logger.warn('partner-notification max failed', {
          ancestorId: profile.id,
          projectId,
          err: err instanceof Error ? err.message : String(err),
          component: COMPONENT
        });
      }
    }
  }

  /**
   * Уведомить реферера о заявке на вступление (режим approve).
   */
  static async notifyJoinRequestPending(
    requestId: string,
    projectId: string
  ): Promise<void> {
    try {
      const request = await db.partnerJoinRequest.findFirst({
        where: { id: requestId, projectId, status: 'PENDING' }
      });
      if (!request) return;

      const [referrer, applicant] = await Promise.all([
        db.user.findFirst({
          where: { id: request.referrerId, projectId },
          select: {
            id: true,
            telegramId: true,
            maxId: true,
            partnerRole: true,
            metadata: true
          }
        }),
        db.user.findFirst({
          where: { id: request.userId, projectId },
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        })
      ]);

      if (!referrer || isOptedOut(referrer.metadata)) return;

      const name = formatName(applicant ?? {});
      const message = `📥 <b>Новая заявка</b>\n${name} хочет присоединиться к вашей команде.\n\nОдобрите или отклоните:`;

      await this.dispatchPartnerNotification(projectId, referrer, message, {
        inline_keyboard: [
          [
            {
              text: '✅ Принять',
              callback_data: `partner_join_approve:${requestId}`
            },
            {
              text: '❌ Отклонить',
              callback_data: `partner_join_reject:${requestId}`
            }
          ],
          [{ text: '📥 Все заявки', callback_data: 'partner_requests' }]
        ]
      });
    } catch (error) {
      logger.error('notifyJoinRequestPending failed', {
        requestId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
        component: COMPONENT
      });
    }
  }
}

/**
 * Шаблон сообщения зависит от уровня в цепочке предков.
 * L1 — прямой рекрутер, L2 — менеджер, L3+ — директор.
 *
 * @see Requirement 7.2
 */
function buildMessageForLevel(level: number, newMemberName: string): string {
  if (level === 1) {
    return `🎉 Новый клиент в вашей команде: ${newMemberName}`;
  }
  if (level === 2) {
    return `📈 У вашего тренера новый клиент: ${newMemberName}`;
  }
  return `📊 В вашей организации новая регистрация: ${newMemberName}`;
}

/**
 * Извлекает имя пользователя из имени/фамилии/телефона.
 * Возвращает безопасный fallback если ничего нет.
 */
function formatName(u: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}): string {
  const fn = (u.firstName ?? '').trim();
  const ln = (u.lastName ?? '').trim();
  const full = `${fn} ${ln}`.trim();
  if (full) return full;
  if (u.phone) return u.phone;
  return 'новый партнёр';
}

/**
 * Проверка opt-out флага в `user.metadata.notifications.referralEvents`.
 * По умолчанию подписан, off-by — только когда явно поставили `false`.
 */
function isOptedOut(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  const notifications = m.notifications;
  if (!notifications || typeof notifications !== 'object') return false;
  const flag = (notifications as Record<string, unknown>).referralEvents;
  return flag === false;
}
