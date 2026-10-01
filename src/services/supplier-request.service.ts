import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAxiosGet } from '@/hooks/use-api';
import apiClient, { buildApiUrl } from '@/utils/api-client';
import { USERS_KEYS } from './auth.service';
import type { SupplierRequest, SupplierRequestCreate } from '@/types/user';

export const SUPPLIER_REQUEST_KEYS = {
  all: ['supplier-requests'] as const,
  mine: () => [...SUPPLIER_REQUEST_KEYS.all, 'mine'] as const,
  admin: (status?: string) => [...SUPPLIER_REQUEST_KEYS.all, 'admin', status ?? ''] as const,
};

interface SupplierRequestList {
  count: number;
  pending_count?: number;
  results: SupplierRequest[];
}

/** Demandes d'accès fournisseur du compte connecté. */
export function useMySupplierRequests(enabled = true) {
  return useAxiosGet<SupplierRequestList>(
    SUPPLIER_REQUEST_KEYS.mine(),
    buildApiUrl('/auth/supplier-requests/me/'),
    undefined,
    { enabled },
  );
}

/** Envoyer une demande pour devenir fournisseur (client connecté). */
export function useCreateSupplierRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SupplierRequestCreate) => {
      const response = await apiClient.post(buildApiUrl('/auth/supplier-requests/'), payload);
      return response.data as unknown as { message: string; request: SupplierRequest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_REQUEST_KEYS.mine() });
      // `supplier_request` est exposé sur /auth/users/me/ : il pilote le bouton
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.current() });
    },
  });
}

// ── Espace admin ─────────────────────────────────────────────────────────────

/** Liste des demandes fournisseur (admin). */
export function useAdminSupplierRequests(status?: string) {
  return useAxiosGet<SupplierRequestList>(
    SUPPLIER_REQUEST_KEYS.admin(status),
    buildApiUrl('/auth/admin/supplier-requests/'),
    status ? { params: { status } } : undefined,
  );
}

interface DecisionPayload {
  id: number;
  decision_reason?: string;
}

/**
 * Approuver une demande. Si un autre administrateur l'a déjà tranchée, le
 * backend répond 409 avec le nom de celui qui a décidé : l'appelant affiche
 * ce message plutôt qu'une erreur générique.
 */
export function useApproveSupplierRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, decision_reason }: DecisionPayload) => {
      const response = await apiClient.post(
        buildApiUrl(`/auth/admin/supplier-requests/${id}/approve/`),
        { decision_reason: decision_reason ?? '' },
      );
      return response.data as unknown as { message: string; request: SupplierRequest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_REQUEST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      // Le compte devient fournisseur : rafraîchir aussi les sélecteurs
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

/** Refuser une demande (motif obligatoire). */
export function useRejectSupplierRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, decision_reason }: DecisionPayload) => {
      const response = await apiClient.post(
        buildApiUrl(`/auth/admin/supplier-requests/${id}/reject/`),
        { decision_reason: decision_reason ?? '' },
      );
      return response.data as unknown as { message: string; request: SupplierRequest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_REQUEST_KEYS.all });
    },
  });
}
