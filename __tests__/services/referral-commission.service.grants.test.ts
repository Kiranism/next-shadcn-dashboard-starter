/**
 * @file: referral-commission.service.grants.test.ts
 * @description: Тесты эффективных грантов в b2b-иерархии — `canViewSubject`, `getViewableSubjects`, `getAncestorChain`, `getDescendantTree`. Включает property-style проверку на случайных деревьях с детерминированным seed-PRNG (fast-check не подключён к проекту).
 * @project: SaaS Bonus System
 */

import { ReferralCommissionService } from '@/lib/services/referral-commission.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

// ──────────────────────────────────────────────────────────────────────────────
// Helpers: in-memory tree + mock for db.$queryRaw / $queryRawUnsafe / findFirst
// / findMany / referralStatsGrant / project. CTE-запрос мы детектируем по
// фрагментам SQL внутри Prisma.sql template.
// ──────────────────────────────────────────────────────────────────────────────

type TreeNode = {
  id: string;
  referredBy: string | null;
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

/**
 * Подключает мок к Prisma.sql вызову db.$queryRaw — ловим массив `values` из
 * объекта Sql. Первый элемент — рутовый id. Простая эвристика: если SQL
 * содержит "JOIN ancestors" — вернуть предков, если "JOIN descendants" —
 * потомков. Возвращаемое значение совместимо с типом метода (id+depth).
 */
function mockQueryRaw(tree: InMemoryTree) {
  return jest.fn(async (input: any, ..._rest: any[]) => {
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

// Простой seeded PRNG (mulberry32) — детерминированный.
function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Сгенерировать случайное дерево заданной глубины.
 * Корень — `root`. На каждом уровне 1..maxBranching детей.
 */
function generateTree(
  seed: number,
  maxDepth: number,
  maxBranching: number
): { nodes: TreeNode[]; tree: InMemoryTree; root: string } {
  const rng = seededRandom(seed);
  const root: TreeNode = { id: `n-${seed}-root`, referredBy: null };
  const nodes: TreeNode[] = [root];
  let counter = 0;

  function grow(parentId: string, depth: number): void {
    if (depth >= maxDepth) return;
    const branch = 1 + Math.floor(rng() * maxBranching);
    for (let i = 0; i < branch; i += 1) {
      counter += 1;
      const id = `n-${seed}-${counter}`;
      nodes.push({ id, referredBy: parentId });
      grow(id, depth + 1);
    }
  }
  grow(root.id, 0);

  return { nodes, tree: buildTree(nodes), root: root.id };
}

// ──────────────────────────────────────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────────────────────────────────────

describe('ReferralCommissionService — Effective Grants (Phase 3)', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'project-1';
  const DEFAULT_MAX_DEPTH = 3;

  function setupProjectWithMaxDepth(maxDepth: number = DEFAULT_MAX_DEPTH) {
    (mockDb as any).project = {
      findUnique: jest.fn().mockResolvedValue({
        defaultReferralCommissionPlan: { maxPayoutDepth: maxDepth }
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
    setupProjectWithMaxDepth(DEFAULT_MAX_DEPTH);
    setupNoGrants();
  });

  describe('Property: getViewableSubjects size matches descendant count (3.11)', () => {
    // Несколько детерминированных «случайных» деревьев.
    const seeds = [1, 2, 3, 4, 5];

    seeds.forEach((seed) => {
      it(`tree seed=${seed} — getViewableSubjects.length - 1 === descendants count`, async () => {
        const { tree, root } = generateTree(seed, /*depth*/ 3, /*branch*/ 4);
        (mockDb as any).$queryRaw = mockQueryRaw(tree);

        const expected = descendantsOf(tree, root, DEFAULT_MAX_DEPTH);

        const subjects = await ReferralCommissionService.getViewableSubjects(
          projectId,
          root
        );

        // size = self + descendants
        expect(subjects.length - 1).toBe(expected.length);
        // содержит root
        expect(subjects).toContain(root);
        // содержит все ожидаемые потомки
        for (const id of expected) {
          expect(subjects).toContain(id);
        }
      });
    });

    it('viewer без потомков видит только себя (Validates: Requirement 5.2)', async () => {
      const tree = buildTree([{ id: 'leaf-1', referredBy: null }]);
      (mockDb as any).$queryRaw = mockQueryRaw(tree);

      const subjects = await ReferralCommissionService.getViewableSubjects(
        projectId,
        'leaf-1'
      );
      expect(subjects).toEqual(['leaf-1']);
    });
  });

  describe('canViewSubject is asymmetric in viewer→subject direction (3.12)', () => {
    it('ancestor видит потомка, потомок не видит ancestor (Validates: Requirement 5.1)', async () => {
      // Цепочка: director → manager → trainer → client
      const tree = buildTree([
        { id: 'director', referredBy: null },
        { id: 'manager', referredBy: 'director' },
        { id: 'trainer', referredBy: 'manager' },
        { id: 'client', referredBy: 'trainer' }
      ]);
      (mockDb as any).$queryRaw = mockQueryRaw(tree);

      // director → trainer (вниз) — true
      await expect(
        ReferralCommissionService.canViewSubject(
          projectId,
          'director',
          'trainer'
        )
      ).resolves.toBe(true);

      // trainer → director (вверх) — false
      await expect(
        ReferralCommissionService.canViewSubject(
          projectId,
          'trainer',
          'director'
        )
      ).resolves.toBe(false);

      // manager → client (через 2 уровня вниз, в пределах depth=3) — true
      await expect(
        ReferralCommissionService.canViewSubject(projectId, 'manager', 'client')
      ).resolves.toBe(true);

      // client → manager (вверх) — false
      await expect(
        ReferralCommissionService.canViewSubject(projectId, 'client', 'manager')
      ).resolves.toBe(false);
    });

    it('self → self = true', async () => {
      // Не нужен queryRaw, потому что canViewSubject короткозамыкает на self.
      await expect(
        ReferralCommissionService.canViewSubject(projectId, 'u1', 'u1')
      ).resolves.toBe(true);
    });

    it('два не связанных пользователя — оба направления false', async () => {
      const tree = buildTree([
        { id: 'alice', referredBy: null },
        { id: 'bob', referredBy: null }
      ]);
      (mockDb as any).$queryRaw = mockQueryRaw(tree);

      await expect(
        ReferralCommissionService.canViewSubject(projectId, 'alice', 'bob')
      ).resolves.toBe(false);
      await expect(
        ReferralCommissionService.canViewSubject(projectId, 'bob', 'alice')
      ).resolves.toBe(false);
    });
  });

  describe('Manual grant adds subject to getViewableSubjects (3.13)', () => {
    it('grant даёт доступ canViewSubject и появляется в getViewableSubjects', async () => {
      const tree = buildTree([
        { id: 'viewer', referredBy: null },
        { id: 'unrelated-subject', referredBy: null }
      ]);
      (mockDb as any).$queryRaw = mockQueryRaw(tree);

      // Грант: viewer может смотреть unrelated-subject
      (mockDb as any).referralStatsGrant = {
        findUnique: jest.fn(async ({ where }: any) => {
          const key = where?.projectId_subjectUserId_viewerUserId;
          if (
            key?.projectId === projectId &&
            key?.viewerUserId === 'viewer' &&
            key?.subjectUserId === 'unrelated-subject'
          ) {
            return {
              id: 'grant-1',
              projectId,
              subjectUserId: 'unrelated-subject',
              viewerUserId: 'viewer',
              createdAt: new Date()
            };
          }
          return null;
        }),
        findMany: jest.fn(async ({ where }: any) => {
          if (where?.viewerUserId === 'viewer') {
            return [{ subjectUserId: 'unrelated-subject' }];
          }
          return [];
        })
      };

      const allowed = await ReferralCommissionService.canViewSubject(
        projectId,
        'viewer',
        'unrelated-subject'
      );
      expect(allowed).toBe(true);

      const subjects = await ReferralCommissionService.getViewableSubjects(
        projectId,
        'viewer'
      );
      expect(subjects).toContain('viewer');
      expect(subjects).toContain('unrelated-subject');
    });

    it('обратное направление гранта не работает (subject ↛ viewer)', async () => {
      const tree = buildTree([
        { id: 'viewer', referredBy: null },
        { id: 'subject', referredBy: null }
      ]);
      (mockDb as any).$queryRaw = mockQueryRaw(tree);

      (mockDb as any).referralStatsGrant = {
        findUnique: jest.fn(async ({ where }: any) => {
          const key = where?.projectId_subjectUserId_viewerUserId;
          // grant существует только в направлении viewer → subject
          if (
            key?.viewerUserId === 'viewer' &&
            key?.subjectUserId === 'subject'
          ) {
            return {
              id: 'g',
              projectId,
              viewerUserId: 'viewer',
              subjectUserId: 'subject',
              createdAt: new Date()
            };
          }
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([])
      };

      const reverse = await ReferralCommissionService.canViewSubject(
        projectId,
        'subject',
        'viewer'
      );
      expect(reverse).toBe(false);
    });
  });

  describe('CTE failure → iterative fallback', () => {
    it('getDescendantTree падает на findMany при ошибке CTE', async () => {
      const tree = buildTree([
        { id: 'root', referredBy: null },
        { id: 'child-1', referredBy: 'root' },
        { id: 'child-2', referredBy: 'root' }
      ]);

      (mockDb as any).$queryRaw = jest.fn(async () => {
        throw new Error('CTE failure simulation');
      });

      // Fallback использует findMany по `referredBy IN (...)`
      mockDb.user.findMany = jest.fn(async ({ where }: any) => {
        const ids = (where?.referredBy?.in ?? []) as string[];
        const result: Array<{ id: string }> = [];
        for (const parent of ids) {
          for (const c of tree.childrenOf.get(parent) ?? []) {
            result.push({ id: c });
          }
        }
        return result;
      }) as any;

      const out = await ReferralCommissionService.getDescendantTree(
        'root',
        projectId,
        DEFAULT_MAX_DEPTH
      );
      expect(out.sort()).toEqual(['child-1', 'child-2'].sort());
    });
  });
});
