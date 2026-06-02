'use client';

import type { NavItem, NavGroup } from '@/types';
import { useUserProfile } from '@/components/providers/user-profile-provider';

function isAccessible(
  minRank: number | undefined,
  allowedSectors: string[] | undefined,
  rank: number,
  sector: string | null
): boolean {
  if ((minRank ?? 0) <= rank) return true;
  if (allowedSectors && sector && allowedSectors.includes(sector)) return true;
  return false;
}

export function useFilteredNavItems(items: NavItem[]): NavItem[] {
  const { rank, profile } = useUserProfile();
  return items.filter((item) =>
    isAccessible(item.minRank, item.allowedSectors, rank, profile?.sector ?? null)
  );
}

export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const { rank, profile } = useUserProfile();
  const sector = profile?.sector ?? null;
  return groups
    .filter((group) => isAccessible(group.minRank, group.allowedSectors, rank, sector))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isAccessible(item.minRank, item.allowedSectors, rank, sector)
      )
    }))
    .filter((group) => group.items.length > 0 || group.label === '');
}
