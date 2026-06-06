'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const segmentTranslations: Record<string, string> = {
  dashboard: 'Панель управления',
  projects: 'Проекты',
  settings: 'Настройки',
  integration: 'Интеграция',
  integrations: 'Интеграции',
  users: 'Пользователи',
  analytics: 'Аналитика',
  bot: 'Бот',
  referral: 'Реферальная программа',
  organizations: 'Организации',
  hierarchy: 'Иерархия',
  'bonus-levels': 'Уровни бонусов',
  bonuses: 'Бонусы',
  overview: 'Обзор',
  notifications: 'Уведомления',
  billing: 'Биллинг',
  profile: 'Профиль',
  orders: 'Заказы',
  products: 'Товары',
  retailcrm: 'RetailCRM',
  segments: 'Сегменты',
  mailings: 'Рассылки',
  chats: 'Чаты',
  workflow: 'Workflow',
  constructor: 'Конструктор',
  templates: 'Шаблоны',
  moysklad: 'МойСклад (Loyalty API)',
  'moysklad-direct': 'МойСклад (Direct API)',
  insales: 'InSales',
  tilda: 'Tilda'
};

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
  '/dashboard/templates': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Шаблоны', link: '/dashboard/templates' }
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
    { title: 'Биллинг', link: '/dashboard/settings?tab=billing' }
  ],
  '/dashboard/profile': [
    { title: 'Панель управления', link: '/dashboard' },
    { title: 'Профиль', link: '/dashboard/settings?tab=profile' }
  ]
};

function looksLikeEntityId(segment: string): boolean {
  return segment.length >= 20 && /^[a-z0-9]+$/i.test(segment);
}

export function useBreadcrumbs() {
  const pathname = usePathname();
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [organizationNames, setOrganizationNames] = useState<
    Record<string, string>
  >({});

  const getProjectName = async (projectId: string): Promise<string> => {
    if (projectNames[projectId]) {
      return projectNames[projectId];
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        const name = project.name || 'Проект';
        setProjectNames((prev) => ({ ...prev, [projectId]: name }));
        return name;
      }
      if (response.status === 403) {
        const name = 'Проект';
        setProjectNames((prev) => ({ ...prev, [projectId]: name }));
        return name;
      }
    } catch {
      const name = 'Проект';
      setProjectNames((prev) => ({ ...prev, [projectId]: name }));
      return name;
    }

    return 'Проект';
  };

  const getOrganizationName = async (
    projectId: string,
    organizationId: string
  ): Promise<string> => {
    const cacheKey = `${projectId}:${organizationId}`;
    if (organizationNames[cacheKey]) {
      return organizationNames[cacheKey];
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/organizations/${organizationId}`
      );
      if (response.ok) {
        const data = await response.json();
        const name = data.organization?.name || 'Организация';
        setOrganizationNames((prev) => ({ ...prev, [cacheKey]: name }));
        return name;
      }
    } catch {
      // ignore
    }

    const fallback = 'Организация';
    setOrganizationNames((prev) => ({ ...prev, [cacheKey]: fallback }));
    return fallback;
  };

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const segments = pathname.split('/').filter(Boolean);
    const projectsIndex = segments.indexOf('projects');
    const projectId =
      projectsIndex !== -1 && projectsIndex + 1 < segments.length
        ? segments[projectsIndex + 1]
        : null;

    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const prev = index > 0 ? segments[index - 1] : null;

      if (segment === 'projects') {
        return {
          title: 'Проекты',
          link: '/dashboard/projects'
        };
      }

      if (
        projectId &&
        prev === 'projects' &&
        segment === projectId &&
        looksLikeEntityId(segment)
      ) {
        return {
          title: projectNames[segment] || 'Проект',
          link: path
        };
      }

      if (projectId && prev === 'organizations' && looksLikeEntityId(segment)) {
        const cacheKey = `${projectId}:${segment}`;
        return {
          title: organizationNames[cacheKey] || 'Организация',
          link: path
        };
      }

      const title =
        segmentTranslations[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      return { title, link: path };
    });
  }, [pathname, projectNames, organizationNames]);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const projectsIndex = segments.indexOf('projects');

    if (projectsIndex !== -1 && projectsIndex + 1 < segments.length) {
      const projectId = segments[projectsIndex + 1];
      if (looksLikeEntityId(projectId) && !projectNames[projectId]) {
        void getProjectName(projectId);
      }

      const orgIndex = segments.indexOf('organizations');
      if (
        orgIndex !== -1 &&
        orgIndex + 1 < segments.length &&
        looksLikeEntityId(segments[orgIndex + 1])
      ) {
        const organizationId = segments[orgIndex + 1];
        const cacheKey = `${projectId}:${organizationId}`;
        if (!organizationNames[cacheKey]) {
          void getOrganizationName(projectId, organizationId);
        }
      }
    }
  }, [pathname, projectNames, organizationNames]);

  return breadcrumbs;
}
