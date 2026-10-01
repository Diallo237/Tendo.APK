// Types pour les catégories
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent?: number | null;
  is_active: boolean;
}

export interface CategorySearchResponse {
  query: string;
  count: number;
  results: Category[];
}


/**
 * Ligne de la grille des commissions.
 *
 * `commission_rate` (le taux propre à la catégorie) et `inherited` ne sont
 * renvoyés qu'à l'administrateur : le fournisseur ne reçoit que le taux
 * réellement appliqué.
 */
export interface CommissionRow {
  id: number;
  name: string;
  parent_name: string | null;
  effective_rate: string;
  commission_rate?: string | null;
  inherited?: boolean;
  parent?: number | null;
}

export interface CommissionGrid {
  /** Taux appliqué quand ni la catégorie ni ses parents n'en ont. */
  default_rate: string;
  results: CommissionRow[];
}
