import { BellRing, CheckCircle2, Clock, Loader2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useRemindSuppliers } from '@/services/order.service';
import type { OrderSupplierStatus } from '@/types/order';

const formatDateCourte = (valeur: string) =>
  new Intl.DateTimeFormat('fr-SN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(valeur));

/**
 * Préparation d'une commande, fournisseur par fournisseur (espace admin).
 *
 * La commande ne part au dépôt que lorsque TOUS ont marqué leurs articles
 * prêts : l'administrateur doit voir qui la retient, et pouvoir le relancer
 * par email sans quitter la page.
 */
export function OrderSuppliersReadiness({
  orderId,
  statuses,
  relanceAutorisee,
}: {
  orderId: number;
  statuses?: OrderSupplierStatus[] | null;
  /** Faux quand la commande n'attend plus de préparation (déjà expédiée…). */
  relanceAutorisee: boolean;
}) {
  const { mutateAsync: rappeler, isPending, variables } = useRemindSuppliers();

  if (!statuses || statuses.length === 0) return null;

  const enAttente = statuses.filter((s) => !s.is_ready);

  const lancerRappel = async (supplierId?: number) => {
    try {
      const { message } = await rappeler({ orderId, supplierId });
      toast.success(message);
    } catch (erreur: any) {
      toast.error(erreur?.details?.error || erreur?.message || "Le rappel n'a pas pu être envoyé");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Préparation par fournisseur
        </p>
        {relanceAutorisee && enAttente.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isPending}
            onClick={() => lancerRappel()}
          >
            {isPending && !variables?.supplierId
              ? <Loader2 className="size-3.5 animate-spin" />
              : <BellRing className="size-3.5" />}
            Rappeler les {enAttente.length} en attente
          </Button>
        )}
      </div>

      <div className="rounded-lg border divide-y">
        {statuses.map((statut) => (
          <div key={statut.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {statut.supplier_name}
                {statut.supplier_reference && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {statut.supplier_reference}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3">
                <span>{statut.items_count} article{statut.items_count > 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1"><Mail className="size-3" />{statut.supplier_email}</span>
                {statut.supplier_phone && (
                  <span className="flex items-center gap-1"><Phone className="size-3" />{statut.supplier_phone}</span>
                )}
              </p>
              {!statut.is_ready && statut.reminded_at && (
                <p className="text-xs text-muted-foreground">
                  Rappelé {statut.reminder_count} fois — dernier le {formatDateCourte(statut.reminded_at)}
                </p>
              )}
            </div>

            {statut.is_ready ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Prêt{statut.ready_at ? ` — ${formatDateCourte(statut.ready_at)}` : ''}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                  <Clock className="size-3" /> En attente
                </span>
                {relanceAutorisee && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={isPending}
                    onClick={() => lancerRappel(statut.supplier)}
                    title="Envoyer un email de rappel à ce fournisseur"
                  >
                    {isPending && variables?.supplierId === statut.supplier
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <BellRing className="size-3.5" />}
                    Rappeler
                  </Button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
