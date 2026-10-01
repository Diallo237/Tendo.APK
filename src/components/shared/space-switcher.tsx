import { Building2, ShieldCheck, ShoppingBag, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AuthService, roleHomePath } from '@/services/auth.service';
import type { Users } from '@/types/user';

const ESPACES: { role: string; libelle: string; icone: LucideIcon; prefixe: string }[] = [
  { role: 'client', libelle: 'Espace client', icone: ShoppingBag, prefixe: '/customer' },
  { role: 'fournisseur', libelle: 'Espace fournisseur', icone: Store, prefixe: '/supplier' },
  { role: 'gerant_depot', libelle: 'Espace gérant de dépôt', icone: Building2, prefixe: '/depot-manager' },
  { role: 'admin', libelle: 'Administration', icone: ShieldCheck, prefixe: '/admin' },
];

/** Espace de la page affichée ; la boutique compte comme l'espace client. */
function espaceCourant(pathname: string): string {
  return ESPACES.find((e) => e.role !== 'client' && pathname.startsWith(e.prefixe))?.role ?? 'client';
}

/**
 * Entrées « Changer d'espace » du menu du compte.
 *
 * Un compte cumule parfois plusieurs rôles — typiquement un client devenu
 * fournisseur. Déjà connecté, il passe d'un espace à l'autre sans se
 * reconnecter : c'est la même session et le serveur contrôle chaque requête
 * d'après les rôles du compte. Indispensable pour qui s'est inscrit avec
 * Google et n'a donc pas de mot de passe.
 */
export function SpaceSwitcherItems({ user }: { user: Users }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const courant = espaceCourant(pathname);
  const autres = ESPACES.filter((e) => e.role !== courant && AuthService.hasRole(user, e.role));
  if (autres.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
        Changer d'espace
      </DropdownMenuLabel>
      <DropdownMenuGroup>
        {autres.map(({ role, libelle, icone: Icone }) => (
          <DropdownMenuItem
            key={role}
            onClick={() => {
              AuthService.setActiveRole(role);
              navigate(roleHomePath(role));
            }}
          >
            <Icone className="mr-2 size-4" />
            <span>{libelle}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}
