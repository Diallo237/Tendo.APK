import { BaseModal } from '@/components/shared/base-modal';
import { useModal } from '@/components/shared/modal-provider';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';

interface EmailConfirmationModalProps {
  modalId: string;
  email: string;
}

export function EmailConfirmationModal({ modalId, email }: EmailConfirmationModalProps) {
  const { closeModal } = useModal();

  return (
    <BaseModal
      modalId={modalId}
      title="Vérifiez votre email"
      showFooter={false}
      size="md"
    >
      <div className="space-y-6 py-4">
        {/* Icône de succès */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6">
              <Mail className="w-12 h-12 text-green-600 dark:text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 bg-green-600 dark:bg-green-500 rounded-full p-1">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Message principal */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">
            Inscription réussie ! 🎉
          </h3>
          <p className="text-muted-foreground">
            Un email de confirmation a été envoyé à :
          </p>
          <p className="font-medium text-primary">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">
            Prochaines étapes :
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Ouvrez votre boîte de réception</li>
            <li>Cliquez sur le lien d'activation dans l'email</li>
            <li>Connectez-vous avec vos identifiants</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">
            Si vous ne voyez pas l'email, vérifiez vos spams/courriers indésirables.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => closeModal(modalId)}
            className="w-full"
          >
            J'ai compris
          </Button>
          {/* <Button
            variant="outline"
            onClick={() => {
              window.open(`https://mail.google.com`, '_blank');
            }}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            Ouvrir Gmail
          </Button> */}
        </div>
      </div>
    </BaseModal>
  );
}
