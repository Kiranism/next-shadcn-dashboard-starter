'use client';

import type { NavItem, NavGroup } from '@/types';
import { useUserProfile } from '@/components/providers/user-profile-provider';

function isAccessible(
  minRank: number | undefined,
  allowedSectors: string[] | undefined,
  rank: number,
  sector: string | null
): boolean {
  if (rank > 3) return true; // Admins have access to everything
  if (minRank !== undefined && rank < minRank) return false;
  if (allowedSectors && (!sector || !allowedSectors.includes(sector))) return false;
  return true;
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
