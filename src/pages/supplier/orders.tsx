import { useState } from 'react';
import { useSupplierOrders, useMarkSupplierReady, useUnmarkSupplierReady, downloadSupplierInvoice } from '@/services/order.service';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import PageContainer from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Phone,
  Loader2,
  PackageCheck,
  RotateCcw,
  Users,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SupplierOrder, OrderStatus } from '@/types/order';

const PAGE_SIZE = 10;

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
  new Intl.DateTimeFormat('fr-SN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function ReadinessBadge({ readyCount, totalCount }: { readyCount: number; totalCount: number }) {
  if (totalCount === 0) return null;
  const allReady = readyCount === totalCount;
  const someReady = readyCount > 0;

  if (allReady) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Tous prêts — en attente d'expédition
      </span>
    );
  }
  if (someReady) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
        <Users className="size-3.5" />
        {readyCount}/{totalCount} fournisseur{totalCount > 1 ? 's' : ''} prêt{readyCount > 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400">
      <Users className="size-3.5" />
      {totalCount > 1 ? `${totalCount} fournisseurs — en attente` : 'En attente de préparation'}
    </span>
  );
}

function SupplierOrderCard({ order }: { order: SupplierOrder }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { mutate: markReady, isPending: marking } = useMarkSupplierReady();
  const { mutate: unmarkReady, isPending: unmarking } = useUnmarkSupplierReady();

  const isPending = marking || unmarking;
  const canToggleReady = order.status === 'confirmed' || order.status === 'processing';
  const canInvoice = order.status !== 'pending' && order.status !== 'cancelled';

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await downloadSupplierInvoice(order.id, order.order_number);
      toast.success('Facture téléchargée');
    } catch {
      toast.error('Impossible de générer la facture');
    } finally {
      setDownloading(false);
    }
  };
  const isShipped = order.status === 'shipped' || order.status === 'at_depot' ||
                    order.status === 'ready_for_pickup' || order.status === 'delivered';

  const handleMarkReady = () => {
    markReady(order.id, {
      onSuccess: () => toast.success('Articles marqués comme prêts'),
      onError: (err: any) => toast.error(err?.details?.error || err?.message || 'Erreur'),
    });
  };

  const handleUnmarkReady = () => {
    unmarkReady(order.id, {
      onSuccess: () => toast.success('Préparation annulée'),
      onError: (err: any) => toast.error(err?.details?.error || err?.message || 'Erreur'),
    });
  };

  return (
    <div className="bg-background rounded-xl border overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{order.order_number}</span>
            <StatusBadge status={order.status} />
            <Badge variant="outline" className="text-xs">
              {order.payment_timing_display}
            </Badge>
            {order.my_is_ready && canToggleReady && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                <PackageCheck className="size-3" /> Mes articles prêts
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-base">{formatPrice(order.my_subtotal)}</p>
            <p className="text-xs text-muted-foreground">{order.my_items_count} article{order.my_items_count > 1 ? 's' : ''}</p>
          </div>
          {canInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              disabled={downloading}
              title="Générer la facture PDF"
            >
              {downloading
                ? <Loader2 className="size-4 animate-spin" />
                : <FileText className="size-4" />}
            </Button>
          )}
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

            {/* Produits commandés du fournisseur */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Mes produits commandés
              </p>
              <div className="space-y-3">
                {order.my_items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                      {item.variant_label && (
                        <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Qté : {item.quantity} × {formatPrice(item.unit_price)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatPrice(item.supplier_amount)}</p>
                      {/* Ce que la vente rapporte, et ce que la plateforme retient */}
                      <p className="text-xs text-muted-foreground">
                        sur {formatPrice(item.total_price)} — commission {Number(item.commission_rate)} %
                        {' '}({formatPrice(item.commission_amount)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Récapitulatif de ce que touche le fournisseur */}
              <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de mes articles</span>
                  <span className="tabular-nums">{formatPrice(order.my_subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission de la plateforme</span>
                  <span className="tabular-nums">− {formatPrice(order.my_commission_total)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Ce que je touche</span>
                  <span className="tabular-nums">{formatPrice(order.my_net_total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Infos client + adresse + notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="size-3" /> Client
                </p>
                <p className="font-medium">{order.client_name}</p>
                {order.client_phone && (
                  <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Phone className="size-3" /> {order.client_phone}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="size-3" /> Adresse de livraison
                </p>
                {(() => {
                  // shipping_address est toujours une chaîne texte (« ville / pays »)
                  const raw = order.shipping_address;
                  const lines = (typeof raw === 'string' ? raw : '')
                    .split('\n').map((l) => l.trim()).filter(Boolean);
                  if (!lines.length) return <p className="text-xs text-muted-foreground">—</p>;
                  return <div className="text-xs leading-relaxed space-y-0.5">{lines.map((l, i) => <p key={i}>{l}</p>)}</div>;
                })()}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                <p className="text-xs text-muted-foreground">{order.notes || '—'}</p>
              </div>
            </div>

            {/* Section préparation (hub model) */}
            {(canToggleReady || isShipped) && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <ReadinessBadge
                    readyCount={order.suppliers_ready_count}
                    totalCount={order.suppliers_total_count}
                  />

                  {canToggleReady && (
                    order.my_is_ready ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-muted-foreground"
                        onClick={handleUnmarkReady}
                        disabled={isPending}
                      >
                        {unmarking ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                        Annuler ma préparation
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleMarkReady}
                        disabled={isPending}
                      >
                        {marking ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
                        Mes articles sont prêts
                      </Button>
                    )
                  )}

                  {isShipped && order.shipment_depot_name && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Store className="size-4 shrink-0" />
                      Dépôt : <strong className="text-foreground">{order.shipment_depot_name}</strong>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SupplierOrderCardSkeleton() {
  return (
    <div className="bg-background rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function PageControls({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
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
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => { e.preventDefault(); onPage(p); }}
              >
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
  { value: 'all', label: 'Toutes' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'at_depot', label: 'Au dépôt' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function SupplierOrders() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSupplierOrders(statusFilter === 'all' ? undefined : statusFilter);

  const orders = data?.orders ?? [];
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginated = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = data?.count ?? 0;

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <PageContainer title="Commandes" subtitle="Commandes contenant vos produits">

      {/* Filtre */}
      <div className="flex justify-end mb-2">
        <Select value={statusFilter} onValueChange={handleFilterChange}>
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
          {Array.from({ length: 5 }).map((_, i) => <SupplierOrderCardSkeleton key={i} />)}
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
          <h3 className="font-semibold text-lg">Aucune commande</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'all'
              ? "Vos produits n'ont pas encore été commandés."
              : 'Aucune commande avec ce statut.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {count} commande{count > 1 ? 's' : ''}
            {totalPages > 1 && ` · page ${page}/${totalPages}`}
          </p>
          <div className="space-y-3">
            {paginated.map((order) => (
              <SupplierOrderCard key={order.id} order={order} />
            ))}
          </div>
          <PageControls page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </PageContainer>
  );
}
