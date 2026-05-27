/**
 * @file: __tests__/services/workflow/partner-actions.test.ts
 * @description: Integration tests для Phase 4 (Bot Partner Cabinet) — проверяет
 *               что Phase 3 service helpers корректно работают на сценарии
 *               «1 директор → 2 менеджера → 5 тренеров → 20 клиентов» при
 *               `enablePartnerRoles = true`.
 *               4.12 — построение тестового дерева
 *               4.13 — менеджер видит ровно своих 5 тренеров (cachedGetDescendantTree)
 *               4.14 — тренер не может смотреть менеджера (cachedCanViewSubject)
 *
 *               Намеренно тестируем service layer (а не классы хендлеров) —
 *               у хендлеров много рантайм-зависимостей (sendPlatformMessage,
 *               http-клиент, telegram-токены), а вся бизнес-логика прав доступа
 *               и обхода дерева сосредоточена в `ReferralCommissionService`.
 *               Бот рендерит то, что вернёт сервис, и это покрыто smoke-тестом
 *               через workflow-template + ручной QA по чеклисту 4.15.
 * @project: SaaS Bonus System
 * @created: 2026-05-24
 */

import { ReferralCommissionService } from '@/lib/services/referral-commission.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

// ──────────────────────────────────────────────────────────────────────────────
// In-memory tree mock (тот же паттерн, что в referral-commission.service.grants.test.ts)
// ──────────────────────────────────────────────────────────────────────────────

type TreeNode = {
  id: string;
  referredBy: string | null;
  partnerRole: 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';
};

interface InMemoryTree {
  byId: Map<string, TreeNode>;
  childrenOf: Map<string, string[]>;
}

function buildTree(nodes: TreeNode[]): InMemoryTree {
  const byId = new Map<string, TreeNode>();
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    byId.set(n.id, n);
    if (!childrenOf.has(n.id)) childrenOf.set(n.id, []);
    if (n.referredBy) {
      const list = childrenOf.get(n.referredBy) ?? [];
      list.push(n.id);
      childrenOf.set(n.referredBy, list);
    }
  }
  return { byId, childrenOf };
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

function descendantsOf(
  tree: InMemoryTree,
  id: string,
  depth: number
): string[] {
  const out: string[] = [];
  let frontier: string[] = [id];
  for (let level = 0; level < depth && frontier.length > 0; level += 1) {
    const next: string[] = [];
    for (const f of frontier) {
      const children = tree.childrenOf.get(f) ?? [];
      for (const c of children) {
        out.push(c);
        next.push(c);
      }
    }
    frontier = next;
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
    if (sql.includes('JOIN descendants')) {
      return descendantsOf(tree, rootId, depth).map((id, i) => ({
        id,
        depth: i + 1
      }));
    }
    return [];
  });
}

/**
 * Построение дерева 1 директор → 2 менеджера → 5 тренеров на каждого менеджера
 * → 20 клиентов на каждого тренера. Итого 1 + 2 + 10 + 200 = 213 узлов.
 */
