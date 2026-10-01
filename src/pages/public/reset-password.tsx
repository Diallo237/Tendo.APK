import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, XCircle, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import apiClient, { buildApiUrl } from '@/utils/api-client';
import { validatePassword } from '@/utils/validate-data';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function ResetPassword() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Vérifier que uid et token sont présents
    if (!uid || !token) {
      setStatus('error');
      setError('Lien de réinitialisation invalide. Paramètres manquants.');
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Validation du mot de passe
    const passwordValidation = validatePassword(password);
    if (passwordValidation !== true) {
      setValidationError(passwordValidation);
      return;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const url = buildApiUrl('/auth/users/reset_password_confirm/')
      await apiClient.post(url, {
        uid: uid,
        token: token,
        new_password: password,
      });

      setStatus('success');

      // Redirection après 3 secondes
      setTimeout(() => {
        navigate('/shop');
      }, 5000);
    } catch (error: any) {
      setStatus('error');
      const errorMessage =
        error.details?.new_password?.[0] ||
        error.details?.token?.[0] ||
        error.details?.uid?.[0] ||
        error.details?.detail ||
        error.message ||
        'Erreur lors de la réinitialisation. Le lien est peut-être invalide ou expiré.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-8 space-y-6">
          {/* En-tête */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-3">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">
              {status === 'success'
                ? 'Mot de passe réinitialisé !'
                : 'Nouveau mot de passe'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {status === 'success'
                ? 'Vous pouvez maintenant vous connecter'
                : 'Choisissez un nouveau mot de passe sécurisé'}
            </p>
          </div>

          {/* Contenu */}
          <div className="space-y-6">
            {status === 'success' ? (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg text-green-600 dark:text-green-500">
                    Succès ! 🎉
                  </p>
                  <p className="text-muted-foreground">
                    Votre mot de passe a été réinitialisé avec succès.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirection automatique dans 3 secondes...
                  </p>
                </div>
                <Button onClick={() => navigate('/shop')} className="w-full">
                  Aller à la page de connexion
                </Button>
              </div>
            ) : status === 'error' && !uid && !token ? (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg text-red-600 dark:text-red-500">
                    Lien invalide
                  </p>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
                <Button onClick={() => navigate('/shop')} className="w-full">
                  Retour à l'accueil
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Erreur globale */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Erreur de validation */}
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 caractères, une majuscule, une minuscule et un chiffre
                  </p>
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Réinitialisation en cours...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </Button>

                {/* Lien retour */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/shop')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Annuler
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>
              Besoin d'aide ? Contactez notre{' '}
              <a href="mailto:support@tendo.com" className="text-primary hover:underline">
                support client
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
