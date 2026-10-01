import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Check, Info, Loader2, X } from 'lucide-react';

import PageContainer from '@/components/shared/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BaseModal } from '@/components/shared/base-modal';
import { useModal } from '@/components/shared/modal-provider';
import {
  useAdminSupplierRequests,
  useApproveSupplierRequest,
  useRejectSupplierRequest,
} from '@/services/supplier-request.service';
import type { SupplierRequest, SupplierRequestStatus } from '@/types/user';

const REJECT_MODAL_ID = 'reject-supplier-request';
const ALREADY_REVIEWED_MODAL_ID = 'supplier-request-already-reviewed';

const STATUS_VARIANTS: Record<SupplierRequestStatus, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Corps d'un 409 : la demande a déjà été tranchée par un autre administrateur. */
interface AlreadyReviewedPayload {
  code: 'already_reviewed';
  detail: string;
  reviewed_by_name: string;
}

export default function AdminSupplierRequests() {
  const [statusFilter, setStatusFilter] = useState<SupplierRequestStatus | 'all'>('pending');
  const [rejectTarget, setRejectTarget] = useState<SupplierRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState<string>('');
  const [actingId, setActingId] = useState<number | null>(null);

  const { openModal, closeModal } = useModal();
  const { data, isLoading, error, refetch } = useAdminSupplierRequests(
    statusFilter === 'all' ? undefined : statusFilter,
  );
  const { mutateAsync: approveRequest } = useApproveSupplierRequest();
  const { mutateAsync: rejectRequest } = useRejectSupplierRequest();

  const requests = data?.results ?? [];

  /**
   * Deux administrateurs reçoivent le même email : si l'un a déjà tranché,
   * le backend répond 409 en nommant l'auteur de la décision.
   */
  const handleConflict = (requestError: unknown): boolean => {
    const details = (requestError as { details?: AlreadyReviewedPayload })?.details;
    if (details?.code !== 'already_reviewed') return false;

    setAlreadyReviewed(details.detail);
    openModal(ALREADY_REVIEWED_MODAL_ID);
    void refetch();
    return true;
  };

  const handleApprove = async (request: SupplierRequest) => {
    setActingId(request.id);
    try {
      const result = await approveRequest({ id: request.id });
      toast.success(result.message);
    } catch (requestError: unknown) {
      if (!handleConflict(requestError)) {
        toast.error("L'approbation a échoué");
      }
    } finally {
      setActingId(null);
    }
  };

  const openRejectModal = (request: SupplierRequest) => {
    setRejectTarget(request);
    setRejectReason('');
    setRejectError('');
    openModal(REJECT_MODAL_ID);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Merci d’indiquer le motif du refus.');
      return;
    }

    setActingId(rejectTarget.id);
    try {
      await rejectRequest({ id: rejectTarget.id, decision_reason: rejectReason.trim() });
      closeModal(REJECT_MODAL_ID);
      setRejectTarget(null);
      toast.success('Demande refusée');
    } catch (requestError: unknown) {
      closeModal(REJECT_MODAL_ID);
      if (!handleConflict(requestError)) {
        toast.error('Le refus a échoué');
      }
    } finally {
      setActingId(null);
    }
  };

  return (
    <PageContainer
      title="Demandes fournisseur"
      subtitle="Approuvez ou refusez les clients qui souhaitent vendre sur la plateforme"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SupplierRequestStatus | 'all')}
        >
          {/* Les onglets passent à la ligne sur petit écran plutôt que de
              déborder : `flex-none` neutralise le `flex-1` des déclencheurs,
              qui sinon les tasse tous sur une seule ligne. */}
          <TabsList className="h-auto flex-wrap justify-start gap-1 [&>*]:flex-none">
            <TabsTrigger value="pending">
              En attente
              {typeof data?.pending_count === 'number' && data.pending_count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {data.pending_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approuvées</TabsTrigger>
            <TabsTrigger value="rejected">Refusées</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <p className="py-8 text-center text-sm text-destructive">Erreur : {error.message}</p>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-14 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune demande {statusFilter === 'pending' ? 'en attente' : 'à afficher'}.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demandeur</TableHead>
                <TableHead>Nom commercial</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>NINEA</TableHead>
                <TableHead>Reçue le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium">{request.user_full_name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{request.user_email}</div>
                  </TableCell>
                  <TableCell>{request.company_name || '—'}</TableCell>
                  <TableCell>{request.phone || request.user_phone || '—'}</TableCell>
                  <TableCell>{request.ninea || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(request.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[request.status]}>{request.status_display}</Badge>
                    {request.status !== 'pending' && request.reviewed_by_name && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        par {request.reviewed_by_name}
                        <br />
                        {formatDate(request.reviewed_at)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={actingId === request.id}
                          onClick={() => handleApprove(request)}
                        >
                          {actingId === request.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={actingId === request.id}
                          onClick={() => openRejectModal(request)}
                        >
                          <X className="size-4" />
                          Refuser
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {request.decision_reason || 'Traitée'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Refus : motif obligatoire, transmis au demandeur par email */}
      <BaseModal
        modalId={REJECT_MODAL_ID}
        title="Refuser la demande"
        description={
          rejectTarget
            ? `Demande de ${rejectTarget.user_full_name || rejectTarget.user_email}`
            : undefined
        }
        showFooter={false}
      >
        <div className="space-y-4">
          {rejectError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{rejectError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motif du refus *</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Expliquez au demandeur ce qui manque à son dossier."
            />
            <p className="text-xs text-muted-foreground">
              Ce motif sera envoyé au demandeur par email.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => closeModal(REJECT_MODAL_ID)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actingId !== null}>
              Confirmer le refus
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Course entre deux administrateurs : la demande a déjà été tranchée */}
      <BaseModal
        modalId={ALREADY_REVIEWED_MODAL_ID}
        title="Demande déjà traitée"
        showFooter={false}
      >
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Aucune action nécessaire</AlertTitle>
            <AlertDescription>{alreadyReviewed}</AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={() => closeModal(ALREADY_REVIEWED_MODAL_ID)}>J'ai compris</Button>
          </div>
        </div>
      </BaseModal>
    </PageContainer>
  );
}
