import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/product';
import { libelleChoix } from '@/helpers/product-variants';

interface VariantPickerProps {
  variants: ProductVariant[];
  value: ProductVariant | null;
  onChange: (variant: ProductVariant | null) => void;
}

/** Valeurs distinctes d'une dimension, dans l'ordre où le fournisseur les a saisies. */
function valeursDistinctes(variants: ProductVariant[], champ: 'size' | 'color'): string[] {
  return [...new Set(variants.map((v) => v[champ]).filter(Boolean))];
}

/**
 * Choix de la taille et de la couleur sur la fiche produit.
 *
 * Les deux dimensions sont facultatives : un produit peut n'être décliné qu'en
 * taille, qu'en couleur, ou les deux. Une valeur est grisée quand elle ne
 * mène à aucune déclinaison disponible compte tenu de l'autre choix — évite au
 * client de sélectionner « L » puis de découvrir que le rouge est épuisé.
 */
export function VariantPicker({ variants, value, onChange }: VariantPickerProps) {
  const actives = useMemo(() => variants.filter((v) => v.is_active), [variants]);
  const tailles = useMemo(() => valeursDistinctes(actives, 'size'), [actives]);
  const couleurs = useMemo(() => valeursDistinctes(actives, 'color'), [actives]);

  const [taille, setTaille] = useState(value?.size ?? '');
  const [couleur, setCouleur] = useState(value?.color ?? '');

  // Remonte la déclinaison correspondante dès que la sélection est complète.
  useEffect(() => {
    const complet = (tailles.length === 0 || taille) && (couleurs.length === 0 || couleur);
    if (!complet) {
      onChange(null);
      return;
    }
    const trouvee = actives.find((v) => v.size === taille && v.color === couleur) ?? null;
    onChange(trouvee);
    // `onChange` est recréé à chaque rendu du parent : l'exclure évite une boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taille, couleur, actives, tailles.length, couleurs.length]);

  if (actives.length === 0) return null;

  /** Une valeur reste proposable s'il existe une déclinaison en stock avec l'autre choix. */
  const estProposable = (champ: 'size' | 'color', valeur: string) => {
    const autre = champ === 'size' ? couleur : taille;
    const champAutre = champ === 'size' ? 'color' : 'size';
    return actives.some(
      (v) => v[champ] === valeur && (!autre || v[champAutre] === autre) && v.is_available
    );
  };

  const ligne = (
    titre: string,
    champ: 'size' | 'color',
    valeurs: string[],
    selection: string,
    selectionner: (v: string) => void
  ) => (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium">{titre}</span>
        {selection && <span className="text-sm text-muted-foreground">: {selection}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {valeurs.map((valeur) => {
          const proposable = estProposable(champ, valeur);
          const choisie = selection === valeur;
          return (
            <button
              key={valeur}
              type="button"
              onClick={() => selectionner(choisie ? '' : valeur)}
              disabled={!proposable}
              aria-pressed={choisie}
              className={cn(
                'min-w-11 rounded-md border px-3 py-1.5 text-sm transition-colors',
                choisie
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input hover:border-primary hover:bg-accent',
                !proposable && 'cursor-not-allowed line-through opacity-40 hover:border-input hover:bg-transparent'
              )}
            >
              {valeur}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {tailles.length > 0 && ligne('Taille', 'size', tailles, taille, setTaille)}
      {couleurs.length > 0 && ligne('Couleur', 'color', couleurs, couleur, setCouleur)}

      {value ? (
        value.is_available ? (
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span className="size-1.5 rounded-full bg-green-500" />
            {value.label} — {value.stock_quantity} disponible{value.stock_quantity > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            {value.label} — épuisé
          </Badge>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Choisissez {libelleChoix(actives)} pour continuer.
        </p>
      )}
    </div>
  );
}
