import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosGet, useAxiosPost } from '@/hooks/use-api';
import { buildApiUrl } from '@/utils/api-client';
import apiClient from '@/utils/api-client';
import type { Depot, Shipment } from '@/types/order';

const SHIPPING_KEYS = {
  depots: ['shipping', 'depots'] as const,
  depotsForOrder: (orderId: number) => ['shipping', 'depots', 'order', orderId] as const,
  depotShipments: (status?: string) => ['shipping', 'depot-shipments', status ?? 'all'] as const,
};

export function useDepots() {
  return useAxiosGet<Depot[]>(
    SHIPPING_KEYS.depots as readonly unknown[],
    buildApiUrl('/shipping/depots/'),
  );
}

export function useDepotsForOrder(orderId: number | null) {
  return useAxiosGet<Depot[]>(
    SHIPPING_KEYS.depotsForOrder(orderId ?? 0) as readonly unknown[],
    buildApiUrl('/shipping/depots/'),
    orderId ? { params: { order_id: orderId } } : undefined,
    { enabled: !!orderId },
  );
}

export interface DepotPayload {
  name: string;
  address?: string;
  commune?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  manager?: number | null;
  is_active?: boolean;
}

export function useCreateDepot() {
  const queryClient = useQueryClient();
  return useMutation<Depot, Error, DepotPayload>({
    mutationFn: async (data) => {
      const res = await apiClient.post(buildApiUrl('/shipping/depots/create/'), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHIPPING_KEYS.depots] }),
  });
}

export function useUpdateDepot() {
  const queryClient = useQueryClient();
  return useMutation<Depot, Error, { id: number } & Partial<DepotPayload>>({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiClient.patch(buildApiUrl(`/shipping/depots/${id}/update/`), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHIPPING_KEYS.depots] }),
  });
}

export function useDeleteDepot() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(buildApiUrl(`/shipping/depots/${id}/delete/`));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHIPPING_KEYS.depots] }),
  });
}

/** Corriger le dépôt d'une expédition déjà partie (administrateur uniquement). */
export function useChangeDepot(shipmentId: number) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, { depot_id: number }>({
    mutationFn: async (data) => {
      const res = await apiClient.patch(buildApiUrl(`/shipping/shipments/${shipmentId}/change-depot/`), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    // Toutes les listes de commandes affichent le dépôt : on invalide la racine.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useDepotShipments(statusFilter?: string) {
  return useAxiosGet<{ count: number; shipments: Shipment[] }>(
    SHIPPING_KEYS.depotShipments(statusFilter) as readonly unknown[],
    buildApiUrl('/shipping/depot-shipments/'),
    statusFilter ? { params: { status: statusFilter } } : undefined,
  );
}

export function useSendToDepot() {
  return useAxiosPost<
    { message: string; tracking_number: string; depot: string },
    { order_id: number; depot_id: number; notes?: string }
  >(
    buildApiUrl('/shipping/send-to-depot/'),
    [
      [...SHIPPING_KEYS.depotShipments()],
      ['orders', 'supplier'],
      ['orders', 'history'],
    ],
  );
}

export function useMarkReceived(shipmentId: number) {
  return useAxiosPost<{ message: string }, Record<string, never>>(
    buildApiUrl(`/shipping/depot-shipments/${shipmentId}/mark-received/`),
    [[...SHIPPING_KEYS.depotShipments()]],
  );
}

export function useNotifyClient(shipmentId: number) {
  return useAxiosPost<{ message: string }, Record<string, never>>(
    buildApiUrl(`/shipping/depot-shipments/${shipmentId}/notify-client/`),
    [[...SHIPPING_KEYS.depotShipments()]],
  );
}

export function useMarkReturned(shipmentId: number) {
  return useAxiosPost<{ message: string; reason: string }, { reason: string }>(
    buildApiUrl(`/shipping/depot-shipments/${shipmentId}/mark-returned/`),
    [[...SHIPPING_KEYS.depotShipments()]],
  );
}

export function useMarkReturnShipped(shipmentId: number) {
  return useAxiosPost<{ message: string }, Record<string, never>>(
    buildApiUrl(`/shipping/depot-shipments/${shipmentId}/mark-return-shipped/`),
    [[...SHIPPING_KEYS.depotShipments()]],
  );
}

export interface RecipientPayload {
  recipient_first_name: string;
  recipient_last_name: string;
  recipient_id_card: string;
  recipient_phone?: string;
}

export function useMarkDelivered(shipmentId: number) {
  return useAxiosPost<{ message: string }, RecipientPayload>(
    buildApiUrl(`/shipping/depot-shipments/${shipmentId}/mark-delivered/`),
    [[...SHIPPING_KEYS.depotShipments()]],
  );
}
