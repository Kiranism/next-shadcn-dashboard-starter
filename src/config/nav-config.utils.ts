import { navGroups } from './nav-config';
import { getRank } from '@/types/user-profile';

export function getMinRankForPath(pathname: string): number | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.url || pathname.startsWith(item.url + '/')) {
        return item.minRank ?? 0;
      }
    }
  }
  return null;
}

export { getRank as getRankFromRole };
