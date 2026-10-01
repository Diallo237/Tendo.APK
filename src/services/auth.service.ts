import { useUser } from "@/contexts/user-context";
import { useAxiosGet, useAxiosPost } from "@/hooks/use-api";
import type { ApiResponse, AuthCredentials, AuthToken, Provider } from "@/types";
import type { LoginSpace, UserRole } from "@/types/auth";
import { loginPathForRole } from "@/helpers/login-paths";
import type { Users, UserCreate } from "@/types/user";
import apiClient, { buildApiUrl } from "@/utils/api-client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";



export const USERS_KEYS = { 
  'all' : ['users'] as const,
  'current' : () => [...USERS_KEYS.all, 'current'] as const,
  'detail' : (id: number) => [...USERS_KEYS.all, 'detail', id] as const,
};


  export class AuthService {
  
    static getAuthToken(): string | null {
        try {
        const tokenData = localStorage.getItem('authToken');
        if (!tokenData) return null;
        
        // const parsed: AuthToken = JSON.parse(tokenData);
        
        return tokenData;
        } catch {
            AuthService.removeAuthToken();
            return null;
        }
    }

    static setAuthToken(token: AuthToken, type?: "access"): void {
        if (type === 'access') {
            localStorage.setItem("authToken", token.access);
            return;
        }

        localStorage.setItem("authToken", token.access);
        localStorage.setItem("refreshToken", token.refresh);
    }

    static removeAuthToken(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('activeRole');
    }

    static isAuthenticated(): boolean {
        return !!this.getAuthToken();
    }

    /** Rôle avec lequel l'utilisateur est entré (dépend de la page de connexion). */
    static getActiveRole(): string | null {
        return localStorage.getItem('activeRole');
    }

    static setActiveRole(role?: string | null): void {
        if (role) localStorage.setItem('activeRole', role);
        else localStorage.removeItem('activeRole');
    }

    /**
     * Le compte possède-t-il ce rôle ?
     * Un compte peut cumuler « client » et « fournisseur » : on regarde `roles`,
     * en retombant sur `role` pour les comptes plus anciens.
     */
    static hasRole(user: { role?: string; roles?: string[] } | null | undefined, role: string): boolean {
        if (!user) return false;
        if (user.roles?.length) return user.roles.includes(role);
        return user.role === role;
    }

    /**
     * Rôle à utiliser pour la redirection : celui de la page de connexion
     * utilisée s'il est toujours valable, sinon le rôle principal du compte.
     */
    static primaryRole(user: { role?: string; roles?: string[] } | null | undefined): string {
        const active = AuthService.getActiveRole();
        if (active && AuthService.hasRole(user, active)) return active;
        return user?.role ?? user?.roles?.[0] ?? '';
    }

    static handleUnauthorized(): void {
        // Le rôle doit être lu AVANT de vider le stockage : c'est lui qui
        // détermine la page de connexion vers laquelle renvoyer l'utilisateur.
        const destination = loginPathForRole(AuthService.getActiveRole());
        AuthService.removeAuthToken();
        window.location.href = destination;
    }
    
}

/** Hook personnalisé pour la connexion utilisateur */
export function useLogin() {
  const url = buildApiUrl('/auth/jwt/create/');
  const queryClient = useQueryClient();

  return useAxiosPost<ApiResponse<AuthToken>, AuthCredentials>(
    url,
    undefined,
    {
      onSuccess: async (data: AuthToken) => {
        queryClient.clear(); // Purge le cache de l'utilisateur précédent
        AuthService.setAuthToken(data);
        AuthService.setActiveRole(data.active_role);
        // Rattache l'historique de consultation anonyme au compte connecté
        const { mergeAnonymousHistory } = await import('@/services/product.service');
        void mergeAnonymousHistory();
      },
      onError: (error: unknown) => {
        console.error('Erreur de connexion :', error);
      },
    }
  );
}

/**
 * Connexion sur un espace donné (client, fournisseur ou administration).
 *
 * Le backend vérifie d'abord le mot de passe, puis que le compte possède bien
 * un rôle donnant accès à cet espace : sinon il répond 403 `role_not_allowed`
 * SANS délivrer de token (la page affiche le message puis redirige).
 */
