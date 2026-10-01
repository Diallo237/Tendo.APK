import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseModal } from '@/components/shared/base-modal';
import { useModal } from '@/components/shared/modal-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService, getCurrentUser, useLogin, useSignUp } from '@/services/auth.service';
import type { AuthCredentials } from '@/types';
import { useUser } from '@/contexts/user-context';
import { Alert, AlertDescription } from '../ui/alert';
import { useRoleRedirect } from '@/helpers/Role-based-redirect';
import { validatePassword, validatePhoneNumber } from '@/utils/validate-data';
import type { UserCreate } from '@/types/user';
import { usePlatformSettings } from '@/services/user.service';
import { demarrerConnexionGoogle } from '@/helpers/google-login';
import { GoogleIcon } from '@/components/shared/google-icon';



interface AuthModalProps {
  modalId: string;
  onSuccess?: () => void;
  /** Onglet ouvert par défaut (« signup » depuis la page de connexion client). */
  defaultTab?: 'login' | 'signup';
}

export function AuthModal({ modalId, onSuccess, defaultTab = 'login' }: AuthModalProps) {
  const { closeModal, openModal } = useModal();
  const { data: platform } = usePlatformSettings();
  const siteName = platform?.name ?? 'Tendo';
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [signupError, setSignupError] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutateAsync: login } = useLogin();
  const { mutateAsync: signup } = useSignUp();
  // const { refetch: fetchCurrentUser } = useGetCurrentUser();
  const { setUser } = useUser();

  const roleRedirect = useRoleRedirect();

  // La modale vit dans la boutique : aucun espace imposé
  const handleGoogleLogin = () => demarrerConnexionGoogle();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(''); // Réinitialiser l'erreur
    
    const formData = new FormData(e.currentTarget);
    const credentials: AuthCredentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      // La modale vit dans la boutique : elle ouvre l'espace client.
      space: 'client',
    };

    try {
      setIsLoading(true);

      // On effectue la connexion
      await login(credentials);

      // On peut récupérer l'utilisateur actuel
      const user = await getCurrentUser();
      setUser(user);

      // UI et notifications
      closeModal(modalId);
      toast.success('Connexion réussie !', {
        description: `Bienvenue ${user?.full_name || ''}`,
      });

      roleRedirect(AuthService.primaryRole(user));
      onSuccess?.();
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue lors de la connexion';

      if (error?.status !== 500) {
        if (error?.details?.detail) {
          errorMessage = error.details.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }
      }
      // console.log('Erreur de connexion:', error);
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupError(''); // Réinitialiser l'erreur
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if(!validatePhoneNumber(formData.get('phone') as string)) { 
      setSignupError('Le numéro de téléphone invalide. Format +221 XX XXX XX XX');
      setIsLoading(false);
      return;
    }

    // Validation de la complexité du mot de passe
    const passwordValidation = validatePassword(password);
    if (passwordValidation !== true) {
      setSignupError(passwordValidation); // On affiche le message d'erreur
      setIsLoading(false);
      return;
    }
    
    // Validation du mot de passe
    if (password !== confirmPassword) {
      setSignupError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }


    const data: UserCreate = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      password,
      role: 'client',
    };
    
  try {
    setIsLoading(true);

    // Appel de la mutation async
    await signup(data);

    // UI après succès
    closeModal(modalId);

    // Ouvrir le modal de confirmation d'email
    openModal('email-confirmation', {
      email: data.email,
    });

    onSuccess?.();
  } catch (error: any) {
    console.error('Erreur d\'inscription:', error);

    // Message d'erreur par défaut
    let errorMessage = 'Une erreur est survenue lors de l\'inscription';

    if (error?.details) {
      const details = error.details;
      const errorMessages: string[] = [];

      // On récupère chaque clé du formulaire (email, password, etc.)
      Object.keys(details).forEach((field) => {
        const fieldErrors = details[field];

        // Si c’est un tableau, chaque élément est un message d’erreur → on l’ajoute à errorMessages.
        // Si c’est une seule chaîne, on l’ajoute directement.
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((msg: string) => errorMessages.push(msg));
        } else if (typeof fieldErrors === 'string') {
          errorMessages.push(fieldErrors);
        }
      });

      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join('\n');
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setSignupError(errorMessage);
  } finally {
    setIsLoading(false);
  }
  };

  return (
    <BaseModal
      modalId={modalId}
      title={`Bienvenue sur ${siteName}`}
      description="Connectez-vous ou créez un compte pour continuer"
      showFooter={false}
      size="lg"
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="signup">Inscription</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-4">
          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
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
                  onClick={() => {
                    closeModal(modalId);
                    openModal('forgot-password');
                  }}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showLoginPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continuer avec
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon />
            Continuer avec Google
          </Button>

          {/* Les fournisseurs ont leur propre page de connexion */}
          <p className="text-center text-sm text-muted-foreground">
            Vous êtes fournisseur ?{' '}
            <Link
              to="/supplier/login"
              onClick={() => closeModal(modalId)}
              className="font-medium text-primary hover:underline"
            >
              Connexion fournisseur
            </Link>
          </p>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          {signupError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">
                {signupError}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="first_name"
                    type="text"
                    placeholder="Prénom"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    name="last_name"
                    type="text"
                    placeholder="Nom"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+221 XX XXX XX XX"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Votre adresse"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  name="password"
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  // onChange={}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSignupPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre. Évitez d'utiliser votre nom ou prénom.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>



            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Création...' : 'Créer un compte'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continuer avec
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon />
            S'inscrire avec Google
          </Button>
        </TabsContent>
      </Tabs>
    </BaseModal>
  );
}
