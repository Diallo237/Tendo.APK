import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, Store } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BaseModal } from '@/components/shared/base-modal';
import { useModal } from '@/components/shared/modal-provider';
import { useUser } from '@/contexts/user-context';
import { AuthService } from '@/services/auth.service';
import { useCreateSupplierRequest } from '@/services/supplier-request.service';
import { validatePhoneNumber } from '@/utils/validate-data';
import type { SupplierRequestStatus } from '@/types/user';

const MODAL_ID = 'become-supplier';
const CONFIRMATION_MODAL_ID = 'become-supplier-sent';

/**
 * Bloc « Devenir fournisseur » du profil client.
 *
 * Le compte reste le même : après approbation d'un administrateur, le rôle
 * fournisseur est ajouté et l'utilisateur peut se connecter sur la page
 * fournisseur avec les mêmes identifiants.
 */
export function BecomeSupplierCard() {
  const { user } = useUser();
  const { openModal, closeModal } = useModal();
  const { mutateAsync: createRequest, isPending } = useCreateSupplierRequest();

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [ninea, setNinea] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Déjà fournisseur : rien à demander
  if (AuthService.hasRole(user, 'fournisseur')) {
    return null;
  }

  const requestStatus: SupplierRequestStatus | null = user?.supplier_request?.status ?? null;
  const isPendingRequest = submitted || requestStatus === 'pending';

  const handleSubmit = async () => {
    setError('');

    if (!companyName.trim()) {
      setError('Le nom commercial est requis.');
      return;
    }
    if (!validatePhoneNumber(phone)) {
      setError('Numéro de téléphone sénégalais invalide (ex. 77 123 45 67).');
      return;
    }

    try {
      const result = await createRequest({
        company_name: companyName.trim(),
        phone: phone.trim(),
        ninea: ninea.trim(),
        message: message.trim(),
      });

      setSubmitted(true);
      setConfirmationMessage(result.message);
      closeModal(MODAL_ID);
      // Confirmation explicite : l'utilisateur doit voir que sa demande est partie
      openModal(CONFIRMATION_MODAL_ID);
      toast.success('Demande envoyée');
    } catch (requestError: unknown) {
      const details = (requestError as { details?: Record<string, string[] | string> })?.details;
      const firstError =
        details && typeof details === 'object'
          ? Object.values(details).flat()[0]
          : undefined;
      setError(
        (firstError as string) ||
          (requestError as { message?: string })?.message ||
          "L'envoi de la demande a échoué.",
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Devenir fournisseur</CardTitle>
            <CardDescription>
              Vendez vos produits sur la plateforme sans créer un second compte : vous
              choisirez simplement l'espace au moment de vous connecter.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isPendingRequest && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Demande en attente</AlertTitle>
              <AlertDescription>
                Votre demande a bien été transmise aux administrateurs. Vous recevrez un
                email dès qu'elle sera examinée.
              </AlertDescription>
            </Alert>
          )}

          {!isPendingRequest && requestStatus === 'rejected' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Demande précédente refusée</AlertTitle>
              <AlertDescription>
                {user?.supplier_request?.decision_reason ||
                  "Votre précédente demande n'a pas été retenue."}{' '}
                Vous pouvez en soumettre une nouvelle.
              </AlertDescription>
            </Alert>
          )}

          {!isPendingRequest && requestStatus === 'approved' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Votre accès fournisseur est actif : connectez-vous sur la page fournisseur.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={() => openModal(MODAL_ID)} disabled={isPendingRequest}>
            {isPendingRequest ? 'Demande en cours d’examen' : 'Devenir fournisseur'}
          </Button>
        </CardContent>
      </Card>

      <BaseModal
        modalId={MODAL_ID}
        title="Devenir fournisseur"
        description="Ces informations seront transmises aux administrateurs pour validation."
        showFooter={false}
        size="lg"
      >
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="supplier-company">Nom commercial *</Label>
            <Input
              id="supplier-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Ex. Boutique Teranga"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Téléphone *</Label>
              <Input
                id="supplier-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="77 123 45 67"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-ninea">NINEA (optionnel)</Label>
              <Input
                id="supplier-ninea"
                value={ninea}
                onChange={(event) => setNinea(event.target.value)}
                placeholder="Numéro NINEA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-message">Message (optionnel)</Label>
            <Textarea
              id="supplier-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Décrivez brièvement les produits que vous souhaitez vendre."
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => closeModal(MODAL_ID)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Envoi...' : 'Envoyer ma demande'}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Confirmation d'envoi */}
      <BaseModal
        modalId={CONFIRMATION_MODAL_ID}
        title="Demande envoyée"
        description="Les administrateurs viennent d'être prévenus par email."
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              {confirmationMessage ||
                "Votre demande a bien été envoyée. Un administrateur l'examinera et vous serez notifié par email."}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Une fois votre demande approuvée, connectez-vous sur la page fournisseur avec
            <span className="font-medium text-foreground"> les mêmes identifiants</span>.
          </p>

          <div className="flex justify-end">
            <Button onClick={() => closeModal(CONFIRMATION_MODAL_ID)}>J'ai compris</Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
