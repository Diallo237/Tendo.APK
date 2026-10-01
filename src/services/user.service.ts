import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Users } from "@/types/user";
import type { AdminUser, AdminUserCreate, AdminUserUpdate } from "@/types/user";
import { buildApiUrl } from "@/utils/api-client";
import { USERS_KEYS } from "./auth.service";
import { useAxiosGet } from "@/hooks/use-api";
import apiClient from "@/utils/api-client";
import { useUser } from "@/contexts/user-context";

export interface DepotManager {
  id: number;
  full_name: string;
  phone: string | null;
  email: string;
}

const ADMIN_USERS_KEYS = {
  all: ['admin', 'users'] as const,
  list: (role?: string, search?: string) => ['admin', 'users', 'list', role ?? '', search ?? ''] as const,
  detail: (id: number) => ['admin', 'users', 'detail', id] as const,
};

/**
 * Liste des fournisseurs — endpoint réservé aux administrateurs (il expose des
 * données personnelles). `enabled` évite un 403 inutile côté fournisseur.
 */
export function useGetSuppliers(enabled = true) {
  return useAxiosGet<{ count: number; results: Users[] }>(
    USERS_KEYS.all,
    buildApiUrl('/auth/users/suppliers/'),
    undefined,
    { enabled },
  );
}

/** Hook pour récupérer les gérants de dépôt */
export function useDepotManagers() {
  return useAxiosGet<{ count: number; results: DepotManager[] }>(
    ['users', 'depot-managers'] as const,
    buildApiUrl('/auth/users/depot-managers/'),
  );
}

// ── Admin user CRUD ──────────────────────────────────────────────────────────

export function useAdminUsers(role?: string, search?: string) {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (search) params.search = search;

  return useAxiosGet<{ count: number; results: AdminUser[] }>(
    ADMIN_USERS_KEYS.list(role, search) as readonly unknown[],
    buildApiUrl('/auth/admin/users/'),
    Object.keys(params).length ? { params } : undefined,
  );
}

export function useAdminUserDetail(id: number | null) {
  return useAxiosGet<AdminUser>(
    ADMIN_USERS_KEYS.detail(id ?? 0) as readonly unknown[],
    buildApiUrl(`/auth/admin/users/${id}/`),
    undefined,
    { enabled: !!id },
  );
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, Error, AdminUserCreate>({
    mutationFn: async (data) => {
      const res = await apiClient.post(buildApiUrl('/auth/admin/users/create/'), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.all] });
      // Sélecteurs alimentés par /auth/users/suppliers|depot-managers
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

/**
 * Rôles d'un compte, gérés par l'administrateur.
 *
 * Un même compte peut cumuler client, fournisseur et gérant de dépôt : il se
 * connecte avec les mêmes identifiants sur chacune des pages correspondantes.
 */
export function useAdminUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, Error, { id: number; roles: string[] }>({
    mutationFn: async ({ id, roles }) => {
      const res = await apiClient.post(buildApiUrl(`/auth/admin/users/${id}/roles/`), { roles });
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: (_, { id }) => {
      // Le compte change de liste (un client devenu gérant apparaît ailleurs)
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.all] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.detail(id)] });
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, Error, { id: number } & AdminUserUpdate>({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiClient.patch(buildApiUrl(`/auth/admin/users/${id}/update/`), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.all] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.detail(id)] });
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(buildApiUrl(`/auth/admin/users/${id}/delete/`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.all] });
      // Sélecteurs alimentés par /auth/users/suppliers|depot-managers
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

export function useAdminToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation<{ is_active: boolean; message: string }, Error, number>({
    mutationFn: async (id) => {
      const res = await apiClient.post(buildApiUrl(`/auth/admin/users/${id}/toggle-active/`));
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_KEYS.all] });
      // Sélecteurs alimentés par /auth/users/suppliers|depot-managers
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

// ── Self-service profile update ───────────────────────────────────────────────

export interface SelfProfileUpdate {
  first_name?: string;
  last_name?: string;
  // client only:
  email?: string;
  phone?: string;
  address?: string;
  commune_id?: number | null;
}

export function useUpdateProfile() {
  const { setUser } = useUser();
  const queryClient = useQueryClient();
  return useMutation<Users, Error, SelfProfileUpdate>({
    mutationFn: async (data) => {
      const res = await apiClient.patch(buildApiUrl('/auth/users/me/update/'), data);
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [...USERS_KEYS.all] });
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, { current_password: string; new_password: string }>({
    mutationFn: async (data) => {
      await apiClient.post(buildApiUrl('/auth/users/set_password/'), data);
    },
  });
}

// ── Platform settings ─────────────────────────────────────────────────────────

export interface PlatformSettings {
  name: string;
  ninea: string;
  logo: string | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  updated_at: string | null;
}

const PLATFORM_KEY = ['platform-settings'] as const;

export function usePlatformSettings() {
  return useAxiosGet<PlatformSettings>(PLATFORM_KEY, buildApiUrl('/auth/platform/'));
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation<PlatformSettings, Error, FormData>({
    mutationFn: async (data) => {
      const res = await apiClient.patch(buildApiUrl('/auth/platform/update/'), data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data !== undefined ? res.data.data : res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...PLATFORM_KEY] }),
  });
}
