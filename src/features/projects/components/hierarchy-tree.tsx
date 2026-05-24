/**
 * @file: src/features/projects/components/hierarchy-tree.tsx
 * @description: Client Component — отображение партнёрского дерева на
 *               странице `/dashboard/projects/[id]/referral/hierarchy`.
 *               (b2b-referral-hierarchy Phase 6.9–6.11, 6.14)
 *
 *               Принимает плоский массив `HierarchyNode` от data-access,
 *               собирает дерево по `parentId`, рендерит вложенный список с
 *               раскрываемыми уровнями.
 *
 *               Возможности:
 *                 - Period selector (today / 7d / 30d / all) с обновлением URL
 *                 - Поиск по name/email/phone с подсветкой и
 *                   автораскрытием цепочки родителей
 *                 - Кнопка экспорта CSV
 *                 - Per-node агрегаты: direct, subtree size, commission
 *
 *               НЕ переиспользуем `ReferralTree` напрямую (он завязан на
 *               отдельную пагинированную загрузку через `loadingIds` и
 *               specific-shape `ReferralUser` из user-referrals-display).
 *               Здесь дерево уже целиком на руках, простой рекурсивный
 *               рендер достаточен.
 *
 * @project: SaaS Bonus System
 * @dependencies: shadcn/ui, framer-motion (опционально), composite EmptyState
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Mail,
  Phone,
  Search,
  Users,
  Wallet
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/composite';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PartnerRoleBadge } from '@/features/bonuses/components/partner-role-badge';
import type {
  HierarchyNode,
  HierarchyPeriod
} from '@/app/dashboard/projects/[id]/referral/hierarchy/data-access';

interface HierarchyTreeProps {
  projectId: string;
  nodes: HierarchyNode[];
  rootIds: string[];
  period: HierarchyPeriod;
}

const PERIOD_LABEL: Record<HierarchyPeriod, string> = {
  today: 'Сегодня',
  '7d': 'Последние 7 дней',
  '30d': 'Последние 30 дней',
  all: 'Всё время'
};

const formatRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(n);

interface ChildrenIndex {
  byParent: Map<string, HierarchyNode[]>;
  byId: Map<string, HierarchyNode>;
  parentOf: Map<string, string | null>;
}

function buildIndex(nodes: HierarchyNode[]): ChildrenIndex {
  const byParent = new Map<string, HierarchyNode[]>();
  const byId = new Map<string, HierarchyNode>();
  const parentOf = new Map<string, string | null>();
  for (const n of nodes) {
    byId.set(n.id, n);
    parentOf.set(n.id, n.parentId);
    const key = n.parentId ?? '__root__';
    const arr = byParent.get(key) ?? [];
    arr.push(n);
    byParent.set(key, arr);
  }
  return { byParent, byId, parentOf };
}

/**
 * Подсветка совпадений в строке без `dangerouslySetInnerHTML`.
 */
