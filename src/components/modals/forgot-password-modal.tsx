import { useState } from 'react';
import { BaseModal } from '@/components/shared/base-modal';
import { useModal } from '@/components/shared/modal-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { buildApiUrl } from '@/utils/api-client';

interface ForgotPasswordModalProps {
  modalId: string;
}

export function ForgotPasswordModal({ modalId }: ForgotPasswordModalProps) {
  const { closeModal } = useModal();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const url = buildApiUrl('/auth/users/reset_password/');
      await apiClient.post(url, { email });
      
      setSuccess(true);
      toast.success('Email envoyé !', {
        description: 'Vérifiez votre boîte de réception.',
      });
    } catch (error: any) {
      
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      
      // L'API peut retourner l'erreur dans différents formats
      if (error.details) {
        // Format 1: Tableau direct ["Message"]
        if (Array.isArray(error.details)) {
          errorMessage = error.details[0] || errorMessage;
        }
        // Format 2: Objet avec champ email { email: ["Message"] }
        // else if (error.details.email && Array.isArray(error.details.email)) {
        //   errorMessage = error.details.email[0];
        // }
        // // Format 3: Message direct { detail: "Message" }
        // else if (error.details.detail) {
        //   errorMessage = error.details.detail;
        // }
      }
      // Format 4: Message dans error.message
      else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    closeModal(modalId);
  };

  return (
    <BaseModal
      modalId={modalId}
      title={success ? 'Email envoyé !' : 'Mot de passe oublié'}
      description={
        success
          ? 'Consultez vos emails pour réinitialiser votre mot de passe'
          : 'Entrez votre adresse email pour recevoir un lien de réinitialisation'
      }
      showFooter={false}
      size="md"
    >
      {success ? (
        <div className="space-y-6 py-4">
          {/* Icône de succès */}
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6">
              <Mail className="w-12 h-12 text-green-600 dark:text-green-500" />
              {/* <div className="absolute -top-1 -right-1 bg-green-600 dark:bg-green-500 rounded-full p-1">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div> */}
            </div>
          </div>

          {/* Message de succès */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Un email a été envoyé à :
            </p>
            <p className="font-medium text-primary">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Prochaines étapes :</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Ouvrez votre boîte de réception</li>
              <li>Cliquez sur le lien dans l'email</li>
              <li>Créez un nouveau mot de passe</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              Si vous ne voyez pas l'email, vérifiez vos spams.
            </p>
          </div>

          {/* Bouton fermer */}
          <Button onClick={handleClose} className="w-full">
            J'ai compris
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Champ email */}
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Entrez l'email associé à votre compte
            </p>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
