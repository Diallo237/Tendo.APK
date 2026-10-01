export interface UserProfile {
  id: number;
  avatar: string;
  bio: string;
  birth_date: string;
  age: number;
}

export interface Users {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  /** Tous les rôles du compte (client + fournisseur possible). */
  roles: string[];
  phone: string;
  address: string;
  commune_id: number | null;
  commune_name: string | null;
  departement_id: number | null;
  departement_name: string | null;
  region_id: number | null;
  region_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
  orders_count: number;
  products_count: number;
  total_sales: number;
  total_spent: number;
  /** Dernière demande d'accès fournisseur (null si aucune). */
  supplier_request: SupplierRequestSummary | null;
}

export type SupplierRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SupplierRequestSummary {
  id: number;
  status: SupplierRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  decision_reason: string;
}

/** Demande d'accès fournisseur, vue complète (espace admin). */
export interface SupplierRequest extends SupplierRequestSummary {
  user: number;
  user_full_name: string;
  user_email: string;
  user_phone: string | null;
  company_name: string;
  phone: string;
  ninea: string;
  message: string;
  status_display: string;
  reviewed_by: number | null;
  reviewed_by_name: string;
}

export interface SupplierRequestCreate {
  company_name: string;
  phone: string;
  ninea?: string;
  message?: string;
}

export type UserCreate = Omit<Users, 'id' | 'full_name' | 'username' | 'is_verified' | 'is_active' | 'created_at' | 'updated_at' | 'orders_count' | 'products_count' | 'total_sales' | 'total_spent' | 'profile' | 'commune_id' | 'commune_name' | 'departement_id' | 'departement_name' | 'region_id' | 'region_name' | 'roles' | 'supplier_request'> & {
  password: string;
};

export type UserUpdate = Partial<Omit<Users, 'id' | 'username' | 'email' | 'is_verified' | 'is_active' | 'created_at' | 'updated_at' | 'orders_count' | 'products_count' | 'total_sales' | 'total_spent' | 'roles' | 'supplier_request'>>;

// ── Admin user management ────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  reference: string | null;
  role: 'client' | 'fournisseur' | 'gerant_depot';
  roles: string[];
  is_active: boolean;
  is_verified: boolean;
  commune_name: string | null;
  departement_name: string | null;
  region_name: string | null;
  address: string | null;
  orders_count: number;
  products_count: number;
  total_sales: number;
  total_spent: number;
  profile: UserProfile | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  address?: string;
  role: 'client' | 'fournisseur' | 'gerant_depot';
  is_active?: boolean;
}

export interface AdminUserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  role?: 'client' | 'fournisseur' | 'gerant_depot';
  is_active?: boolean;
}
