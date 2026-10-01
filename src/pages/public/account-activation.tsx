import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import apiClient from '@/utils/api-client';
import { usePlatformSettings } from '@/services/user.service';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function AccountActivation() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const { data: platform } = usePlatformSettings();
  const siteName = platform?.name ?? 'Tendo';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      if (!uid || !token) {
        setStatus('error');
        setMessage('Lien d\'activation invalide. Paramètres manquants.');
        return;
      }

      try {
        await apiClient.post('/auth/users/activation/', {
          uid: uid,
          token: token,
        });

        setStatus('success');
        setMessage('Votre compte a été activé avec succès !');

        // Redirection vers la page de connexion après 5 secondes
        setTimeout(() => {
          navigate('/shop');
        }, 5000);
      } catch (error: any) {
        setStatus('error');
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.token?.[0] ||
          error.response?.data?.uid?.[0] ||
          'Erreur lors de l\'activation. Le lien est peut-être invalide ou expiré.';
        setMessage(errorMessage);
      }
    };

    activateAccount();
  }, [uid, token, navigate]);

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
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Activation de compte</h1>
            <p className="text-muted-foreground text-sm">
              {siteName} E-commerce
            </p>
          </div>

          {/* Contenu selon le statut */}
          <div className="space-y-6">
            {status === 'loading' && (
              <div className="text-center space-y-4 py-8">
                <Spinner className="w-12 h-12 mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="font-medium">Activation en cours...</p>
                  <p className="text-sm text-muted-foreground">
                    Veuillez patienter pendant que nous activons votre compte.
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
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
                  <p className="text-muted-foreground">{message}</p>
                  <p className="text-sm text-muted-foreground">
                    Redirection automatique dans 3 secondes...
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg text-red-600 dark:text-red-500">
                    Échec de l'activation
                  </p>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {status !== 'loading' && (
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/shop')}
                  className="w-full"
                  variant={status === 'success' ? 'default' : 'outline'}
                >
                  {status === 'success' ? 'Aller à la page de connexion' : 'Retour à l\'accueil'}
                </Button>

                {status === 'error' && (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                    variant="secondary"
                  >
                    Réessayer
                  </Button>
                )}
              </div>
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
