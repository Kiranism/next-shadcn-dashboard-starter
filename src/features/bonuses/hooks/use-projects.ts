/**
 * @file: use-projects.ts
 * @description: Hook для управления проектами и их состоянием
 * @project: SaaS Bonus System
 * @dependencies: react, logger
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface Project {
  id: string;
  name: string;
  isActive: boolean;
  bonusPercentage: number;
  bonusExpiryDays: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UseProjectsOptions {
  autoSelectFirst?: boolean;
  fallbackProjectId?: string;
}

interface UseProjectsReturn {
  projects: Project[];
  currentProjectId: string | null;
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  refreshCurrentProject: () => Promise<void>;
}

export function useProjects({
  autoSelectFirst = true,
  fallbackProjectId
}: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получаем текущий проект
  const currentProject =
    projects.find((p) => p.id === currentProjectId) || null;

  /**
   * Загрузка списка проектов
   */
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Loading projects list', {}, 'use-projects');

      const response = await fetch('/api/projects');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const projectsList = Array.isArray(data) ? data : data.projects || [];

      // Форматируем проекты
      const formattedProjects: Project[] = projectsList.map((project: any) => ({
        id: project.id,
        name: project.name,
        isActive: project.isActive ?? true,
        bonusPercentage: Number(project.bonusPercentage) || 5,
        bonusExpiryDays: Number(project.bonusExpiryDays) || 365,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));

      setProjects(formattedProjects);

      // Автоматический выбор проекта
      if (
        formattedProjects.length > 0 &&
        autoSelectFirst &&
        !currentProjectId
      ) {
        const activeProject =
          formattedProjects.find((p) => p.isActive) || formattedProjects[0];
        setCurrentProjectId(activeProject.id);

        logger.info(
          'Auto-selected project',
          {
            projectId: activeProject.id,
            projectName: activeProject.name
          },
          'use-projects'
        );
      }

      logger.info(
        'Projects loaded successfully',
        {
          count: formattedProjects.length,
          activeCount: formattedProjects.filter((p) => p.isActive).length
        },
        'use-projects'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      logger.error(
        'Failed to load projects',
        { error: errorMessage },
        'use-projects'
      );

      // Fallback к указанному проекту
      if (fallbackProjectId && !currentProjectId) {
        setCurrentProjectId(fallbackProjectId);
        logger.warn(
          'Using fallback project ID',
          { projectId: fallbackProjectId },
          'use-projects'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [autoSelectFirst, currentProjectId, fallbackProjectId]);

  /**
   * Выбор текущего проекта
   */
  const selectProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);

      if (!project) {
        logger.warn(
          'Attempted to select non-existent project',
          { projectId },
          'use-projects'
        );
        return;
      }

      setCurrentProjectId(projectId);
      setError(null);

      logger.info(
        'Project selected',
        {
          projectId,
          projectName: project.name
        },
        'use-projects'
      );
    },
    [projects]
  );

  /**
   * Обновление данных текущего проекта
   */
  const refreshCurrentProject = useCallback(async () => {
    if (!currentProjectId) {
      logger.warn(
        'Cannot refresh project: no current project selected',
        {},
        'use-projects'
      );
      return;
    }

    try {
      logger.info(
        'Refreshing current project',
        { projectId: currentProjectId },
        'use-projects'
      );

      const response = await fetch(`/api/projects/${currentProjectId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      const projectData = await response.json();

      // Обновляем данные проекта в списке
      setProjects((prev) =>
        prev.map((project) =>
          project.id === currentProjectId
            ? {
                ...project,
                name: projectData.name,
                isActive: projectData.isActive ?? true,
                bonusPercentage: Number(projectData.bonusPercentage) || 5,
                bonusExpiryDays: Number(projectData.bonusExpiryDays) || 365,
                updatedAt: new Date(projectData.updatedAt)
              }
            : project
        )
      );

      logger.info(
        'Current project refreshed successfully',
        {
          projectId: currentProjectId
        },
        'use-projects'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      logger.error(
        'Failed to refresh current project',
        {
          projectId: currentProjectId,
          error: errorMessage
        },
        'use-projects'
      );
    }
  }, [currentProjectId]);

  // Загружаем проекты при инициализации
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    currentProjectId,
    currentProject,
    isLoading,
    error,
    loadProjects,
    selectProject,
    refreshCurrentProject
  };
}