export async function loginToSpace(
  credentials: AuthCredentials,
  space: LoginSpace,
): Promise<AuthToken> {
  const url = buildApiUrl('/auth/jwt/create/');
  const response = await apiClient.post<AuthToken>(url, { ...credentials, space });
  // L'endpoint JWT renvoie l'objet directement, sans enveloppe { data }.
  const data = response.data as unknown as AuthToken;

  AuthService.setAuthToken(data);
  AuthService.setActiveRole(data.active_role);

  const { mergeAnonymousHistory } = await import('@/services/product.service');
  void mergeAnonymousHistory();

  return data;
}

/** Route d'accueil correspondant à un rôle. */
export function roleHomePath(role?: string | null): string {
  switch (role as UserRole) {
    case 'admin': return '/admin';
    case 'fournisseur': return '/supplier';
    case 'gerant_depot': return '/depot-manager';
    case 'client': return '/customer';
    default: return '/';
  }
}

export function useSignUp () {
  const url = buildApiUrl('/auth/users/')

  return useAxiosPost<ApiResponse<Users>, UserCreate>(
    url,
    undefined,
    {
      OnSucces: async (data: Users) => {
        // Optionnel: actions après inscription, comme une redirection ou un message
        console.log('Inscription réussie:', data);
      },
      onError: (error: any) => {
        console.error('Erreur lors de l\'inscription :', error);
      },
    },
    {
      timeout: 5000, // 5 secondes pour l'inscription (Celery peut être lent)
    }
  )
}

/*
  Login avec l'authentification OAuth (Google, etc.)
*/
export function useOAuthLogin() {
  const url = buildApiUrl('/social-auth/');
  const queryClient = useQueryClient();

  return useAxiosPost<ApiResponse<AuthToken>, Provider>(
    url,
    undefined,
    {
      onSuccess: async (data: AuthToken) => {
        queryClient.clear(); // Purge le cache de l'utilisateur précédent
        AuthService.setAuthToken(data);
        AuthService.setActiveRole(data.active_role);
        // Rattache l'historique de consultation anonyme au compte connecté
        const { mergeAnonymousHistory } = await import('@/services/product.service');
        void mergeAnonymousHistory();
      },
      onError: (error: unknown) => {
        console.error('Erreur de connexion OAuth :', error);
      },
    }
  );
}


/** Hook personnalisé pour obtenir l'utilisateur courant */
export function useGetCurrentUser() {
  const { setUser } = useUser();

  const url = buildApiUrl('/auth/users/me/');

  return useAxiosGet<Users>(
    USERS_KEYS.current(),
    url,
    undefined, // pas de config Axios
    {
      onSuccess: (data: Users) => setUser(data),
      onError: (err: any) => console.error('Erreur utilisateur', err),
    }
  );
}

export async function getCurrentUser(): Promise<Users | null> {
  const url = buildApiUrl('/auth/users/me/');
  try {
    const response = await apiClient.get<ApiResponse<Users>>(url);

    // L'API retourne directement l'utilisateur, pas dans une structure ApiResponse
    const userData = response.data as any;
    
    // Vérifier si les données sont imbriquées ou directes
    if (userData.data) {
      return userData.data as Users;
    } else if (userData.id && userData.email) {
      // Les données sont directes (pas de wrapper)
      return userData as Users;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/** Hook personnalisé pour la déconnexion utilisateur */
/**
 * Déconnexion : ramène l'utilisateur à l'entrée de l'espace qu'il quitte
 * (administration, fournisseur, gérant de dépôt) plutôt qu'à l'accueil.
 * Pour un client, c'est la boutique et sa modale de connexion.
 */
export function useLogout() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    // Lu avant le nettoyage : removeAuthToken efface aussi le rôle actif
    const destination = loginPathForRole(AuthService.primaryRole(user));

    // On quitte l'espace protégé d'abord : sinon le garde d'accès, voyant la
    // session vidée, redirigerait vers l'accueil avant notre destination.
    navigate(destination, { replace: true });

    AuthService.removeAuthToken();
    setUser(null);
    queryClient.clear(); // Vide tout le cache React Query (données de l'ancien utilisateur)
  };
}
