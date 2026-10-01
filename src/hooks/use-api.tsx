import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import apiClient from '../utils/api-client';

// ================================
// HOOKS REACT QUERY POUR LES REQUÊTES GET
// ================================

/**
 * Hook personnalisé pour effectuer des requêtes GET avec React Query
 * @param queryKey - Clé unique pour identifier la requête dans le cache React Query
 * @param url - URL de l'endpoint API
 * @param config - Configuration Axios optionnelle
 * Le 3ᵉ paramètre (config) correspond à la configuration Axios (headers, params, etc.)
 * Le 4ᵉ paramètre (options) correspond à la configuration React Query (onSuccess, onError, etc.)
 */
export function useAxiosGet<TData = unknown>(
  queryKey: readonly unknown[], 
  url: string,
  config?: AxiosRequestConfig,
  options?: any
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<{ data: TData }>(url, config);
      // Si response.data.data existe, le retourner (format ApiResponse)
      // Sinon, retourner response.data directement (format pagination ou autre)
      return response.data.data !== undefined ? response.data.data : response.data as TData;
    },
    ...options,
  });
}

/**
 * Hook pour obtenir une entité par son ID
 * @param queryKey - Préfixe de la clé de cache (ex: ['user', 'detail'])
 * @param url - URL de base de l'endpoint API (sans l'ID)
 * @param id - ID de l'entité à récupérer
 */
export function useAxiosGetById<TData = unknown>(
  queryKey: readonly unknown[],
  url: string,
  id: string | number | null | undefined,
  options?: any
) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const fullUrl = `${url}/${id}/`;
      const response = await apiClient.get<TData>(fullUrl);
      return response.data.data;
    },
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook pour la pagination
 * @param queryKey - Préfixe de la clé de cache
 * @param url - URL de l'endpoint API
 * @param page - Page actuelle
 * @param pageSize - Nombre d'éléments par page
 */
export function usePaginatedQuery<TData = unknown>(
  queryKey: readonly unknown[],
  url: string,
  page = 1,
  pageSize = 10,
  options?: any
) {
  return useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: async () => {
      const params = { page, size: pageSize };
      const response = await apiClient.get<TData>(url, { params });
      return response.data.data;
    },
    ...options,
  });
}

// ================================
// HOOKS REACT QUERY POUR LES MUTATIONS
// ================================

/**
 * Hook pour créer une nouvelle entité (POST)
 * @param url - URL de l'endpoint API
 * @param queryKeysToInvalidate - Clés de cache à invalider après mutation
 * @param options - Options de mutation React Query
 * @param axiosConfig - Configuration Axios (timeout, headers, etc.)
 */
export function useAxiosPost<TData = unknown, TVariables = unknown>(
  url: string,
  queryKeysToInvalidate?: readonly unknown[][],
  options?: any,
  axiosConfig?: AxiosRequestConfig
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.post<TData>(url, variables, axiosConfig);
      
      // Si response.data.data existe, le retourner, sinon retourner response.data
      return response.data.data !== undefined ? response.data.data : response.data;
    },
    onSuccess: () => {
      // Invalider les requêtes pertinentes après succès
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
    },
    ...options,
  });
}

/**
 * Hook pour mettre à jour une entité (PUT)
 * @param url - URL de base de l'endpoint API (sans l'ID)
 * @param queryKeysToInvalidate - Clés de cache à invalider après mutation
 */
export function useAxiosPut<TData = unknown, TVariables extends { id: string | number } = { id: string | number }>(
  url: string,
  queryKeysToInvalidate?: readonly unknown[][],
  options?: any
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const { id, ...data } = variables;
      const fullUrl = `${url}/${id}/`;
      const response = await apiClient.put<TData>(fullUrl, data);
      return response.data.data;
    },
    onSuccess: () => {
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
    },
    ...options,
  });
}

/**
 * Hook pour mettre à jour partiellement une entité (PATCH)
 * @param url - URL de base de l'endpoint API (sans l'ID)
 * @param queryKeysToInvalidate - Clés de cache à invalider après mutation
 */
export function useAxiosPatch<TData = unknown, TVariables extends { id: string | number } = { id: string | number }>(
  url: string,
  queryKeysToInvalidate?: readonly unknown[][],
  options?: any
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const { id, ...data } = variables;
      const fullUrl = `${url}/${id}/`;
      const response = await apiClient.patch<TData>(fullUrl, data);
      return response.data.data;
    },
    onSuccess: () => {
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
    },
    ...options,
  });
}

/**
 * Hook pour supprimer une entité (DELETE)
 * @param url - URL de base de l'endpoint API (sans l'ID)
 * @param queryKeysToInvalidate - Clés de cache à invalider après mutation
 */
export function useAxiosDelete<TData = unknown>(
  url: string,
  queryKeysToInvalidate?: readonly unknown[][],
  options?: any
): UseMutationResult<TData, Error, string | number> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, string | number>({
    mutationFn: async (id: string | number) => {
      const fullUrl = `${url}/${id}/`;
      const response = await apiClient.delete<TData>(fullUrl);
      return response.data.data;
    },
    onSuccess: () => {
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      }
    },
    ...options,
  });
}
