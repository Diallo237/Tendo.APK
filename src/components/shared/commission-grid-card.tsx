import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, FileText, Loader2, Percent } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { openCommissionGridPdf, useCommissionGrid } from '@/services/category.service';

/**
 * Grille des commissions vue par le fournisseur (son espace « Mon compte »).
 *
 * Elle est consultable à l'écran et téléchargeable en PDF. Le taux appliqué à
 * une commande est celui du jour où elle a été passée : le détail par article
 * figure sur chaque commande.
 */
export function CommissionGridCard() {
  const { data, isLoading, error } = useCommissionGrid();
  const [ouvert, setOuvert] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const lignes = data?.results ?? [];

  const voirLePdf = async () => {
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
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Percent className="size-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">Grille des commissions</CardTitle>
          <CardDescription>
            Part prélevée par la plateforme sur vos ventes, par catégorie. Le taux
            appliqué à une commande est figé au moment où le client l’a passée ; votre
            part exacte figure sur chaque article de vos commandes.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1.5" onClick={voirLePdf} disabled={pdfEnCours}>
                {pdfEnCours ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                Voir le PDF
              </Button>
              <Button variant="ghost" className="gap-1.5" onClick={() => setOuvert(!ouvert)}>
                {ouvert ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                {ouvert ? 'Masquer les taux' : `Voir les taux (${lignes.length})`}
              </Button>
            </div>

            {ouvert && (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>
                          {ligne.parent_name && (
                            <span className="text-muted-foreground">{ligne.parent_name} › </span>
                          )}
                          {ligne.name}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {Number(ligne.effective_rate)} %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
