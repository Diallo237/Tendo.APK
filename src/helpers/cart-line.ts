import type { CartItem } from '@/types/product';

/**
 * Identifiant d'une ligne de panier.
 *
 * Un même produit peut y figurer plusieurs fois s'il est décliné : « chemise M
 * rouge » et « chemise L bleu » sont deux lignes distinctes, chacune avec son
 * stock. L'identifiant du produit seul ne suffit donc plus comme clé.
 */
export function cartLineKey(productId: number, variantId?: number | null): string {
  return `${productId}:${variantId ?? ''}`;
}

/** Clé de la ligne telle qu'elle est stockée dans le panier. */
export function itemKey(item: CartItem): string {
  return cartLineKey(item.product.id, item.variant?.id);
}

/** Stock réellement disponible pour une ligne : celui de la déclinaison si elle existe. */
export function availableStock(item: CartItem): number {
  return item.variant ? item.variant.stock_quantity : item.product.stock_quantity;
}
