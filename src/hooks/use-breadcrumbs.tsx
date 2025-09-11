'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Словарь для перевода сегментов URL на русский
const segmentTranslations: Record<string, string> = {
  dashboard: 'Панель управления',
  projects: 'Проекты',
  settings: 'Настройки',
  integration: 'Интеграция',
  users: 'Пользователи',
  analytics: 'Аналитика',
  bot: 'Бот',
  referral: 'Реферальная программа',
  'bonus-levels': 'Уровни бонусов',
  bonuses: 'Бонусы',
  overview: 'Обзор',
  notifications: 'Уведомления',
  billing: 'Биллинг',
  profile: 'Профиль'
};

// Пользовательские маршруты с полными переводами
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Панель управления', link: '/dashboard' }],
  '/dashboard/projects': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Проекты', link: '/dashboard/projects' }
  ],
  '/dashboard/bonuses': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Бонусы', link: '/dashboard/bonuses' }
  ],
  '/dashboard/notifications': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Уведомления', link: '/dashboard/notifications' }
  ],
  '/dashboard/settings': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Настройки', link: '/dashboard/settings' }
  ],
  '/dashboard/billing': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Биллинг', link: '/dashboard/billing' }
  ],
  '/dashboard/profile': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Профиль', link: '/dashboard/profile' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      // Используем перевод если есть, иначе делаем первую букву заглавной
      const title =
        segmentTranslations[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title,
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
