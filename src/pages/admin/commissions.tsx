import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Download, Loader2, Percent, RotateCcw, Save } from 'lucide-react';

import PageContainer from '@/components/shared/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  openCommissionGridPdf,
  useCommissionGrid,
  useUpdateCommissionGrid,
} from '@/services/category.service';

/** Valeur affichée dans le champ : le taux propre, ou vide s'il est hérité. */
const valeurSaisie = (taux?: string | null) =>
  taux === null || taux === undefined ? '' : String(Number(taux));

/**
 * Grille des commissions par catégorie.
 *
 * Chaque taux est modifiable à tout moment. Laisser une case vide fait suivre
 * la catégorie parente, ou le taux par défaut de la plateforme : on ne
 * renseigne donc que les grandes catégories.
 *
 * Un taux modifié ne change rien aux commandes déjà passées — leur taux est
 * figé au moment de la vente.
 */
export default function AdminCommissions() {
  const { data, isLoading, error } = useCommissionGrid();
  const { mutateAsync: enregistrer, isPending } = useUpdateCommissionGrid();
  const [saisies, setSaisies] = useState<Record<number, string>>({});
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const lignes = data?.results ?? [];

  // Les saisies partent des taux du serveur, et se réalignent après un
  // enregistrement ou un rechargement.
  useEffect(() => {
    setSaisies(
      Object.fromEntries(lignes.map((l) => [l.id, valeurSaisie(l.commission_rate)])),
    );
  }, [data]);

  const modifiees = useMemo(
    () =>
      lignes.filter(
        (ligne) => (saisies[ligne.id] ?? '').trim() !== valeurSaisie(ligne.commission_rate),
      ),
    [lignes, saisies],
  );

  const invalides = useMemo(
    () =>
      modifiees.filter((ligne) => {
        const valeur = (saisies[ligne.id] ?? '').trim();
        if (valeur === '') return false;
        const nombre = Number(valeur.replace(',', '.'));
        return Number.isNaN(nombre) || nombre < 0 || nombre > 100;
      }),
    [modifiees, saisies],
  );

  const sauvegarder = async () => {
    if (invalides.length > 0) {
      toast.error('Un taux doit être un nombre entre 0 et 100.');
      return;
    }
    try {
      await enregistrer(
        modifiees.map((ligne) => {
          const valeur = (saisies[ligne.id] ?? '').trim();
          return {
            id: ligne.id,
            commission_rate: valeur === '' ? null : valeur.replace(',', '.'),
          };
        }),
      );
      toast.success(
        `${modifiees.length} taux mis à jour. Les commandes déjà passées gardent le leur.`,
      );
    } catch (erreur: any) {
      toast.error(erreur?.details?.error || erreur?.message || "L'enregistrement a échoué");
    }
  };

  const telechargerPdf = async () => {
    setPdfEnCours(true);
    try {
      await openCommissionGridPdf();
    } catch {
      toast.error('Le PDF n’a pas pu être généré');
    } finally {
      setPdfEnCours(false);
    }
  };

  return (
    <PageContainer
      title="Commissions"
      subtitle="Part prélevée par la plateforme sur les ventes, catégorie par catégorie"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Case vide = la catégorie suit son parent, ou le taux par défaut
              {data?.default_rate ? ` (${Number(data.default_rate)} %)` : ''}. Un taux
              modifié ne change pas les commandes déjà passées.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={telechargerPdf}
                disabled={pdfEnCours || isLoading}
              >
                {pdfEnCours ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                PDF
              </Button>
              {modifiees.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    setSaisies(
                      Object.fromEntries(
                        lignes.map((l) => [l.id, valeurSaisie(l.commission_rate)]),
                      ),
                    )
                  }
                  disabled={isPending}
                >
                  <RotateCcw className="size-3.5" />
                  Annuler
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5"
                onClick={sauvegarder}
                disabled={isPending || modifiees.length === 0}
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Enregistrer{modifiees.length > 0 ? ` (${modifiees.length})` : ''}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : lignes.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Aucune catégorie. Créez-en d’abord dans « Catégories ».
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="w-[170px]">Commission Tendo</TableHead>
                        <TableHead className="w-[170px]">Taux appliqué</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lignes.map((ligne) => {
                        const saisie = saisies[ligne.id] ?? '';
                        const invalide = invalides.some((l) => l.id === ligne.id);
                        return (
                          <TableRow key={ligne.id}>
                            <TableCell>
                              <div className="font-medium">{ligne.name}</div>
                              {ligne.parent_name && (
                                <div className="text-xs text-muted-foreground">
                                  dans {ligne.parent_name}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <Input
                                  inputMode="decimal"
                                  placeholder="hérité"
                                  className={`pr-7 ${invalide ? 'border-destructive' : ''}`}
                                  value={saisie}
                                  onChange={(e) =>
                                    setSaisies((etat) => ({ ...etat, [ligne.id]: e.target.value }))
                                  }
                                />
                                <Percent className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium tabular-nums">
                                {Number(ligne.effective_rate)} %
                              </span>
                              {ligne.inherited && (
                                <Badge variant="secondary" className="ml-2">héritée</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