function buildOrganizationTree() {
  const nodes: TreeNode[] = [];
  const directorId = 'director-1';
  nodes.push({ id: directorId, referredBy: null, partnerRole: 'DIRECTOR' });

  const managerIds: string[] = [];
  for (let m = 1; m <= 2; m += 1) {
    const id = `manager-${m}`;
    managerIds.push(id);
    nodes.push({ id, referredBy: directorId, partnerRole: 'MANAGER' });
  }

  const trainersByManager = new Map<string, string[]>();
  const allTrainerIds: string[] = [];
  for (const managerId of managerIds) {
    const trainers: string[] = [];
    for (let t = 1; t <= 5; t += 1) {
      const id = `${managerId}-trainer-${t}`;
      trainers.push(id);
      allTrainerIds.push(id);
      nodes.push({ id, referredBy: managerId, partnerRole: 'TRAINER' });
    }
    trainersByManager.set(managerId, trainers);
  }

  const clientsByTrainer = new Map<string, string[]>();
  const allClientIds: string[] = [];
  for (const trainerId of allTrainerIds) {
    const clients: string[] = [];
    for (let c = 1; c <= 20; c += 1) {
      const id = `${trainerId}-client-${c}`;
      clients.push(id);
      allClientIds.push(id);
      nodes.push({ id, referredBy: trainerId, partnerRole: 'CLIENT' });
    }
    clientsByTrainer.set(trainerId, clients);
  }

  return {
    nodes,
    tree: buildTree(nodes),
    directorId,
    managerIds,
    trainersByManager,
    allTrainerIds,
    clientsByTrainer,
    allClientIds
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────────────────────────────────────

describe('Phase 4 — Bot Partner Cabinet (integration via service layer)', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'project-b2b';

  // Глубина 3 — менеджер видит до клиентов (manager → trainer → client = 2 уровня вниз).
  const MAX_DEPTH = 3;

  const org = buildOrganizationTree();

  function setupProjectMock() {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        defaultReferralCommissionPlan: { maxPayoutDepth: MAX_DEPTH },
        // Эмулируем включённый b2b-флаг
        enablePartnerRoles: true
      })
    };
  }

  function setupNoGrants() {
    (mockDb as any).referralStatsGrant = {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([])
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    setupProjectMock();
    setupNoGrants();
    (mockDb as any).$queryRaw = mockQueryRaw(org.tree);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4.12 — Построение и санити-проверка тестового дерева
  // ──────────────────────────────────────────────────────────────────────────
  describe('4.12 — Test project setup with enablePartnerRoles=true and 213-node tree', () => {
    it('builds 1 → 2 → 5×2 → 20×10 hierarchy (1 director, 2 managers, 10 trainers, 200 clients = 213)', () => {
      expect(org.nodes).toHaveLength(213);
      expect(org.managerIds).toHaveLength(2);
      expect(org.allTrainerIds).toHaveLength(10);
      expect(org.allClientIds).toHaveLength(200);

      // У каждого менеджера ровно 5 тренеров
      for (const mgr of org.managerIds) {
        expect(org.trainersByManager.get(mgr)).toHaveLength(5);
      }
      // У каждого тренера ровно 20 клиентов
      for (const trn of org.allTrainerIds) {
        expect(org.clientsByTrainer.get(trn)).toHaveLength(20);
      }
    });

    it('director видит весь tree через cachedGetDescendantTree (213 - 1 = 212 потомков)', async () => {
      // Глубины 3 хватает чтобы дойти до клиентов (director → manager → trainer → client = 3 уровня).
      const descendants = await ReferralCommissionService.getDescendantTree(
        org.directorId,
        projectId,
        MAX_DEPTH
      );
      expect(descendants).toHaveLength(212);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4.13 — Симуляция «Моя команда» от менеджера: только его 5 тренеров на L1
  // ──────────────────────────────────────────────────────────────────────────
  describe('4.13 — Manager «Моя команда» button shows only own 5 trainers', () => {
    it('manager-1 → getDescendantTree depth=1 = ровно 5 тренеров (его прямые рефералы)', async () => {
      const descendants = await ReferralCommissionService.getDescendantTree(
        'manager-1',
        projectId,
        // depth=1: только прямые рефералы = тренеры под менеджером
        1
      );
      const expectedTrainers = org.trainersByManager.get('manager-1') ?? [];
      expect(descendants.sort()).toEqual(expectedTrainers.sort());
      expect(descendants).toHaveLength(5);
    });

    it('manager-1 не видит тренеров другого менеджера (manager-2)', async () => {
      const otherManagersTrainers =
        org.trainersByManager.get('manager-2') ?? [];
      const own = await ReferralCommissionService.getDescendantTree(
        'manager-1',
        projectId,
        MAX_DEPTH
      );
      for (const id of otherManagersTrainers) {
        expect(own).not.toContain(id);
      }
    });

    it('manager-1.getViewableSubjects содержит self + всех его потомков и не содержит чужих', async () => {
      const own = await ReferralCommissionService.getViewableSubjects(
        projectId,
        'manager-1'
      );
      // self
      expect(own).toContain('manager-1');
      // все 5 тренеров
      for (const trn of org.trainersByManager.get('manager-1') ?? []) {
        expect(own).toContain(trn);
      }
      // ни одного из тренеров manager-2
      for (const trn of org.trainersByManager.get('manager-2') ?? []) {
        expect(own).not.toContain(trn);
      }
      // не содержит другого менеджера
      expect(own).not.toContain('manager-2');
      // не содержит директора
      expect(own).not.toContain(org.directorId);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4.14 — Тренер пытается посмотреть стату менеджера → отказ
  // ──────────────────────────────────────────────────────────────────────────
  describe('4.14 — Trainer cannot view their manager (cross-up access denied)', () => {
    it('trainer → manager.canViewSubject = false', async () => {
      const trainerId = 'manager-1-trainer-1';
      const allowed = await ReferralCommissionService.canViewSubject(
        projectId,
        trainerId,
        'manager-1'
      );
      expect(allowed).toBe(false);
    });

    it('trainer → director.canViewSubject = false (двa уровня вверх)', async () => {
      const allowed = await ReferralCommissionService.canViewSubject(
        projectId,
        'manager-1-trainer-1',
        org.directorId
      );
      expect(allowed).toBe(false);
    });

    it('trainer → other-manager-trainer.canViewSubject = false (sibling-cousin)', async () => {
      const allowed = await ReferralCommissionService.canViewSubject(
        projectId,
        'manager-1-trainer-1',
        'manager-2-trainer-1'
      );
      expect(allowed).toBe(false);
    });

    it('trainer видит только своих клиентов и себя', async () => {
      const trainerId = 'manager-1-trainer-1';
      const expected = org.clientsByTrainer.get(trainerId) ?? [];
      const own = await ReferralCommissionService.getViewableSubjects(
        projectId,
        trainerId
      );
      // self + 20 клиентов
      expect(own).toHaveLength(21);
      expect(own).toContain(trainerId);
      for (const c of expected) {
        expect(own).toContain(c);
      }
      // не видит менеджера и директора
      expect(own).not.toContain('manager-1');
      expect(own).not.toContain(org.directorId);
    });

    it('manager → trainer.canViewSubject = true (доступ вниз разрешён)', async () => {
      // Контр-проверка: вверх — нет, вниз — да.
      const allowed = await ReferralCommissionService.canViewSubject(
        projectId,
        'manager-1',
        'manager-1-trainer-1'
      );
      expect(allowed).toBe(true);
    });
  });
});
