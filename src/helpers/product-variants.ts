import type { ProductVariant, ProductVariantDraft } from '@/types/product';

/**
 * Dimensions réellement déclinées par un produit.
 *
 * Rien n'impose d'avoir les deux : un téléphone se décline en couleur seule,
 * une bague en taille seule. Les libellés se formulent d'après ce tableau,
 * pour ne jamais parler de taille à qui n'en a pas.
 */
export function dimensionsDeclinaisons(variants: ProductVariant[]): ('taille' | 'couleur')[] {
  const actives = variants.filter((v) => v.is_active);
  const dimensions: ('taille' | 'couleur')[] = [];
  if (actives.some((v) => v.size)) dimensions.push('taille');
  if (actives.some((v) => v.color)) dimensions.push('couleur');
  return dimensions;
}

/** « une taille », « une couleur », « une taille et une couleur ». */
export function libelleChoix(variants: ProductVariant[]): string {
  return dimensionsDeclinaisons(variants).map((d) => `une ${d}`).join(' et ');
}

/** « tailles », « couleurs », « tailles et couleurs ». */
export function libelleDimensionsPluriel(variants: ProductVariant[]): string {
  return dimensionsDeclinaisons(variants).map((d) => `${d}s`).join(' et ');
}

/**
 * Stock du produit d'après ses déclinaisons — même règle que le serveur
 * (`Product.resynchroniser_stock`) : une déclinaison désactivée ne compte pas.
 */
export function stockDesDeclinaisons(variants: ProductVariantDraft[]): number {
  return variants
    .filter((v) => v.is_active)
    .reduce((somme, v) => somme + (v.stock_quantity || 0), 0);
}

/** Ligne vierge ajoutée par l'éditeur de déclinaisons. */
export const ligneVideDeclinaison = (): ProductVariantDraft => ({
  size: '',
  color: '',
  stock_quantity: 0,
  is_active: true,
});

/** Clé d'unicité d'une déclinaison, insensible à la casse et aux espaces. */
export function cleDeclinaison(variante: ProductVariantDraft): string {
  return `${variante.size.trim().toLowerCase()}|${variante.color.trim().toLowerCase()}`;
}

/**
 * Vérifie les déclinaisons avant envoi, avec les mêmes règles que le serveur.
 * Renvoie un message d'erreur, ou null si tout est correct.
 */
export function validerDeclinaisons(variants: ProductVariantDraft[]): string | null {
  if (variants.length === 0) return null;

  if (variants.some((v) => !v.size.trim() && !v.color.trim())) {
    return 'Chaque déclinaison doit avoir au moins une taille ou une couleur.';
  }

  const cles = variants.map(cleDeclinaison);
  if (new Set(cles).size !== cles.length) {
    return 'Deux déclinaisons ne peuvent pas avoir la même taille et la même couleur.';
  }

  return null;
}
