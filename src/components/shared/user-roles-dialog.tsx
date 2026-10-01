import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
import { useAdminUpdateUserRoles } from '@/services/user.service';
import type { AdminUser } from '@/types/user';

/** Rôles qu'un administrateur peut attribuer. `admin` ne s'accorde pas ici. */
const ROLES = [
  {
    valeur: 'client',
    libelle: 'Client',
    detail: 'Achète sur la boutique et suit ses commandes.',
  },
  {
    valeur: 'fournisseur',
    libelle: 'Fournisseur',
    detail: 'Gère son catalogue et prépare les commandes.',
  },
  {
    valeur: 'gerant_depot',
    libelle: 'Gérant de dépôt',
    detail: 'Réceptionne les colis et les remet aux clients.',
  },
] as const;

/** Ces rôles donnent l'accès boutique sans démarche : le serveur l'ajoute seul. */
const ROLES_DONNANT_ACCES_CLIENT = ['fournisseur', 'gerant_depot'];

interface UserRolesDialogProps {
  user: AdminUser | null;
  onClose: () => void;
}

/**
 * Attribution des rôles d'un compte.
 *
 * Un même compte peut en cumuler plusieurs : il se connecte alors avec les
 * mêmes identifiants sur chacune des pages concernées, et reste refusé sur les
 * autres. Le serveur refuse de retirer un rôle qui laisserait quelque chose en
 * plan — des produits au catalogue, un dépôt sans gérant.
 */
export function UserRolesDialog({ user, onClose }: UserRolesDialogProps) {
  const { mutate: enregistrer, isPending } = useAdminUpdateUserRoles();
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    setSelection(user?.roles ?? []);
  }, [user]);

  if (!user) return null;

  // Un fournisseur ou un gérant achète aussi sur la boutique : l'accès client
  // lui est acquis, il n'y a pas à le lui retirer.
  const clientImplicite = selection.some((r) => ROLES_DONNANT_ACCES_CLIENT.includes(r));

  const basculer = (role: string) => {
    if (role === 'client' && clientImplicite) return;
    setSelection((precedent) =>
      precedent.includes(role)
        ? precedent.filter((r) => r !== role)
        : [...precedent, role]
    );
  };

  const initiaux = [...(user.roles ?? [])].sort().join(',');
  const inchange = [...selection].sort().join(',') === initiaux;

  const valider = () => {
    enregistrer(
      { id: user.id, roles: selection },
      {
        onSuccess: () => {
          toast.success(`Rôles de ${user.full_name} mis à jour`);
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.details?.error || err?.message || 'Modification impossible');
        },
      }
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={(ouvert) => !ouvert && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rôles de {user.full_name}</DialogTitle>
          <DialogDescription>
            Le compte se connectera avec les mêmes identifiants sur la page de chaque rôle coché,
            et sera refusé sur les autres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {ROLES.map((role) => (
            <div
              key={role.valeur}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <Label htmlFor={`role-${role.valeur}`}>{role.libelle}</Label>
                <p className="text-sm text-muted-foreground">
                  {role.valeur === 'client' && clientImplicite
                    ? "Acquis : un fournisseur ou un gérant achète aussi sur la boutique."
                    : role.detail}
                </p>
              </div>
              <Switch
                id={`role-${role.valeur}`}
                checked={selection.includes(role.valeur) || (role.valeur === 'client' && clientImplicite)}
                onCheckedChange={() => basculer(role.valeur)}
                disabled={isPending || (role.valeur === 'client' && clientImplicite)}
              />
            </div>
          ))}
        </div>

        {selection.length === 0 && (
          <p className="text-sm text-destructive">Un compte doit garder au moins un rôle.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={valider} disabled={isPending || inchange || selection.length === 0}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
