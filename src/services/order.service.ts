import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosGet, useAxiosPost } from '@/hooks/use-api';
import type { Order, SupplierOrder, CheckoutPayload } from '@/types/order';
import { buildApiUrl } from '@/utils/api-client';
import apiClient from '@/utils/api-client';

export const ORDER_KEYS = {
  all: ['orders'] as const,
  history: () => [...ORDER_KEYS.all, 'history'] as const,
  supplier: () => [...ORDER_KEYS.all, 'supplier'] as const,
};

export function useCheckout() {
  const url = buildApiUrl('/orders/');
  return useAxiosPost<{ message: string; order: Order }, CheckoutPayload>(
    url,
    [[...ORDER_KEYS.history()]],
  );
}

/**
 * Suivi d'une commande passée sans compte : numéro de commande + téléphone
 * saisis au moment de l'achat.
 */
export async function trackGuestOrder(orderNumber: string, phone: string): Promise<Order> {
  const response = await apiClient.post(buildApiUrl('/orders/track/'), {
    order_number: orderNumber,
    phone,
  });
  return response.data as unknown as Order;
}

export function useOrderHistory(statusFilter?: string, search?: string, archived = false) {
  const url = buildApiUrl('/orders/history/');
  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;
  if (search) params.search = search;
  // Les commandes archivées sortent des listes : seul l'admin les demande
  if (archived) params.archived = '1';
  return useAxiosGet<{ count: number; orders: Order[] }>(
    [...ORDER_KEYS.history(), statusFilter, search, archived] as readonly unknown[],
    url,
    Object.keys(params).length ? { params } : undefined,
  );
}

/**
 * « Supprimer » une commande côté admin : elle est archivée, jamais détruite.
 *
 * Une commande porte l'historique du client, les ventes du fournisseur et les
 * commissions ; et recréditer son stock serait faux dès qu'elle a été livrée.
 * Le stock ne se rend qu'à l'annulation ou au retour.
 */
export function useArchiveOrder() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (orderId): Promise<{ message: string }> => {
      const res = await apiClient.post(buildApiUrl(`/orders/${orderId}/archive/`));
      return res.data as unknown as { message: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ORDER_KEYS.history()] }),
  });
}

/** Remettre une commande archivée dans les listes (admin). */
export function useUnarchiveOrder() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (orderId): Promise<{ message: string }> => {
      const res = await apiClient.post(buildApiUrl(`/orders/${orderId}/unarchive/`));
      return res.data as unknown as { message: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ORDER_KEYS.history()] }),
  });
}

export function useSupplierOrders(statusFilter?: string) {
  const url = buildApiUrl('/orders/supplier-orders/');
  return useAxiosGet<{ count: number; orders: SupplierOrder[] }>(
    [...ORDER_KEYS.supplier(), statusFilter] as readonly unknown[],
    url,
    statusFilter ? { params: { status: statusFilter } } : undefined,
  );
}

interface ReadinessResponse {
  message: string;
  my_is_ready: boolean;
  all_ready: boolean;
  suppliers_ready_count: number;
  suppliers_total_count: number;
}

export function useMarkSupplierReady() {
  const queryClient = useQueryClient();
  return useMutation<ReadinessResponse, Error, number>({
    mutationFn: async (orderId): Promise<ReadinessResponse> => {
      const res = await apiClient.post(buildApiUrl(`/orders/${orderId}/mark-ready/`));
      return res.data as unknown as ReadinessResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ORDER_KEYS.supplier()] }),
  });
}

export function useUnmarkSupplierReady() {
  const queryClient = useQueryClient();
  return useMutation<ReadinessResponse, Error, number>({
    mutationFn: async (orderId): Promise<ReadinessResponse> => {
      const res = await apiClient.delete(buildApiUrl(`/orders/${orderId}/mark-ready/`));
      return res.data as unknown as ReadinessResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ORDER_KEYS.supplier()] }),
  });
}

interface RappelResponse {
  message: string;
  rappeles: string[];
  trop_recents: string[];
}

/**
 * Rappeler aux fournisseurs en attente que la commande ne peut pas partir
 * sans eux (administrateur). Sans `supplierId`, tous ceux en attente sont
 * relancés d'un coup.
 */
export function useRemindSuppliers() {
  const queryClient = useQueryClient();
  return useMutation<RappelResponse, Error, { orderId: number; supplierId?: number }>({
    mutationFn: async ({ orderId, supplierId }): Promise<RappelResponse> => {
      const res = await apiClient.post(
        buildApiUrl(`/orders/${orderId}/remind-suppliers/`),
        supplierId ? { supplier_id: supplierId } : {},
      );
      return res.data as unknown as RappelResponse;
    },
    // La date du dernier rappel est affichée : la liste doit être rechargée
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ORDER_KEYS.history()] }),
  });
}

export async function downloadSupplierInvoice(orderId: number, _orderNumber: string): Promise<void> {
  const res = await apiClient.get(buildApiUrl(`/orders/${orderId}/supplier-invoice/`), {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data as unknown as BlobPart], { type: 'application/pdf' }));
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}

/** Facture générale Tendo (admin) — tous les produits de la commande. */
export async function downloadGeneralInvoice(orderId: number): Promise<void> {
  const res = await apiClient.get(buildApiUrl(`/orders/${orderId}/general-invoice/`), {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data as unknown as BlobPart], { type: 'application/pdf' }));
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}
