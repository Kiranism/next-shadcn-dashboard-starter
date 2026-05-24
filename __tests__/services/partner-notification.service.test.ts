/**
 * @file: __tests__/services/partner-notification.service.test.ts
 * @description: Тесты Phase 5 — `PartnerNotificationService.notifyAncestorsAboutNewMember`.
 *               5.7 — рассылка трём предкам в b2b-проекте
 *               5.8 — opt-out одного из предков (получают только остальные)
 *               5.9 — без `enablePartnerRoles` уведомления не отправляются
 *
 *               Подменяем `db`, `botManager`, `maxBotManager` через `jest.mock`
 *               (паттерн как в `referral-commission.service.grants.test.ts`
 *               и `partner-actions.test.ts`).
 *               Цепочка предков моделируется через мок `db.$queryRaw` —
 *               `getAncestorChain` (через `cachedGetAncestorChain`) обращается
 *               к нему через `Prisma.sql` template.
 * @project: SaaS Bonus System
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { PartnerNotificationService } from '@/lib/services/partner-notification.service';
import { db } from '@/lib/db';
import { botManager } from '@/lib/telegram/bot-manager';
import { maxBotManager } from '@/lib/max-bot/bot-manager';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/lib/telegram/bot-manager', () => ({
  botManager: {
    getBot: jest.fn()
  }
}));
jest.mock('@/lib/max-bot/bot-manager', () => ({
  maxBotManager: {
    sendMessageToUser: jest.fn().mockResolvedValue(undefined)
  }
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

type TreeNode = {
  id: string;
  referredBy: string | null;
};

interface InMemoryTree {
  byId: Map<string, TreeNode>;
}

function buildTree(nodes: TreeNode[]): InMemoryTree {
  const byId = new Map<string, TreeNode>();
  for (const n of nodes) byId.set(n.id, n);
  return { byId };
}

function ancestorsOf(tree: InMemoryTree, id: string, depth: number): string[] {
  const out: string[] = [];
  let cursor: string | null = id;
  let d = 0;
  while (cursor && d < depth) {
    const node = tree.byId.get(cursor);
    if (!node?.referredBy) break;
    out.push(node.referredBy);
    cursor = node.referredBy;
    d += 1;
  }
  return out;
}

function mockQueryRaw(tree: InMemoryTree) {
  return jest.fn(async (input: any) => {
    const sql: string = (input?.strings ?? []).join(' ');
    const values: unknown[] = input?.values ?? [];
    const rootId = values[0] as string;
    const depth = (values.find((v) => typeof v === 'number') as number) ?? 3;
    if (sql.includes('JOIN ancestors')) {
      return ancestorsOf(tree, rootId, depth).map((id, i) => ({
        id,
        depth: i + 1
      }));
    }
    return [];
  });
}

interface AncestorRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  telegramId: bigint | null;
  maxId: bigint | null;
  metadata: Record<string, unknown> | null;
  partnerRole: string | null;
}

interface NewMemberRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

function setupBotMock() {
  const sendMessage = jest.fn().mockResolvedValue(undefined);
  (botManager.getBot as jest.Mock).mockReturnValue({
    isActive: true,
    bot: { api: { sendMessage } }
  });
  return sendMessage;
}

function inactiveBot() {
  (botManager.getBot as jest.Mock).mockReturnValue(undefined);
}

// ──────────────────────────────────────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────────────────────────────────────

describe('PartnerNotificationService.notifyAncestorsAboutNewMember (Phase 5)', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'project-b2b';
  const newUserId = 'new-client';

  // Цепочка: director → manager → trainer → newUser
  const ancestorIds = ['trainer', 'manager', 'director']; // ближайший первый
  const tree = buildTree([
    { id: 'director', referredBy: null },
    { id: 'manager', referredBy: 'director' },
    { id: 'trainer', referredBy: 'manager' },
    { id: newUserId, referredBy: 'trainer' }
  ]);

  function setupNewUserAndAncestors(opts?: {
    optedOutId?: string;
    withoutBots?: boolean;
  }) {
    mockDb.user.findUnique = jest.fn(async ({ where }: any) => {
      if (where?.id === newUserId) {
        return {
          id: newUserId,
          firstName: 'Иван',
          lastName: 'Петров',
          phone: '+79001112233'
        } as NewMemberRow as any;
      }
      return null;
    }) as any;

    mockDb.user.findMany = jest.fn(async ({ where }: any) => {
      const ids: string[] = where?.id?.in ?? [];
      const profiles: AncestorRow[] = [];
      for (const id of ids) {
        const isOpted = opts?.optedOutId === id;
        profiles.push({
          id,
          firstName: id,
          lastName: 'Партнёров',
          phone: null,
          telegramId: opts?.withoutBots
            ? null
            : (BigInt(`100${id.length}`) as any),
          maxId: null,
          metadata: isOpted
            ? { notifications: { referralEvents: false } }
            : null,
          partnerRole:
            id === 'trainer'
              ? 'TRAINER'
              : id === 'manager'
                ? 'MANAGER'
                : 'DIRECTOR'
        });
      }
      return profiles as any;
    }) as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb as any).$queryRaw = mockQueryRaw(tree);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5.7 — три уведомления по числу предков
  // ───────────────────────────────────────────────────────────────────────────
  it('5.7 — отправляет 3 уведомления (по числу предков) при включённом enablePartnerRoles', async () => {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        enablePartnerRoles: true,
        defaultReferralCommissionPlan: { maxPayoutDepth: 3 }
      })
    };
    setupNewUserAndAncestors();
    const sendMessage = setupBotMock();

    await PartnerNotificationService.notifyAncestorsAboutNewMember(
      newUserId,
      projectId
    );

    expect(sendMessage).toHaveBeenCalledTimes(3);

    // Уровни от 1 до 3, проверяем форматы.
    const messages = sendMessage.mock.calls.map((c) => c[1] as string);
    expect(
      messages.some((m) => m.includes('🎉 Новый клиент в вашей команде'))
    ).toBe(true);
    expect(
      messages.some((m) => m.includes('📈 У вашего тренера новый клиент'))
    ).toBe(true);
    expect(
      messages.some((m) =>
        m.includes('📊 В вашей организации новая регистрация')
      )
    ).toBe(true);

    // Имя нового клиента подставляется.
    for (const m of messages) {
      expect(m).toContain('Иван Петров');
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5.8 — opt-out: один не получает, остальные получают
  // ───────────────────────────────────────────────────────────────────────────
  it('5.8 — opt-out у одного предка: пропускает его, отправляет остальным двум', async () => {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        enablePartnerRoles: true,
        defaultReferralCommissionPlan: { maxPayoutDepth: 3 }
      })
    };
    setupNewUserAndAncestors({ optedOutId: 'manager' });
    const sendMessage = setupBotMock();

    await PartnerNotificationService.notifyAncestorsAboutNewMember(
      newUserId,
      projectId
    );

    expect(sendMessage).toHaveBeenCalledTimes(2);

    // Сообщение «уровень 2» (для менеджера) НЕ должно быть отправлено.
    const messages = sendMessage.mock.calls.map((c) => c[1] as string);
    expect(messages.some((m) => m.includes('📈 У вашего тренера'))).toBe(false);

    // А «уровень 1» и «уровень 3» — должны.
    expect(
      messages.some((m) => m.includes('🎉 Новый клиент в вашей команде'))
    ).toBe(true);
    expect(
      messages.some((m) =>
        m.includes('📊 В вашей организации новая регистрация')
      )
    ).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5.9 — без флага enablePartnerRoles ничего не отправляется
  // ───────────────────────────────────────────────────────────────────────────
  it('5.9 — enablePartnerRoles = false: ни одного вызова sendMessage / maxBotManager', async () => {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        enablePartnerRoles: false,
        defaultReferralCommissionPlan: { maxPayoutDepth: 3 }
      })
    };
    setupNewUserAndAncestors();
    const sendMessage = setupBotMock();

    await PartnerNotificationService.notifyAncestorsAboutNewMember(
      newUserId,
      projectId
    );

    expect(sendMessage).not.toHaveBeenCalled();
    expect(maxBotManager.sendMessageToUser).not.toHaveBeenCalled();
    // Цепочку предков даже не запрашивали — early return до $queryRaw.
    expect((mockDb as any).$queryRaw).not.toHaveBeenCalled();
    // findMany по предкам тоже не вызывался.
    expect(mockDb.user.findMany).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Дополнительная гарантия: предок без telegramId/maxId — пропускается тихо
  // ───────────────────────────────────────────────────────────────────────────
  it('Requirement 7.3 — предки без telegramId/maxId пропускаются без ошибок', async () => {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        enablePartnerRoles: true,
        defaultReferralCommissionPlan: { maxPayoutDepth: 3 }
      })
    };
    setupNewUserAndAncestors({ withoutBots: true });
    const sendMessage = setupBotMock();

    await PartnerNotificationService.notifyAncestorsAboutNewMember(
      newUserId,
      projectId
    );

    expect(sendMessage).not.toHaveBeenCalled();
    expect(maxBotManager.sendMessageToUser).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Не падаем когда бот неактивен — просто логируем warn
  // ───────────────────────────────────────────────────────────────────────────
  it('не падает если getBot возвращает undefined (бот не запущен)', async () => {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        enablePartnerRoles: true,
        defaultReferralCommissionPlan: { maxPayoutDepth: 3 }
      })
    };
    setupNewUserAndAncestors();
    inactiveBot();

    await expect(
      PartnerNotificationService.notifyAncestorsAboutNewMember(
        newUserId,
        projectId
      )
    ).resolves.toBeUndefined();
  });
});
