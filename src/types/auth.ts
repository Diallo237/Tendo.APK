/** Espace de connexion : une page de login par espace. */
export type LoginSpace = 'client' | 'fournisseur' | 'admin' | 'gerant_depot';

/** Rôles possibles d'un compte (un compte peut cumuler client + fournisseur). */
export type UserRole = 'client' | 'fournisseur' | 'gerant_depot' | 'admin';

// Interface pour les credentials de connexion
export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
  /** Espace visé — le backend refuse la connexion si le compte n'y a pas accès. */
  readonly space?: LoginSpace;
}

/**
 * Réponse 403 du backend quand le compte n'a pas accès à l'espace demandé.
 *
 * Volontairement muette sur les rôles du compte et sur son espace d'accueil :
 * les annoncer reviendrait à indiquer la bonne porte à qui vient d'essayer un
 * mot de passe sur la mauvaise.
 */
export interface RoleNotAllowedError {
  readonly code: 'role_not_allowed';
  readonly detail: string;
  readonly space: LoginSpace;
  readonly supplier_request_pending: boolean;
}

// Interface pour les données d'authentification
export interface AuthToken {
  readonly refresh: string;
  readonly access: string;
  /** Rôle avec lequel l'utilisateur entre (dépend de la page de connexion). */
  readonly active_role?: UserRole;
  readonly roles?: UserRole[];
  readonly redirect_to?: string;
}

// Interface pour les donnees d'identification Oauth2
export interface Provider {
  readonly provider: 'google' | 'github';
}