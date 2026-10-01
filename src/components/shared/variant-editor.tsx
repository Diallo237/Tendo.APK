import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductVariantDraft } from '@/types/product';
import { cleDeclinaison, ligneVideDeclinaison, stockDesDeclinaisons } from '@/helpers/product-variants';

interface VariantEditorProps {
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
  disabled?: boolean;
}

/**
 * Saisie des déclinaisons d'un produit, chacune avec son stock propre.
 *
 * Les deux dimensions sont indépendantes : un produit peut n'être décliné qu'en
 * couleur (un téléphone), qu'en taille (une bague), ou les deux. Tant qu'aucune
 * ligne n'est ajoutée, le produit garde son stock global habituel. Dès qu'il y
 * en a une, le stock du produit devient la somme des déclinaisons — c'est le
 * serveur qui le recalcule, le champ « Stock » passe donc en lecture seule.
 */
export function VariantEditor({ variants, onChange, disabled = false }: VariantEditorProps) {
  const modifier = (index: number, champs: Partial<ProductVariantDraft>) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...champs } : v)));
  };

  const supprimer = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const ajouter = () => {
    onChange([...variants, ligneVideDeclinaison()]);
  };

  const total = stockDesDeclinaisons(variants);
  const doublons = new Set(
    variants.map(cleDeclinaison).filter((cle, i, liste) => liste.indexOf(cle) !== i)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>Tailles et couleurs</Label>
          <p className="text-sm text-muted-foreground">
            Chaque ligne a son propre stock. Une seule des deux colonnes suffit : une couleur
            sans taille, ou l'inverse. Laissez vide si le produit n'est pas décliné.
          </p>
        </div>
        {variants.length > 0 && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Stock total : <strong>{total}</strong>
          </span>
        )}
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-xs text-muted-foreground md:grid md:grid-cols-[1fr_1fr_110px_90px_40px]">
            <span>Taille</span>
            <span>Couleur</span>
            <span>Stock</span>
            <span>En vente</span>
            <span />
          </div>

          {variants.map((variante, index) => {
            const enDouble = doublons.has(cleDeclinaison(variante));
            return (
              <div
                key={index}
                className="grid grid-cols-2 gap-2 rounded-md border p-2 md:grid-cols-[1fr_1fr_110px_90px_40px] md:items-center md:border-0 md:p-0"
              >
                <Input
                  value={variante.size}
                  onChange={(e) => modifier(index, { size: e.target.value })}
                  placeholder="M, 42…"
                  disabled={disabled}
                  aria-invalid={enDouble}
                />
                <Input
                  value={variante.color}
                  onChange={(e) => modifier(index, { color: e.target.value })}
                  placeholder="Rouge"
                  disabled={disabled}
                  aria-invalid={enDouble}
                />
                <Input
                  type="number"
                  min={0}
                  value={variante.stock_quantity}
                  onChange={(e) =>
                    modifier(index, { stock_quantity: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  disabled={disabled}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={variante.is_active}
                    onCheckedChange={(checked) => modifier(index, { is_active: checked })}
                    disabled={disabled}
                  />
                  <span className="text-xs text-muted-foreground md:hidden">En vente</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => supprimer(index)}
                  disabled={disabled}
                  aria-label="Supprimer la déclinaison"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => ajouter()} disabled={disabled}>
        <Plus className="mr-1 h-4 w-4" />
        Ajouter une déclinaison
      </Button>

      {doublons.size > 0 && (
        <p className="text-sm text-destructive">
          Deux déclinaisons ne peuvent pas avoir la même taille et la même couleur.
        </p>
      )}
    </div>
  );
}

