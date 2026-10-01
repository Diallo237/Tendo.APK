import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Info, Loader2, Upload } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  downloadCategoryTemplate,
  useImportCategories,
  type CategoryImportReport,
} from '@/services/category.service';

/**
 * Import Excel des catégories (administrateur).
 *
 * Le modèle téléchargeable est déjà rempli avec les catégories de référence
 * et leurs commissions. À l'import, une catégorie déjà en base est signalée
 * sans être dupliquée ; l'option « remplacer » met à jour la sienne. Les
 * lignes illisibles sont listées une par une, les autres passent quand même.
 */
export function CategoryImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mutateAsync: importer, isPending } = useImportCategories();
  const champFichier = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [remplacer, setRemplacer] = useState(false);
  const [rapport, setRapport] = useState<CategoryImportReport | null>(null);
  const [modeleEnCours, setModeleEnCours] = useState(false);

  const fermer = () => {
    setFichier(null);
    setRapport(null);
    setRemplacer(false);
    onClose();
  };

  const telechargerModele = async () => {
    setModeleEnCours(true);
    try {
      await downloadCategoryTemplate();
    } catch (erreur: any) {
      toast.error(erreur?.message || 'Le modèle n’a pas pu être téléchargé');
    } finally {
      setModeleEnCours(false);
    }
  };

  const lancerImport = async () => {
    if (!fichier) return;
    setRapport(null);
    try {
      const resultat = await importer({ file: fichier, replace: remplacer });
      setRapport(resultat);
      const total = resultat.created.length + resultat.updated.length;
      if (total > 0) {
        toast.success(`${total} catégorie${total > 1 ? 's' : ''} importée${total > 1 ? 's' : ''}`);
      } else if (resultat.errors.length === 0) {
        toast.info('Aucune nouveauté : toutes les catégories existaient déjà');
      }
    } catch (erreur: any) {
      // Fichier inexploitable : le serveur explique quoi corriger
      toast.error(erreur?.details?.error || erreur?.message || "L'import a échoué");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(ouvert) => !ouvert && fermer()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des catégories</DialogTitle>
          <DialogDescription>
            Un classeur Excel (.xlsx) avec au minimum une colonne « Nom ». Les colonnes
            « Commission Tendo (%) », « Catégorie parente », « Description » et « Active »
            sont facultatives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={telechargerModele}
            disabled={modeleEnCours}
          >
            {modeleEnCours ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Télécharger le modèle prérempli
          </Button>

          <div className="space-y-2">
            <Label htmlFor="fichier-categories">Fichier à importer</Label>
            <input
              id="fichier-categories"
              ref={champFichier}
              type="file"
              accept=".xlsx"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
              onChange={(e) => {
                setFichier(e.target.files?.[0] ?? null);
                setRapport(null);
              }}
            />
          </div>

          <div className="flex items-start gap-2">
            <Switch
              id="remplacer-categories"
              checked={remplacer}
              onCheckedChange={setRemplacer}
            />
            <div className="space-y-0.5">
              <Label htmlFor="remplacer-categories" className="font-normal">
                Remplacer les catégories existantes
              </Label>
              <p className="text-xs text-muted-foreground">
                Sans cette option, une catégorie déjà en base est signalée et laissée
                telle quelle. Avec, sa commission, sa description, sa catégorie parente
                et son activation sont écrasées par le fichier.
              </p>
            </div>
          </div>

          {rapport && (
            <div className="space-y-2">
              {(rapport.created.length > 0 || rapport.updated.length > 0) && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Import effectué</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {rapport.created.length > 0 && (
                      <p>{rapport.created.length} créée(s) : {rapport.created.join(', ')}</p>
                    )}
                    {rapport.updated.length > 0 && (
                      <p>{rapport.updated.length} mise(s) à jour : {rapport.updated.join(', ')}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {rapport.unchanged.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>
                    {rapport.unchanged.length} catégorie(s) déjà existante(s), laissée(s) intacte(s)
                  </AlertTitle>
                  <AlertDescription>
                    {rapport.unchanged.join(', ')}
                    {!remplacer && ' — cochez « Remplacer » pour les mettre à jour.'}
                  </AlertDescription>
                </Alert>
              )}

              {rapport.ignored_columns.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Colonnes non reconnues, ignorées</AlertTitle>
                  <AlertDescription>{rapport.ignored_columns.join(', ')}</AlertDescription>
                </Alert>
              )}

              {rapport.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{rapport.errors.length} ligne(s) non importée(s)</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {rapport.errors.map((erreur, index) => (
                        <li key={`${erreur.ligne}-${index}`}>
                          Ligne {erreur.ligne}
                          {erreur.nom ? ` (${erreur.nom})` : ''} : {erreur.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={fermer} disabled={isPending}>
            {rapport ? 'Fermer' : 'Annuler'}
          </Button>
          <Button onClick={lancerImport} disabled={!fichier || isPending} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Bouton d'ouverture du dialogue, pour la barre d'actions des catégories. */
export function CategoryImportButton() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto"
              onClick={() => setOuvert(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        Importer Excel
      </Button>
      <CategoryImportDialog open={ouvert} onClose={() => setOuvert(false)} />
    </>
  );
}
