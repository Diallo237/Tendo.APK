import type { LoginSpace } from '@/types/auth';

/**
 * Espace visé par une connexion Google en cours.
 *
 * Le détour par Google fait perdre l'état de la page : on le garde le temps
 * de l'aller-retour, et la page de callback le transmet au serveur, qui
 * vérifie le rôle comme pour une connexion par mot de passe.
 */
const CLE_ESPACE_OAUTH = 'oauthSpace';

/**
 * Lance la connexion Google (redirection du navigateur, pas d'AJAX).
 *
 * Sans espace : connexion depuis la boutique, le compte entre dans son espace
 * principal. Avec : connexion depuis une page interne (fournisseur, gérant).
 */
export function demarrerConnexionGoogle(space?: LoginSpace): void {
  try {
    if (space) sessionStorage.setItem(CLE_ESPACE_OAUTH, space);
    else sessionStorage.removeItem(CLE_ESPACE_OAUTH);
  } catch {
    // Stockage indisponible : la connexion se fera sans contrôle d'espace
  }
  const backendUrl = `${import.meta.env.VITE_API_URL || '/api'}/social-auth`;
  window.location.href = `${backendUrl}?provider=google`;
}

/** Espace demandé avant le départ vers Google — lu une seule fois. */
export function consommerEspaceOAuth(): LoginSpace | null {
  try {
    const space = sessionStorage.getItem(CLE_ESPACE_OAUTH) as LoginSpace | null;
    sessionStorage.removeItem(CLE_ESPACE_OAUTH);
    return space;
  } catch {
    return null;
  }
}
