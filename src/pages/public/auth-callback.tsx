import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuthService, getCurrentUser } from '@/services/auth.service';
import { useUser } from '@/contexts/user-context';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useRoleRedirect } from '@/helpers/Role-based-redirect';
import apiClient, { buildApiUrl } from '@/utils/api-client';
import { consommerEspaceOAuth } from '@/helpers/google-login';
import { loginPathForRole } from '@/helpers/login-paths';
import type { RoleNotAllowedError } from '@/types/auth';

/**
 * Page de callback OAuth
 * Cette page reçoit les tokens JWT après l'authentification Google
 * 
 * DEV: /auth/callback?access=xxx&refresh=yyy
 * PROD: /auth/callback (tokens en cookies HttpOnly)
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const queryClient = useQueryClient();
  const hasProcessed = useRef(false); // Empêcher le double appel

  const roleRedirect = useRoleRedirect();

  useEffect(() => {
    // Si déjà traité, ne rien faire
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // Erreur OAuth explicite
      const error = searchParams.get('error');
      if (error) {
        toast.error('Erreur de connexion', {
          description: 'Authentification Google échouée. Veuillez réessayer.',
        });
        navigate('/shop');
        return;
      }

      // Récupérer le token d'échange à usage unique
      const exchangeToken = searchParams.get('token');
      if (!exchangeToken) {
        toast.error('Erreur de connexion', { description: 'Token manquant.' });
        navigate('/shop');
        return;
      }

      // Espace visé si la connexion est partie d'une page interne (fournisseur,
      // gérant) : le serveur vérifie que le compte y a accès.
      const space = consommerEspaceOAuth();

      // Échanger contre les JWT via l'API
      let access: string;
      let refresh: string;
      let activeRole: string | undefined;
      try {
        const res = await apiClient.get(buildApiUrl('/social-auth/exchange/'), {
          params: { token: exchangeToken, ...(space ? { space } : {}) },
        });
        access = (res.data as any).access;
        refresh = (res.data as any).refresh;
        activeRole = (res.data as any).active_role;
      } catch (requestError: unknown) {
        const details = (requestError as { details?: RoleNotAllowedError })?.details;
        if (space && details?.code === 'role_not_allowed') {
          // Aucun token délivré : retour sur la page de connexion de l'espace,
          // qui affiche le refus comme pour un mot de passe.
          navigate(loginPathForRole(space), { replace: true, state: { denied: details } });
          return;
        }
        toast.error('Erreur de connexion', { description: 'Token invalide ou expiré.' });
        navigate('/shop');
        return;
      }

      if (!access || !refresh) {
        toast.error('Erreur de connexion', { description: 'Tokens manquants.' });
        navigate('/shop');
        return;
      }

      try {
        // Purger le cache de l'utilisateur précédent
        queryClient.clear();

        // Sauvegarder les tokens
        AuthService.setAuthToken({ access, refresh });
        // Entré par la page fournisseur : c'est son espace fournisseur qu'il
        // veut, même si son compte est d'abord client.
        if (space) AuthService.setActiveRole(activeRole);

        // Récupérer les informations utilisateur
        const user = await getCurrentUser();
        setUser(user);

        // Afficher un message de succès
        toast.success('Connexion réussie !', {
          description: `Bienvenue ${user?.full_name || ''}`,
        });

        // Rediriger selon le rôle de l'utilisateur
        roleRedirect(AuthService.primaryRole(user) || 'client');

      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        toast.error('Erreur de connexion', {
          description: 'Impossible de récupérer les informations utilisateur',
        });
        navigate('/shop');
      }
    };

    processCallback();
  }, []); // Tableau vide pour exécuter une seule fois

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
