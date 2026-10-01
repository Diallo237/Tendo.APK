/**
 * Page de connexion correspondant à l'espace d'un rôle.
 *
 * Les clients n'ont pas de page dédiée : ils se connectent depuis la boutique
 * via la modale d'authentification (`?login=1` l'ouvre au chargement).
 */
export const CLIENT_LOGIN_PATH = '/shop?login=1';

export function loginPathForRole(role?: string | null): string {
  switch (role) {
    case 'fournisseur':
      return '/supplier/login';
    case 'admin':
      return '/admin/login';
    case 'gerant_depot':
      return '/depot-manager/login';
    default:
      return CLIENT_LOGIN_PATH;
  }
}

/**
 * Page de connexion correspondant à la zone de l'URL courante.
 *
 * Utilisé quand la session disparaît (déconnexion, jeton expiré, accès direct
 * à une page protégée) : on renvoie vers l'entrée de l'espace concerné plutôt
 * que vers l'accueil, sans avoir besoin de connaître le rôle — qui vient
 * justement d'être effacé.
 */
export function loginPathForLocation(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/supplier')) return '/supplier/login';
  if (pathname.startsWith('/depot-manager')) return '/depot-manager/login';
  return CLIENT_LOGIN_PATH;
}
