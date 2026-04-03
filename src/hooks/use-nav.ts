'use client';

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => items, [items]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  return useMemo(() => groups, [groups]);
}
