import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Archive, Loader2, RotateCcw, Trash2 } from 'lucide-react';

import PageContainer from '@/components/shared/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeleteConfirmationModal } from '@/components/modals';
import { useModal } from '@/components/shared/modal-provider';
import {
  useArchivedProducts,
  useDeleteProduct,
  useRestoreProduct,
} from '@/services/product.service';
import type { Product } from '@/types/product';

const DELETE_MODAL_ID = 'delete-archived-product';

/** Statut qu'avait le produit au moment de sa suppression par le fournisseur. */
const LIBELLES_STATUT: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(price: string): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
  }).format(parseFloat(price));
}

/**
 * Produits qu'un fournisseur a supprimés de son catalogue.
 *
 * Pour lui, ils n'existent plus ; ils attendent ici que l'administrateur
 * tranche — suppression définitive, ou retour au catalogue si la suppression
 * était une erreur. Un produit déjà commandé ne peut pas être détruit : le
 * serveur refuse, ses lignes de commande partiraient avec lui.
 */
export default function AdminArchivedProducts() {
  const { data: response, isLoading, error } = useArchivedProducts();
  const { mutateAsync: deleteProduct, isPending: suppressionEnCours } = useDeleteProduct();
  const { mutateAsync: restoreProduct } = useRestoreProduct();
  const { openModal } = useModal();
  const [cible, setCible] = useState<Product | null>(null);

  const produits: Product[] = Array.isArray(response)
    ? response
    : ((response as { results?: Product[] } | undefined)?.results ?? []);

  const supprimer = async () => {
    if (!cible) return;
    try {
      await deleteProduct(cible.id);
      toast.success(`« ${cible.name} » a été supprimé définitivement`);
      setCible(null);
    } catch (err: any) {
      toast.error(err?.details?.detail || err?.message || 'Suppression impossible');
    }
  };

  const remettre = async (produit: Product) => {
    try {
      const { detail } = await restoreProduct(produit.id);
      toast.success(detail || `« ${produit.name} » est de retour au catalogue`);
    } catch (err: any) {
      toast.error(err?.details?.detail || err?.message || 'Restauration impossible');
    }
  };

  return (
    <PageContainer
      title="Produits archivés"
      subtitle="Suppressions demandées par les fournisseurs, en attente de votre décision"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : produits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Archive className="size-8 text-muted-foreground" />
                <p className="font-medium">Aucun produit archivé</p>
                <p className="text-sm text-muted-foreground">
                  Les produits supprimés par les fournisseurs apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Supprimé par</TableHead>
                      <TableHead>Le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produits.map((produit) => (
                      <TableRow key={produit.id}>
                        <TableCell>
                          <div className="font-medium">{produit.name}</div>
                          <div className="text-xs text-muted-foreground">{produit.sku}</div>
                          {!!produit.orders_count && (
                            <div className="text-xs text-muted-foreground">
                              Déjà commandé ({produit.orders_count}) — ne peut pas être effacé
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{produit.supplier_name || '—'}</TableCell>
                        <TableCell className="text-sm">{formatPrice(produit.price)}</TableCell>
                        <TableCell className="text-sm">
                          {produit.archived_by_name || '—'}
                          <Badge variant="secondary" className="ml-2">
                            {LIBELLES_STATUT[produit.status] ?? produit.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(produit.archived_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => remettre(produit)}
                              title="Annuler la suppression : le produit revient chez son fournisseur"
                            >
                              <RotateCcw className="size-3.5" />
                              Remettre
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1.5"
                              disabled={suppressionEnCours || !!produit.orders_count}
                              title={produit.orders_count
                                ? 'Déjà commandé : le supprimer effacerait ses commandes. Il reste archivé.'
                                : undefined}
                              onClick={() => {
                                setCible(produit);
                                openModal(DELETE_MODAL_ID);
                              }}
                            >
                              {suppressionEnCours && cible?.id === produit.id
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Trash2 className="size-3.5" />}
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cible && (
        <DeleteConfirmationModal
          modalId={DELETE_MODAL_ID}
          title="Supprimer définitivement"
          description={`« ${cible.name} » sera effacé de la base. Cette action est irréversible.`}
          onConfirm={supprimer}
          confirmText="Supprimer définitivement"
        />
      )}
    </PageContainer>
  );
}
