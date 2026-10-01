import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/shared/google-icon';
import { useModal } from '@/components/shared/modal-provider';
import { useUser } from '@/contexts/user-context';
import { demarrerConnexionGoogle } from '@/helpers/google-login';
import { AuthService, getCurrentUser, loginToSpace, roleHomePath } from '@/services/auth.service';
import type { LoginSpace, RoleNotAllowedError } from '@/types/auth';

interface LoginFormProps {
  /** Espace visé par cette page de connexion (fournisseur, gérant, admin). */
  space: LoginSpace;
}

/**
 * Espaces où la connexion Google est proposée : un client inscrit avec Google
 * n'a pas de mot de passe, et c'est parmi les clients que se recrutent
 * fournisseurs et gérants. Les administrateurs restent au mot de passe.
 */
const ESPACES_AVEC_GOOGLE: LoginSpace[] = ['fournisseur', 'gerant_depot'];

/**
 * Formulaire des pages de connexion internes.
 *
 * Les clients ne passent pas par ici : ils se connectent depuis la boutique via
 * la modale d'authentification (Google et inscription y sont disponibles).
 */
export function LoginForm({ space }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const { openModal } = useModal();

  const etat = location.state as { email?: string; denied?: RoleNotAllowedError } | null;
  // Email pré-rempli quand on arrive depuis une autre page de connexion
  const prefilledEmail = etat?.email ?? '';

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Refus renvoyé par la page de callback après une connexion Google
  const [denied, setDenied] = useState<RoleNotAllowedError | null>(etat?.denied ?? null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setDenied(null);
    setIsLoading(true);

    try {
      await loginToSpace({ email, password }, space);

      const user = await getCurrentUser();
      setUser(user);

      toast.success('Connexion réussie !', {
        description: `Bienvenue ${user?.full_name || ''}`,
      });

      navigate(roleHomePath(AuthService.getActiveRole()), { replace: true });
    } catch (requestError: unknown) {
      const details = (requestError as { details?: RoleNotAllowedError })?.details;

      if (details?.code === 'role_not_allowed') {
        // Accès refusé pour cet espace : aucun token n'a été délivré. On ne dit
        // pas où ce compte a des droits, et on ne l'y emmène pas : ce serait
        // désigner l'espace à attaquer à qui vient d'essayer un mot de passe.
        setDenied(details);
      } else {
        const message =
          details?.detail ||
          (requestError as { message?: string })?.message ||
          'Une erreur est survenue lors de la connexion';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (denied) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>{denied.detail}</AlertDescription>
        </Alert>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setDenied(null);
            setPassword('');
            // Sinon le refus revient au prochain rendu de la page
            navigate(location.pathname, { replace: true, state: null });
          }}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              className="pl-10"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Mot de passe</Label>
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-sm"
              onClick={() => openModal('forgot-password')}
            >
              Mot de passe oublié ?
            </Button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10 pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      {ESPACES_AVEC_GOOGLE.includes(space) && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => demarrerConnexionGoogle(space)}
          >
            <GoogleIcon />
            Continuer avec Google
          </Button>
        </>
      )}
    </div>
  );
}
