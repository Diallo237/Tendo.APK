import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { buildApiUrl } from '@/utils/api-client';

export interface Review {
  id: number;
  user: number;
  user_name: string;
  user_avatar: string | null;
  product: number;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewData {
  product: number;
  rating: number;
  title?: string;
  comment: string;
}

export interface UpdateReviewData {
  id: number;
  rating?: number;
  title?: string;
  comment?: string;
}

const reviewsKey = (productId: number) => ['reviews', productId] as const;
const myReviewKey = (productId: number) => ['my-review', productId] as const;

export function useGetProductReviews(productId: number) {
  return useQuery<Review[]>({
    queryKey: reviewsKey(productId),
    queryFn: async (): Promise<Review[]> => {
      const res = await apiClient.get(buildApiUrl(`/reviews/products/${productId}/`));
      return res.data as unknown as Review[];
    },
    enabled: !!productId,
  });
}

export function useGetMyReview(productId: number, enabled: boolean) {
  return useQuery<Review | null>({
    queryKey: myReviewKey(productId),
    queryFn: async (): Promise<Review | null> => {
      const res = await apiClient.get(buildApiUrl(`/reviews/my/${productId}/`));
      return res.data as unknown as Review | null;
    },
    enabled: !!productId && enabled,
  });
}

export function useCreateReview(productId: number) {
  const qc = useQueryClient();
  return useMutation<Review, Error, CreateReviewData>({
    mutationFn: async (data): Promise<Review> => {
      const res = await apiClient.post(buildApiUrl('/reviews/'), data);
      return res.data as unknown as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewsKey(productId) });
      qc.invalidateQueries({ queryKey: myReviewKey(productId) });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateReview(productId: number) {
  const qc = useQueryClient();
  return useMutation<Review, Error, UpdateReviewData>({
    mutationFn: async ({ id, ...data }): Promise<Review> => {
      const res = await apiClient.patch(buildApiUrl(`/reviews/${id}/`), data);
      return res.data as unknown as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewsKey(productId) });
      qc.invalidateQueries({ queryKey: myReviewKey(productId) });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteReview(productId: number) {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id): Promise<void> => {
      await apiClient.delete(buildApiUrl(`/reviews/${id}/`));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewsKey(productId) });
      qc.invalidateQueries({ queryKey: myReviewKey(productId) });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
