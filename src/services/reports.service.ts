import { useAxiosGet } from '@/hooks/use-api';
import { buildApiUrl } from '@/utils/api-client';
import apiClient from '@/utils/api-client';

// ================================
// TYPES — Rapports dépôts / régions (admin)
// ================================

export interface DepotStatRow {
  depot_id: number;
  depot_name: string;
  city: string;
  region: string;
  volume: number;
  delivered: number;
  revenue: number;
}

export interface RegionStatRow {
  region: string;
  depots_count: number;
  volume: number;
  delivered: number;
  revenue: number;
}

export interface DepotStats {
  depots: DepotStatRow[];
  regions: RegionStatRow[];
}

// ================================
// TYPES — Alertes stock faible
// ================================

export type StockState = 'out' | 'low';

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  state: StockState;
  status: string;
  supplier_id: number;
  supplier_name: string;
}

export interface LowStockReport {
  threshold: number;
  out_of_stock_count: number;
  low_stock_count: number;
  products: LowStockProduct[];
}

// ================================
// TYPES — Avis fournisseur
// ================================

export interface ReviewProductRow {
  product_id: number;
  name: string;
  avg_rating: number;
  reviews_count: number;
}

export interface RecentReview {
  product_name: string;
  rating: number;
  title: string;
  comment: string;
  user: string;
  created_at: string;
}

/** Avis complet (renvoyé par la liste exhaustive). */
export interface ReviewItem extends RecentReview {
  id: number;
}

export interface SupplierReviewsList {
  count: number;
  reviews: ReviewItem[];
}

export interface SupplierReviewsReport {
  overall: {
    avg_rating: number;
    total_reviews: number;
    products_rated: number;
  };
  products: ReviewProductRow[];
  recent_reviews: RecentReview[];
}

// ================================
// HOOKS — Lecture des rapports
// ================================

/** Revenus / volume par dépôt et par région (admin). */
export function useAdminDepotStats() {
  return useAxiosGet<DepotStats>(
    ['admin-depot-stats'] as const,
    buildApiUrl('/analytics/admin/depot-stats/'),
  );
}

/** Alertes stock faible — tous fournisseurs (admin). */
export function useAdminLowStock() {
  return useAxiosGet<LowStockReport>(
    ['admin-low-stock'] as const,
    buildApiUrl('/analytics/admin/low-stock/'),
  );
}

/** Alertes stock faible — produits du fournisseur (supplierId : admin uniquement). */
export function useSupplierLowStock(supplierId?: number | null) {
  const params: Record<string, string> = {};
  if (supplierId) params.supplier_id = String(supplierId);

  return useAxiosGet<LowStockReport>(
    ['supplier-low-stock', supplierId ?? 'me'] as const,
    buildApiUrl('/analytics/supplier/low-stock/'),
    { params },
  );
}

/** Note moyenne et avis reçus sur les produits du fournisseur. */
export function useSupplierReviews(supplierId?: number | null) {
  const params: Record<string, string> = {};
  if (supplierId) params.supplier_id = String(supplierId);

  return useAxiosGet<SupplierReviewsReport>(
    ['supplier-reviews-report', supplierId ?? 'me'] as const,
    buildApiUrl('/analytics/supplier/reviews/'),
    { params },
  );
}

/** Liste complète des avis reçus sur les produits du fournisseur. */
export function useSupplierReviewsList(supplierId?: number | null) {
  const params: Record<string, string> = {};
  if (supplierId) params.supplier_id = String(supplierId);

  return useAxiosGet<SupplierReviewsList>(
    ['supplier-reviews-list', supplierId ?? 'me'] as const,
    buildApiUrl('/analytics/supplier/reviews/list/'),
    { params },
  );
}

// ================================
// EXPORT EXCEL
// ================================

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Télécharge un rapport au format Excel.
 * @param endpoint - chemin API relatif (sans le préfixe /api)
 * @param filename - nom du fichier proposé au téléchargement
 * @param params   - paramètres de requête additionnels (ex. supplier_id)
 */
export async function downloadReportExcel(
  endpoint: string,
  filename: string,
  params: Record<string, string> = {},
): Promise<void> {
  // NB : on utilise « export » et non « format » — ce dernier est réservé
  // par DRF pour la négociation de contenu et provoque un 404.
  const res = await apiClient.get(buildApiUrl(endpoint), {
    params: { ...params, export: 'xlsx' },
    responseType: 'blob',
  });

  const data = res.data as unknown as Blob;

  // Le serveur peut renvoyer un statut 200 mais un corps qui n'est PAS un
  // fichier Excel (erreur JSON déguisée en blob, page HTML d'un proxy, corps
  // vide…). Sans ce contrôle, on téléchargerait un .xlsx vide/corrompu
  // silencieusement. On lève donc une erreur explicite à la place.
  const type = data.type || '';
  if (data.size === 0 || type.includes('json') || type.includes('html') || type.includes('text')) {
    let message = "Le serveur n'a pas renvoyé de fichier Excel (réponse vide ou erreur).";
    try {
      const parsed = JSON.parse(await data.text());
      message = parsed.detail || parsed.error || message;
    } catch {
      /* corps non-JSON : on garde le message générique */
    }
    throw new Error(message);
  }

  const blob = new Blob([data], { type: XLSX_MIME });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}

// ================================
// EXPORT PRODUITS — colonnes au choix
// ================================

export interface ProductExportColumn {
  key: string;
  label: string;
  /** Colonne masquée dans la vue fournisseur (ex. « Fournisseur »). */
  supplierHidden?: boolean;
}

/** Colonnes exportables — l'ordre suit celui du fichier Excel généré. */
export const PRODUCT_EXPORT_COLUMNS: ProductExportColumn[] = [
  { key: 'name', label: 'Nom' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Catégorie' },
  { key: 'price', label: 'Prix' },
  { key: 'stock_quantity', label: 'Stock' },
  { key: 'status', label: 'Statut' },
  { key: 'is_active', label: 'Actif' },
  { key: 'unite', label: 'Unité' },
  { key: 'weight', label: 'Poids' },
  { key: 'rating', label: 'Note moyenne' },
  { key: 'reviews_count', label: "Nombre d'avis" },
  { key: 'created_at', label: 'Date de création' },
  { key: 'description', label: 'Description' },
  { key: 'supplier', label: 'Fournisseur', supplierHidden: true },
];

/**
 * Télécharge les produits en Excel avec les colonnes choisies.
 * @param columns - clés de colonnes (cf. PRODUCT_EXPORT_COLUMNS)
 */
export async function downloadProductsExcel(columns: string[]): Promise<void> {
  await downloadReportExcel('/analytics/products/export/', 'produits.xlsx', {
    columns: columns.join(','),
  });
}
