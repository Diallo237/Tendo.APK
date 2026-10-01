import { useState } from 'react';
import {
  useDepotShipments,
  useMarkReceived,
  useNotifyClient,
  useMarkDelivered,
  useMarkReturned,
  useMarkReturnShipped,
} from '@/services/shipping.service';
import type { RecipientPayload } from '@/services/shipping.service';
import { downloadGeneralInvoice } from '@/services/order.service';
import { validatePhoneNumber } from '@/utils/validate-data';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dialog';
import {
  Package,
  Truck,
  Store,
  Bell,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  User,
  Loader2,
  Hash,
  RotateCcw,
  CreditCard,
  FileText,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Shipment } from '@/types/order';

type ShipmentStatus = Shipment['status'];

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  preparing:       { label: 'En préparation',  icon: <Package className="size-3.5" />,      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
  sent_to_depot:   { label: 'En transit',       icon: <Truck className="size-3.5" />,        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' },
  at_depot:        { label: 'Au dépôt',         icon: <Store className="size-3.5" />,        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400' },
  client_notified: { label: 'Client notifié',   icon: <Bell className="size-3.5" />,         color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400' },
  delivered:       { label: 'Récupéré',         icon: <CheckCircle2 className="size-3.5" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
  returned:        { label: 'Retourné',         icon: <XCircle className="size-3.5" />,      color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' },
};

const formatPrice = (amount: string | number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(
    typeof amount === 'string' ? parseFloat(amount) : amount
  );

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Intl.DateTimeFormat('fr-SN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
    : '—';

function parseAddrLines(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === 'object') {
    const a = raw as Record<string, string>;
    return [a.phone, a.street, a.city, a.country].filter(Boolean);
  }
  if (typeof raw === 'string') {
    let parsed: Record<string, string> | null = null;
    try { parsed = JSON.parse(raw); } catch { /* plain text */ }
    if (parsed) return [parsed.phone, parsed.street, parsed.city, parsed.country].filter(Boolean);
    return raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
  }
  return [];
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.sent_to_depot;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

const emptyRecipient = (): RecipientPayload => ({
  recipient_first_name: '',
  recipient_last_name: '',
  recipient_id_card: '',
  recipient_phone: '',
});

function DeliveryDialog({ open, onClose, shipmentId }: { open: boolean; onClose: () => void; shipmentId: number }) {
  const [form, setForm] = useState<RecipientPayload>(emptyRecipient);
  const { mutate: markDelivered, isPending } = useMarkDelivered(shipmentId);

  const handleChange = (field: keyof RecipientPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    const phone = (form.recipient_phone ?? '').trim();
    const cni = (form.recipient_id_card ?? '').trim();
    if (!form.recipient_first_name.trim() || !form.recipient_last_name.trim() || !phone) {
      toast.error('Prénom, nom et numéro de téléphone sont obligatoires');
      return;
    }
    if (!validatePhoneNumber(phone)) {
      toast.error('Numéro de téléphone invalide (format +221 7X XXX XX XX)');
      return;
    }
    if (cni && cni.length !== 13) {
      toast.error("Le numéro de carte d'identité doit contenir exactement 13 caractères");
      return;
    }
    markDelivered(form, {
      onSuccess: (d) => { toast.success(d.message); onClose(); setForm(emptyRecipient()); },
      onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Enregistrer la récupération
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Renseignez les informations de la personne qui récupère le colis.</p>
          <div className="space-y-1.5">
            <Label htmlFor="rec-first">Prénom *</Label>
            <Input id="rec-first" placeholder="Prénom" value={form.recipient_first_name} onChange={handleChange('recipient_first_name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-last">Nom *</Label>
            <Input id="rec-last" placeholder="Nom de famille" value={form.recipient_last_name} onChange={handleChange('recipient_last_name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-phone" className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> Téléphone *
            </Label>
            <Input id="rec-phone" placeholder="+221 7X XXX XX XX" value={form.recipient_phone} onChange={handleChange('recipient_phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-id" className="flex items-center gap-1.5">
              <CreditCard className="size-3.5" /> N° Carte d'identité <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input id="rec-id" placeholder="Ex : 1234567890123" maxLength={13} value={form.recipient_id_card} onChange={handleChange('recipient_id_card')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShipmentActions({ shipment, onReturn, onDeliver }: { shipment: Shipment; onReturn: () => void; onDeliver: () => void }) {
  const { mutate: markReceived, isPending: receivingPending } = useMarkReceived(shipment.id);
  const { mutate: notifyClient, isPending: notifyingPending } = useNotifyClient(shipment.id);

  if (shipment.status === 'sent_to_depot') {
    return (
      <Button size="sm" onClick={() => markReceived({} as never, {
        onSuccess: (d) => toast.success(d.message),
        onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
      })} disabled={receivingPending} className="gap-2">
        {receivingPending ? <Loader2 className="size-4 animate-spin" /> : <Store className="size-4" />}
        Marquer reçu au dépôt
      </Button>
    );
  }

  if (shipment.status === 'at_depot') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => notifyClient({} as never, {
          onSuccess: (d) => toast.success(d.message),
          onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
        })} disabled={notifyingPending} className="gap-2">
          {notifyingPending ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
          Notifier le client
        </Button>
        <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10" onClick={onReturn}>
          <RotateCcw className="size-4" />
          Retourner
        </Button>
      </div>
    );
  }

  if (shipment.status === 'client_notified') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={onDeliver} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="size-4" />
          Colis récupéré
        </Button>
        <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive/10" onClick={onReturn}>
          <RotateCcw className="size-4" />
          Retourner
        </Button>
      </div>
    );
  }

  return null;
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const [expanded, setExpanded] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState('');
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const { mutate: markReturned, isPending: returningPending } = useMarkReturned(shipment.id);
  const { mutate: markReturnShipped, isPending: returnShippingPending } = useMarkReturnShipped(shipment.id);
  const addrLines = parseAddrLines(shipment.shipping_address);

  // Colis retourné automatiquement (délai >7j) mais pas encore physiquement
  // renvoyé au fournisseur → badge « à renvoyer » + bouton dédié pour le gérant.
  const pendingReturnShip = shipment.status === 'returned'
    && shipment.return_type === 'automatic'
    && !shipment.return_shipped_at;

  // Retour manuel « client non satisfait » : motif suggéré, éditable par le gérant.
  const SUGGESTED_RETURN_REASON = 'Client non satisfait : différence entre la commande passée et le colis reçu.';
  const openReturn = () => {
    setReturnReason(SUGGESTED_RETURN_REASON);
    setReturnError('');
    setReturnOpen(true);
  };

  const handleReturnShipped = () => {
    markReturnShipped({} as never, {
      onSuccess: (d) => toast.success(d.message),
      onError: (e: any) => toast.error(e?.response?.data?.error || 'Erreur'),
    });
  };

  const handleConfirmReturn = () => {
    if (!returnReason.trim()) {
      setReturnError('Le motif du retour est obligatoire.');
      return;
    }
    markReturned({ reason: returnReason.trim() }, {
      onSuccess: (d) => {
        toast.success(d.message);
        setReturnOpen(false);
        setReturnReason('');
        setReturnError('');
      },
      onError: (e: any) => {
        const msg = e?.response?.data?.error || 'Erreur lors du retour';
        setReturnError(msg);
        toast.error(msg);
      },
    });
  };

  const handleGeneralInvoice = async () => {
    setInvoiceLoading(true);
    try {
      await downloadGeneralInvoice(shipment.order_id);
    } catch (e: any) {
      const data = e?.response?.data;
      // La réponse d'erreur est un blob → on tente de le lire
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          toast.error(JSON.parse(text)?.error || 'Facture indisponible');
        } catch { toast.error('Facture indisponible'); }
      } else {
        toast.error(data?.error || 'Facture indisponible');
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <>
      <div className="bg-background rounded-xl border overflow-hidden transition-shadow hover:shadow-sm">
        {/* Header */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <Hash className="size-3.5 text-muted-foreground" />
                {shipment.tracking_number}
              </span>
              <StatusBadge status={shipment.status} />
              {pendingReturnShip && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                  <AlertTriangle className="size-3.5" /> Délai dépassé — à renvoyer
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Commande {shipment.order_number} · {formatDate(shipment.shipped_at)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <p className="font-bold text-base">{formatPrice(shipment.order_total)}</p>
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Réduire' : 'Détails'}
            </Button>
          </div>
        </div>

        {/* Détails */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 space-y-4">

              {/* Client + Adresse + Dépôt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <User className="size-3" /> Client
                  </p>
                  <p className="font-medium">{shipment.client_name}</p>
                  {shipment.client_phone && (
                    <a
                      href={`tel:${shipment.client_phone}`}
                      className="flex items-center gap-1.5 text-primary text-xs hover:underline"
                    >
                      <Phone className="size-3" /> {shipment.client_phone}
                    </a>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="size-3" /> Adresse de livraison
                  </p>
                  {addrLines.length
                    ? <div className="text-xs leading-relaxed space-y-0.5">{addrLines.map((l, i) => <p key={i}>{l}</p>)}</div>
                    : <p className="text-xs text-muted-foreground">—</p>
                  }
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Store className="size-3" /> Dépôt
                  </p>
                  <p className="text-xs">{shipment.depot_name}</p>
                  {shipment.depot_city && <p className="text-xs text-muted-foreground">{shipment.depot_city}</p>}
                </div>
              </div>

              <Separator />

              {/* Articles */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Articles</p>
                <div className="space-y-2">
                  {shipment.items.map((item) => (
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
                        <p className="text-xs text-muted-foreground">Qté : {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatPrice(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Expédié</p>
                  <p>{formatDate(shipment.shipped_at)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Reçu au dépôt</p>
                  <p>{formatDate(shipment.arrived_at_depot_at)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Client notifié</p>
                  <p>{formatDate(shipment.client_notified_at)}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Récupéré</p>
                  <p>{formatDate(shipment.delivered_at)}</p>
                </div>
              </div>

              {/* Récupérateur (si livré) */}
              {shipment.status === 'delivered' && shipment.recipient_last_name && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <CreditCard className="size-3" /> Récupéré par
                    </p>
                    <p className="text-sm font-medium">{shipment.recipient_first_name} {shipment.recipient_last_name}</p>
                    <p className="text-xs text-muted-foreground">CNI : {shipment.recipient_id_card}</p>
                    {shipment.recipient_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="size-3" /> {shipment.recipient_phone}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Motif du retour (si retourné) */}
              {shipment.status === 'returned' && shipment.return_reason && (
                <>
                  <Separator />
                  <div className="space-y-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-1">
                      <RotateCcw className="size-3" /> Motif du retour
                      {shipment.return_type === 'automatic' && (
                        <span className="ml-1 rounded bg-red-200 dark:bg-red-900 px-1.5 py-0.5 text-[10px] normal-case">Automatique</span>
                      )}
                    </p>
                    <p className="text-sm">{shipment.return_reason}</p>
                    {shipment.returned_at && (
                      <p className="text-xs text-muted-foreground">{formatDate(shipment.returned_at)}</p>
                    )}
                    {shipment.return_shipped_at ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 pt-0.5">
                        <Send className="size-3" /> Renvoyé au fournisseur le {formatDate(shipment.return_shipped_at)}
                      </p>
                    ) : shipment.return_type === 'automatic' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 pt-0.5">
                        <AlertTriangle className="size-3" /> À renvoyer au fournisseur
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleGeneralInvoice}
                  disabled={invoiceLoading}
                >
                  {invoiceLoading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                  Facture
                </Button>
                {pendingReturnShip && (
                  <Button
                    size="sm"
                    onClick={handleReturnShipped}
                    disabled={returnShippingPending}
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {returnShippingPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Marquer envoyé au fournisseur
                  </Button>
                )}
                <ShipmentActions shipment={shipment} onReturn={openReturn} onDeliver={() => setDeliverOpen(true)} />
              </div>

            </div>
          </>
        )}
      </div>

      {/* Dialog livraison */}
      <DeliveryDialog open={deliverOpen} onClose={() => setDeliverOpen(false)} shipmentId={shipment.id} />

      {/* Retour avec motif obligatoire */}
      <Dialog
        open={returnOpen}
        onOpenChange={(o) => { setReturnOpen(o); if (!o) { setReturnReason(''); setReturnError(''); } }}
      >
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5 text-destructive" />
              Retourner ce colis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Le colis <strong>{shipment.tracking_number}</strong> sera marqué comme retourné et la commande annulée.
              Indiquez le <strong>motif</strong> (ex. « Client non satisfait : différence entre la commande et le colis reçu »).
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="return-reason">Motif du retour *</Label>
              <Textarea
                id="return-reason"
                placeholder="Décrivez la raison du retour…"
                rows={3}
                value={returnReason}
                onChange={(e) => { setReturnReason(e.target.value); if (returnError) setReturnError(''); }}
              />
              {returnError && <p className="text-xs text-destructive">{returnError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={returningPending}>Annuler</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              disabled={returningPending}
              onClick={handleConfirmReturn}
            >
              {returningPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Confirmer le retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'sent_to_depot', label: 'En transit' },
  { value: 'at_depot', label: 'Au dépôt' },
  { value: 'client_notified', label: 'Client notifié' },
  { value: 'delivered', label: 'Récupérés' },
  { value: 'returned', label: 'Retournés' },
];

export default function DepotManagerShipments() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading, isError } = useDepotShipments(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const shipments = data?.shipments ?? [];
  const count = data?.count ?? 0;

  return (
    <PageContainer title="Colis" subtitle="Colis en transit vers votre dépôt">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? '...' : `${count} colis`}
        </p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <XCircle className="size-12 mx-auto text-destructive" />
          <p className="font-medium">Impossible de charger les colis</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Store className="size-14 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">Aucun colis</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'all'
              ? "Aucun colis assigné à votre dépôt pour le moment."
              : 'Aucun colis avec ce statut.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