function Highlight({
  text,
  query
}: {
  text: string;
  query: string;
}): React.ReactElement {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className='rounded bg-yellow-200 px-0.5 dark:bg-yellow-700/40'>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface NodeRowProps {
  node: HierarchyNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isHighlighted: boolean;
  query: string;
  onToggle: () => void;
}

function NodeRow({
  node,
  depth,
  hasChildren,
  isExpanded,
  isHighlighted,
  query,
  onToggle
}: NodeRowProps) {
  return (
    <div
      className={`group flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-all sm:flex-row sm:items-center sm:justify-between ${
        isHighlighted
          ? 'border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/20'
          : 'hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50'
      }`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className='flex min-w-0 flex-1 items-start gap-2'>
        <button
          type='button'
          onClick={onToggle}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          className='text-muted-foreground hover:text-foreground mt-1 disabled:opacity-30'
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )
          ) : (
            <span className='inline-block h-4 w-4' />
          )}
        </button>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='truncate font-medium'>
              <Highlight text={node.name} query={query} />
            </span>
            <PartnerRoleBadge role={node.partnerRole} />
          </div>
          <div className='text-muted-foreground mt-0.5 flex flex-wrap gap-3 text-xs'>
            {node.email && (
              <span className='inline-flex items-center gap-1'>
                <Mail className='h-3 w-3' />
                <Highlight text={node.email} query={query} />
              </span>
            )}
            {node.phone && (
              <span className='inline-flex items-center gap-1'>
                <Phone className='h-3 w-3' />
                <Highlight text={node.phone} query={query} />
              </span>
            )}
            <span>
              c {new Date(node.registeredAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-3 sm:flex-nowrap'>
        <Badge variant='secondary' className='gap-1 font-mono'>
          <Users className='h-3 w-3' />
          {node.directCount}
          <span className='text-muted-foreground'>/{node.subtreeSize}</span>
        </Badge>
        <Badge variant='outline' className='gap-1 font-mono'>
          <Wallet className='h-3 w-3' />
          {formatRub(node.commissionEarned)}
        </Badge>
      </div>
    </div>
  );
}

export function HierarchyTree({
  projectId,
  nodes,
  rootIds,
  period
}: HierarchyTreeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';

  const [search, setSearch] = React.useState(initialSearch);
  // Синхронизируем поле с URL только при первом монтировании.
  // Дальше — локальный state, чтобы не дёргать SSR на каждое нажатие.
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialSearch);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  const index = React.useMemo(() => buildIndex(nodes), [nodes]);

  /**
   * При наличии поиска — собираем set матчей и всех их предков, чтобы
   * автоматически раскрыть цепочку (Phase 6.11).
   */
  const { matchedIds, expandedAuto } = React.useMemo(() => {
    if (!debouncedSearch) {
      return {
        matchedIds: new Set<string>(),
        expandedAuto: new Set<string>()
      };
    }
    const q = debouncedSearch.toLowerCase();
    const matched = new Set<string>();
    for (const n of nodes) {
      const haystack =
        `${n.name} ${n.email ?? ''} ${n.phone ?? ''}`.toLowerCase();
      if (haystack.includes(q)) matched.add(n.id);
    }
    const auto = new Set<string>();
    for (const id of matched) {
      let cursor: string | null = index.parentOf.get(id) ?? null;
      let safety = 0;
      while (cursor && safety < 20) {
        auto.add(cursor);
        cursor = index.parentOf.get(cursor) ?? null;
        safety += 1;
      }
    }
    return { matchedIds: matched, expandedAuto: auto };
  }, [debouncedSearch, nodes, index.parentOf]);

  // Manual expand state (click). Совмещается с авто-раскрытием от поиска.
  const [manualExpanded, setManualExpanded] = React.useState<Set<string>>(
    () => new Set(rootIds) // По умолчанию корни раскрыты.
  );

  const toggleId = (id: string) => {
    setManualExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) =>
    manualExpanded.has(id) || expandedAuto.has(id);

  const handlePeriodChange = (next: HierarchyPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', next);
    router.push(
      `/dashboard/projects/${projectId}/referral/hierarchy?${params.toString()}`
    );
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('period', period);
    const url = `/api/projects/${projectId}/hierarchy/export?${params.toString()}`;
    window.location.href = url;
  };

  const renderNode = (id: string, depth: number): React.ReactNode => {
    const node = index.byId.get(id);
    if (!node) return null;
    const children = index.byParent.get(id) ?? [];
    const expanded = isExpanded(id);
    return (
      <div key={id} className='space-y-2'>
        <NodeRow
          node={node}
          depth={depth}
          hasChildren={children.length > 0}
          isExpanded={expanded}
          isHighlighted={matchedIds.has(id)}
          query={debouncedSearch}
          onToggle={() => toggleId(id)}
        />
        {expanded && children.length > 0 && (
          <div className='space-y-2 border-l border-dashed border-zinc-200 pl-3 dark:border-zinc-800'>
            {children.map((c) => renderNode(c.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title='Партнёров пока нет'
        description='Назначьте пользователям роль (TRAINER / MANAGER / DIRECTOR) в разделе «Пользователи». Они начнут появляться в дереве сразу же.'
        action={
          <Link
            href={`/dashboard/projects/${projectId}/users`}
            className='text-primary text-sm underline'
          >
            Перейти к пользователям →
          </Link>
        }
      />
    );
  }

  return (
    <div className='space-y-4'>
      {/* Toolbar: search, period, export */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative min-w-[260px] flex-1'>
          <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Поиск по имени, email, телефону…'
            className='pl-8'
          />
        </div>
        <Select
          value={period}
          onValueChange={(v) => handlePeriodChange(v as HierarchyPeriod)}
        >
          <SelectTrigger className='w-[200px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABEL) as HierarchyPeriod[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERIOD_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type='button'
          variant='outline'
          onClick={handleExport}
          className='gap-2'
        >
          <Download className='h-4 w-4' />
          Экспорт CSV
        </Button>
      </div>

      {debouncedSearch && (
        <div className='text-muted-foreground text-xs'>
          Найдено совпадений: <strong>{matchedIds.size}</strong>
        </div>
      )}

      <div className='space-y-2'>
        {rootIds.length > 0 ? (
          rootIds.map((id) => renderNode(id, 0))
        ) : (
          <EmptyState
            icon={Users}
            title='Корней дерева не найдено'
            description='Все партнёры в проекте ссылаются на родителя. Проверьте поле referredBy в базе.'
            size='sm'
          />
        )}
      </div>
    </div>
  );
}
