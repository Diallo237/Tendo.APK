import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { buildApiUrl } from '@/utils/api-client';

const FAVORITES_KEY = ['favorites'] as const;

export function useGetFavorites(enabled: boolean) {
  return useQuery<number[]>({
    queryKey: FAVORITES_KEY,
    queryFn: async (): Promise<number[]> => {
      const res = await apiClient.get(buildApiUrl('/favorites/'));
      return (res.data as any).favorites as number[];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<{ added: boolean; product_id: number }, Error, number>({
    mutationFn: async (productId): Promise<{ added: boolean; product_id: number }> => {
      const res = await apiClient.post(buildApiUrl(`/favorites/${productId}/toggle/`), {});
      return res.data as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}

export function useSyncFavorites() {
  const qc = useQueryClient();
  return useMutation<{ favorites: number[] }, Error, number[]>({
    mutationFn: async (ids): Promise<{ favorites: number[] }> => {
      const res = await apiClient.post(buildApiUrl('/favorites/sync/'), { ids });
      return res.data as any;
    },
    onSuccess: (data) => {
      qc.setQueryData(FAVORITES_KEY, data.favorites);
    },
  });
}
