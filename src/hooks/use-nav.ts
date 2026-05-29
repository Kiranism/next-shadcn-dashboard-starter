'use client';

import type { NavItem, NavGroup } from '@/types';
import { useUserProfile } from '@/components/providers/user-profile-provider';

export function useFilteredNavItems(items: NavItem[]): NavItem[] {
  const { rank } = useUserProfile();
  return items.filter((item) => (item.minRank ?? 0) <= rank);
}

export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const { rank } = useUserProfile();
  return groups
    .filter((group) => (group.minRank ?? 0) <= rank)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (item.minRank ?? 0) <= rank)
    }))
    .filter((group) => group.items.length > 0 || group.label === '');
}
