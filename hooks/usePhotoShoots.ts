// hooks/usePhotoShoots.ts
import { useQuery } from '@tanstack/react-query';
import { fetchPhotoShoots } from '@/app/api/photoShootApi';

export const usePhotoShoots = (page: number, limit: number) => {
    return useQuery({
      queryKey: ['photoshoots', page, limit],
      queryFn: () => fetchPhotoShoots(page, limit),
      staleTime: 5000, // 5 seconds
    });
  };
