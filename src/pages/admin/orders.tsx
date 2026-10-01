import { useState, useEffect } from 'react';
import { useOrderHistory, useArchiveOrder, useUnarchiveOrder, downloadGeneralInvoice } from '@/services/order.service';
import { useChangeDepot, useDepotsForOrder, useSendToDepot } from '@/services/shipping.service';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Store,
  XCircle,
  Bell,
  MapPin,
  User,
  Mail,
  Phone,
  Search,
  Archive,
  Loader2,
  FileText,
  Users,
  RotateCcw,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Order, OrderStatus, Depot } from '@/types/order';
import { OrderSuppliersReadiness } from '@/components/shared/order-suppliers-readiness';

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending:          { label: 'En attente',         icon: <Clock className="size-3.5" />,        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
  confirmed:        { label: 'Confirmée',           icon: <CheckCircle2 className="size-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
  processing:       { label: 'En traitement',       icon: <Package className="size-3.5" />,      color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' },
  shipped:          { label: 'Expédiée',            icon: <Truck className="size-3.5" />,        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' },
  at_depot:         { label: 'Au dépôt',            icon: <Store className="size-3.5" />,        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400' },
  ready_for_pickup: { label: 'À récupérer',         icon: <Bell className="size-3.5" />,         color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400' },
  delivered:        { label: 'Livrée / Récupérée',  icon: <CheckCircle2 className="size-3.5" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
  cancelled:        { label: 'Annulée',             icon: <XCircle className="size-3.5" />,      color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' },
};

const formatPrice = (amount: string | number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(
    typeof amount === 'string' ? parseFloat(amount) : amount
  );

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('fr-SN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// shipping_address est toujours une chaîne texte (TextField côté backend),
// formatée « ville / pays » par OrderService._format_address.
function parseAddrLines(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  return raw.split('\n').map((l) => l.trim()).filter(Boolean);
}

/**
 * Choix du dépôt d'une commande.
 *
 * Deux usages, même liste triée par distance : l'envoi initial (rare depuis que
 * l'expédition part toute seule quand tous les fournisseurs sont prêts) et la
 * correction du dépôt d'une commande déjà expédiée, réservée à l'administrateur.
 */
function SendToDepotDialog({ open, onClose, order, mode = 'send' }: {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  mode?: 'send' | 'change';
}) {
  const correction = mode === 'change';
  const { data: depots = [], isLoading: loadingDepots } = useDepotsForOrder(order?.id ?? null);
  const { mutate: sendToDepot, isPending: envoiEnCours } = useSendToDepot();
  const { mutate: changeDepot, isPending: correctionEnCours } = useChangeDepot(order?.shipment_id ?? 0);
  const isPending = correction ? correctionEnCours : envoiEnCours;
  const [selectedDepotId, setSelectedDepotId] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  // Le dépôt le plus proche = 1er de la liste triée par distance (avant filtrage)
  const nearestId = depots.length > 0 && depots[0].distance_km != null ? depots[0].id : null;
  const query = search.trim().toLowerCase();
  const filteredDepots = query
    ? depots.filter((d: Depot) =>
        d.name.toLowerCase().includes(query) ||
        (d.manager_name?.toLowerCase().includes(query) ?? false) ||
        (d.commune_name?.toLowerCase().includes(query) ?? false) ||
        (d.city?.toLowerCase().includes(query) ?? false),
      )
    : depots;

  const fermerEtReinitialiser = () => {
    onClose();
    setSelectedDepotId('');
    setNotes('');
    setSearch('');
  };

  const handleConfirm = () => {
    if (!order || !selectedDepotId) return;

    if (correction) {
      changeDepot(
        { depot_id: parseInt(selectedDepotId) },
        {
          onSuccess: (data) => {
            toast.success(data.message, { description: 'Le client est prévenu par email.' });
            fermerEtReinitialiser();
          },
          onError: (err: any) => toast.error(err?.details?.error || err?.message || 'Changement impossible'),
        }
      );
      return;
    }

    sendToDepot(
      { order_id: order.id, depot_id: parseInt(selectedDepotId), notes },
      {
        onSuccess: (data) => {
          toast.success('Commande expédiée !', {
            description: `N° de suivi : ${data.tracking_number} → ${data.depot}`,
          });
          fermerEtReinitialiser();
        },
        onError: (err: any) => toast.error(err?.details?.error || err?.message || "Erreur d'envoi"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {correction ? <Store className="size-5 text-primary" /> : <Truck className="size-5 text-primary" />}
            {correction ? 'Changer de dépôt' : 'Envoyer vers un dépôt'}
          </DialogTitle>
          <DialogDescription>
            {correction
              ? <>Commande {order?.order_number} — actuellement dirigée vers <strong>{order?.shipment_depot_name}</strong>. Le client sera prévenu du nouveau point de retrait.</>
              : <>Commande {order?.order_number} — choisissez le dépôt de destination</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loadingDepots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : depots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun dépôt disponible.</p>
          ) : (
            <>
              {(() => {
                const hasDistance = depots.some((d: Depot) => d.distance_km != null);
                return hasDistance ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3 text-primary" />
                    Dépôts triés par distance depuis la commune du client
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                    Localisation client non disponible — distances non calculées.
                  </p>
                );
              })()}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par dépôt, gérant ou localité..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredDepots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun dépôt ne correspond à votre recherche.
                </p>
              ) : (
              <RadioGroup
                value={selectedDepotId}
                onValueChange={setSelectedDepotId}
                className="space-y-2 max-h-[320px] overflow-y-auto pr-1"
              >
                {filteredDepots.map((depot: Depot) => {
                  const hasKm = depot.distance_km != null;
                  const isNearest = depot.id === nearestId;
                  return (
                    <label
                      key={depot.id}
                      htmlFor={`adm-depot-${depot.id}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDepotId === String(depot.id)
                          ? 'border-primary bg-primary/5'
                          : isNearest
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <RadioGroupItem value={String(depot.id)} id={`adm-depot-${depot.id}`} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{depot.name}</p>
                            {isNearest && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                Le plus proche
                              </span>
                            )}
                          </div>
                          {hasKm && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isNearest
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {depot.distance_km} km
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="size-3 shrink-0" />
                          {depot.commune_name
                            ? [depot.commune_name, depot.departement_name, depot.region_name].filter(Boolean).join(', ')
                            : depot.city}
                        </p>
                        {depot.manager_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="size-3 shrink-0" />
                            {depot.manager_name}
                            {depot.manager_phone && <span className="ml-1">· {depot.manager_phone}</span>}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
              )}
            </>
          )}

          {!correction && (
            <div className="space-y-1.5">
              <Label htmlFor="adm-depot-notes">Notes (optionnel)</Label>
              <Textarea
                id="adm-depot-notes"
                placeholder="Instructions pour le dépôt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={!selectedDepotId || isPending}>
            {isPending
              ? <><Loader2 className="size-4 animate-spin mr-2" />{correction ? 'Changement...' : 'Envoi...'}</>
              : correction
                ? <><Store className="size-4 mr-2" />Confirmer le changement</>
                : <><Truck className="size-4 mr-2" />Confirmer l'envoi</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminOrderCard({
  order,
  onArchive,
  onUnarchive,
}: {
  order: Order;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sendDepotOpen, setSendDepotOpen] = useState(false);
  const [changeDepotOpen, setChangeDepotOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const addrLines = parseAddrLines(order.shipping_address);

  const canSendToDepot = (order.status === 'confirmed' || order.status === 'processing') && !order.shipment_depot_name;
  // L'expédition est automatique dès que tous les fournisseurs sont prêts ;
  // l'admin peut encore corriger le dépôt tant que le colis n'y est pas arrivé.
  const canChangeDepot = !!order.shipment_id && order.shipment_status === 'sent_to_depot';
  const allReady = order.suppliers_total_count > 0 && order.suppliers_ready_count === order.suppliers_total_count;

  const handleGeneralInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      await downloadGeneralInvoice(order.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Impossible de générer la facture générale');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <>
      <div className="bg-background rounded-xl border overflow-hidden transition-shadow hover:shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{order.order_number}</span>
              <StatusBadge status={order.status} />
              <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
                {order.payment_timing_display}
              </span>
              {/* Badge readiness visible dans le header */}
              {canSendToDepot && order.suppliers_total_count > 0 && (
                allReady ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" /> Tous prêts
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                    <Users className="size-3" /> {order.suppliers_ready_count}/{order.suppliers_total_count} prêts
                  </span>
                )
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="size-3" /> {order.client_name}</span>
              <span className="flex items-center gap-1"><Mail className="size-3" /> {order.client_email}</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-base">{formatPrice(order.total_amount)}</p>
              <p className="text-xs text-muted-foreground">{order.items_count} article{order.items_count > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {canSendToDepot && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSendDepotOpen(true)}
                  disabled={!allReady}
                  title={!allReady ? "En attente que tous les fournisseurs marquent leurs articles comme prêts" : undefined}
                >
                  <Truck className="size-3.5" />
                  Envoyer
                </Button>
              )}
              {allReady && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleGeneralInvoice}
                  disabled={downloadingInvoice}
                  title="Facture générale Tendo (tous les produits de la commande)"
                >
                  {downloadingInvoice ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                  Facture générale
                </Button>
              )}
              {order.shipment_depot_name && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded px-2 py-1">
                  <Store className="size-3" /> {order.shipment_depot_name}
                </span>
              )}
              {canChangeDepot && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setChangeDepotOpen(true)}
                  title="Corriger le dépôt de retrait — le client en sera informé"
                >
                  <Store className="size-3.5" />
                  Changer de dépôt
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Réduire' : 'Détails'}
              </Button>
              {/* « Supprimer » archive : une commande ne se détruit pas */}
              {order.archived_at ? (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onUnarchive}>
                  <RotateCcw className="size-3.5" />
                  Remettre
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onArchive}
                  title="Archiver : la commande sort des listes, sans rien supprimer"
                >
                  <Archive className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <>
            <Separator />
            <div className="p-4 space-y-4">
              {/* Articles */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                      {item.variant_label && (
                        <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Qté : {item.quantity} × {formatPrice(item.unit_price)}</p>
                      {item.supplier_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Store className="size-3" /> Fournisseur : {item.supplier_name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                      {/* Répartition de la ligne : part de Tendo et part du fournisseur */}
                      {item.commission_amount != null && (
                        <p className="text-xs text-muted-foreground">
                          Tendo {Number(item.commission_rate)} % = {formatPrice(item.commission_amount)}
                          {' · '}fournisseur {formatPrice(item.supplier_amount ?? '0')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ce que la commande rapporte à la plateforme */}
              {order.commission_total != null && (
                <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total payé par le client</span>
                    <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reversé aux fournisseurs</span>
                    <span className="tabular-nums">{formatPrice(order.suppliers_amount_total ?? '0')}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Commission Tendo</span>
                    <span className="tabular-nums">{formatPrice(order.commission_total)}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Qui retient la commande — et relance par email */}
              <OrderSuppliersReadiness
                orderId={order.id}
                statuses={order.supplier_statuses}
                relanceAutorisee={order.status === 'confirmed' || order.status === 'processing'}
              />

              <Separator />

              {/* Infos client + livraison + notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <User className="size-3" /> Client
                  </p>
                  <p className="font-medium">{order.client_name}</p>
                  <p className="text-xs text-muted-foreground">{order.client_email}</p>
                  {order.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3" /> {order.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="size-3" /> Livraison
                  </p>
                  {addrLines.length
                    ? <div className="text-xs leading-relaxed space-y-0.5">{addrLines.map((l, i) => <p key={i}>{l}</p>)}</div>
                    : <p className="text-xs text-muted-foreground">—</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                  <p className="text-xs text-muted-foreground">{order.notes || '—'}</p>
                </div>
              </div>

              {/* Dépôt si expédié */}
              {order.shipment_depot_name && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Dépôt :</span>
                    <span className="font-medium">{order.shipment_depot_name}</span>
                    {order.shipment_depot_location && (
                      <span className="text-xs text-muted-foreground">— {order.shipment_depot_location}</span>
                    )}
                  </div>
                </>
              )}

              {/* Motif du retour (si la commande a été retournée) */}
              {order.shipment_return_reason && (
                <>
                  <Separator />
                  <div className="space-y-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-1">
                      <RotateCcw className="size-3" /> Motif du retour
                      {order.shipment_return_type === 'automatic' && (
                        <span className="ml-1 rounded bg-red-200 dark:bg-red-900 px-1.5 py-0.5 text-[10px] normal-case">Automatique (délai dépassé)</span>
                      )}
                      {order.shipment_return_type === 'manual' && (
                        <span className="ml-1 rounded bg-red-200 dark:bg-red-900 px-1.5 py-0.5 text-[10px] normal-case">Client</span>
                      )}
                    </p>
                    <p className="text-sm">{order.shipment_return_reason}</p>
                    {order.shipment_returned_at && (
                      <p className="text-xs text-muted-foreground">{formatDate(order.shipment_returned_at)}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <SendToDepotDialog
        open={sendDepotOpen}
        onClose={() => setSendDepotOpen(false)}
        order={order}
      />

      <SendToDepotDialog
        open={changeDepotOpen}
        onClose={() => setChangeDepotOpen(false)}
        order={order}
        mode="change"
      />
    </>
  );
}

function OrderSkeleton() {
  return (
    <div className="bg-background rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function PageControls({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); if (page > 1) onPage(page - 1); }}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); onPage(p); }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); if (page < totalPages) onPage(page + 1); }}
            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'at_depot', label: 'Au dépôt' },
  { value: 'ready_for_pickup', label: 'À récupérer' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [archivingOrder, setArchivingOrder] = useState<Order | null>(null);
  // Vue « archives » : les commandes retirées des listes, à remettre en place
  const [showArchived, setShowArchived] = useState(false);
  const { mutate: archiveOrder, isPending: archiving } = useArchiveOrder();
  const { mutate: unarchiveOrder } = useUnarchiveOrder();

  // Debounce : déclenche la recherche 400ms après la dernière frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useOrderHistory(
    statusFilter === 'all' ? undefined : statusFilter,
    search || undefined,
    showArchived,
  );

  const orders = data?.orders ?? [];
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginated = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <PageContainer title="Commandes" subtitle="Toutes les commandes de la plateforme">

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="N° de commande..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="size-4" />
            </button>
          )}
        </div>

        <Button
          variant={showArchived ? 'default' : 'outline'}
          className="gap-2 w-full sm:w-auto"
          onClick={() => { setShowArchived(!showArchived); setPage(1); }}
        >
          <Archive className="size-4" />
          {showArchived ? 'Voir les commandes actives' : 'Archivées'}
        </Button>

        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <OrderSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <XCircle className="size-12 mx-auto text-destructive" />
          <p className="font-medium">Impossible de charger les commandes</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <ShoppingBag className="size-14 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">
            {showArchived ? 'Aucune commande archivée' : 'Aucune commande'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? `Aucun résultat pour « ${search} »`
              : showArchived
                ? 'Les commandes que vous archivez apparaîtront ici.'
                : 'Aucune commande pour ce filtre.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
            {totalPages > 1 && ` · page ${page}/${totalPages}`}
          </p>
          <div className="space-y-3">
            {paginated.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                onArchive={() => setArchivingOrder(order)}
                onUnarchive={() => unarchiveOrder(order.id, {
                  onSuccess: ({ message }) => toast.success(message),
                  onError: () => toast.error('La commande n’a pas pu être remise en place'),
                })}
              />
            ))}
          </div>
          <PageControls page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <AlertDialog open={!!archivingOrder} onOpenChange={() => setArchivingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La commande <strong>{archivingOrder?.order_number}</strong> sortira des listes,
              ici comme chez le client et le fournisseur. Rien n'est supprimé et le stock
              reste inchangé : vous pourrez la remettre en place à tout moment depuis
              « Archivées ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiving}
              onClick={() => {
                if (!archivingOrder) return;
                archiveOrder(archivingOrder.id, {
                  onSuccess: ({ message }) => { toast.success(message); setArchivingOrder(null); },
                  onError: () => toast.error("L'archivage a échoué"),
                });
              }}
            >
              {archiving ? 'Archivage...' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
