import { Palette } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProductVariant } from '@/types/product';

function etat(variante: ProductVariant) {
  if (!variante.is_active) return <Badge variant="secondary">Désactivée</Badge>;
  if (variante.stock_quantity <= 0) return <Badge variant="destructive">Épuisée</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-600">Disponible</Badge>;
}

/**
 * Déclinaisons d'un produit, en lecture, pour les pages de détail fournisseur
 * et admin. Seules les dimensions réellement utilisées ont une colonne : un
 * téléphone décliné en couleur n'affiche pas de colonne « Taille ».
 *
 * Rien n'est rendu pour un produit sans déclinaison.
 */
export function ProductVariantsCard({ variants }: { variants?: ProductVariant[] }) {
  if (!variants || variants.length === 0) return null;

  const avecTaille = variants.some((v) => v.size);
  const avecCouleur = variants.some((v) => v.color);
  // « taille », « couleur » ou « taille et couleur »
  const dimensions = [avecTaille && 'taille', avecCouleur && 'couleur'].filter(Boolean).join(' et ');
  const stockTotal = variants
    .filter((v) => v.is_active)
    .reduce((total, v) => total + v.stock_quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Déclinaisons ({variants.length})
        </CardTitle>
        <CardDescription>
          Stock par {dimensions} — {stockTotal} unité{stockTotal > 1 ? 's' : ''} au total
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:px-6 sm:pb-6">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {avecTaille && <TableHead>Taille</TableHead>}
                {avecCouleur && <TableHead>Couleur</TableHead>}
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variante) => (
                <TableRow key={variante.id} className={variante.is_active ? undefined : 'text-muted-foreground'}>
                  {avecTaille && <TableCell className="font-medium">{variante.size || '—'}</TableCell>}
                  {avecCouleur && <TableCell>{variante.color || '—'}</TableCell>}
                  <TableCell className="text-right tabular-nums">{variante.stock_quantity}</TableCell>
                  <TableCell>{etat(variante)}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {variante.sku || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
