/**
 * Déclinaison d'un produit : une taille, une couleur, son propre stock.
 * Les deux dimensions sont facultatives et indépendantes : un téléphone peut
 * n'avoir qu'une couleur, une bague qu'une taille. Un produit sans déclinaison
 * conserve simplement son stock global.
 */
export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  /** Libellé prêt à afficher, calculé côté serveur : « M · Rouge ». */
  label: string;
  stock_quantity: number;
  is_active: boolean;
  is_available: boolean;
  sku?: string;
}

/** Déclinaison en cours de saisie par le fournisseur (pas encore d'id). */
export interface ProductVariantDraft {
  id?: number;
  size: string;
  color: string;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock_quantity: number;
  sku: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  supplier?: number;
  supplier_name?: string;
  category?: number;
  category_name?: string;
  description?: string;
  weight?: string;
  unite?: 'kg' | 'g' | 'lb' | 'oz' | 'l' | 'ml' | 'unit';
  created_at?: string;
  updated_at?: string;
  images?: string[]; // Images du backend (tableau de chemins)
  image?: string; // Image principale (pour compatibilité avec ProductCard)
  rating?: string | number; // Note sur 5 (peut être string depuis l'API)
  reviews_count?: number; // Nombre d'avis
  variants?: ProductVariant[]; // Vide ou absent pour un produit sans taille/couleur
  /** Non nul si le produit a été retiré du catalogue en attendant l'avis d'un admin. */
  archived_at?: string | null;
  archived_by_name?: string | null;
  /** Lignes de commande citant le produit — fourni à l'admin seulement. */
  orders_count?: number | null;
}

export interface ProductImage {
  id: number;
  image: string;
  product: number;
  product_name?: string;
  is_primary?: boolean;
  alt_text?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Déclinaison choisie, si le produit en propose. */
  variant?: ProductVariant | null;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

