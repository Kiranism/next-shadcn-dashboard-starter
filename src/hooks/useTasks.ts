import { useQuery } from '@tanstack/react-query';
import { SceneTask, SceneTaskStatus } from '@/types/sceneTask';

interface TaskFilters {
  status: SceneTaskStatus;
  assignedToUserId?: string;
}

export function useTasks(
  filters?: TaskFilters,
  queryKeyPrefix: string = 'all-tasks'
) {
  return useQuery<SceneTask[]>({
    queryKey: [queryKeyPrefix, filters], // Add prefix to make keys unique
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }

      if (filters?.assignedToUserId) {
        params.append('assignedToUserId', filters.assignedToUserId);
      }

      const url = `/api/tasks?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    }
  });
}
