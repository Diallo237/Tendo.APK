import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderHistory } from '@/services/order.service';
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
  MapPin,
  Bell,
  Info,
  ArrowLeft,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types/order';

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending:          { label: 'En attente',         icon: <Clock className="size-3.5" />,        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
  confirmed:        { label: 'Confirmée',           icon: <CheckCircle2 className="size-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
  processing:       { label: 'En traitement',       icon: <Package className="size-3.5" />,      color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' },
  shipped:          { label: 'Expédiée',            icon: <Truck className="size-3.5" />,        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' },
  at_depot:         { label: 'Au dépôt',            icon: <Store className="size-3.5" />,        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400' },
  ready_for_pickup: { label: 'Prête à récupérer',   icon: <Bell className="size-3.5" />,         color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400' },
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

function StatusMessage({ order }: { order: Order }) {
  const { status, shipment_depot_name, shipment_depot_address, shipment_depot_location } = order;

  const depotDetail = shipment_depot_name
    ? [shipment_depot_name, shipment_depot_address, shipment_depot_location].filter(Boolean).join(' · ')
    : null;

  const configs: Partial<Record<OrderStatus, { text: string; sub?: string | null; style: string; icon: React.ReactNode }>> = {
    confirmed: {
      text: 'Commande confirmée avec succès. Le délai de récupération est au plus 48h.',
      style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
      icon: <CheckCircle2 className="size-4 shrink-0 mt-0.5" />,
    },
    processing: {
      text: 'Votre commande est en cours de traitement par le fournisseur.',
      style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
      icon: <Info className="size-4 shrink-0 mt-0.5" />,
    },
    shipped: {
      text: 'Votre commande est en cours d\'expédition vers le dépôt.',
      sub: depotDetail,
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800',
      icon: <Truck className="size-4 shrink-0 mt-0.5" />,
    },
    at_depot: {
      text: 'Votre commande est arrivée au dépôt. Vous serez notifié dès qu\'elle est prête à être récupérée.',
      sub: depotDetail,
      style: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800',
      icon: <Store className="size-4 shrink-0 mt-0.5" />,
    },
    ready_for_pickup: {
      text: 'Votre commande est disponible, vous pouvez venir la récupérer dès maintenant !',
      sub: depotDetail,
      style: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800',
      icon: <Bell className="size-4 shrink-0 mt-0.5" />,
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className={`flex items-start gap-2 px-4 py-2.5 text-xs border-t ${cfg.style}`}>
      {cfg.icon}
      <div>
        <span>{cfg.text}</span>
        {cfg.sub && (
          <p className="flex items-center gap-1 mt-0.5 opacity-80">
            <MapPin className="size-3 shrink-0" />
            {cfg.sub}
          </p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  // shipping_address est toujours une chaîne texte (« ville / pays »)
  const addrLines = (typeof order.shipping_address === 'string'
    ? order.shipping_address
    : ''
  ).split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="bg-background rounded-xl border overflow-hidden transition-shadow hover:shadow-sm">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-base">{formatPrice(order.total_amount)}</p>
            <p className="text-xs text-muted-foreground">{order.items_count} article{order.items_count > 1 ? 's' : ''}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Réduire' : 'Détails'}
          </Button>
        </div>
      </div>

      <StatusMessage order={order} />

      {expanded && (
        <>
          <Separator />
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              {order.items.map((item) => (
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
                  <p className="text-sm font-semibold shrink-0">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="size-3" /> Livraison
                </p>
                {addrLines.length
                  ? <div className="text-foreground leading-relaxed space-y-0.5 text-sm">{addrLines.map((l, i) => <p key={i}>{l}</p>)}</div>
                  : <p className="text-muted-foreground">—</p>}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement</p>
                <p className="text-foreground">{order.payment_timing_display}</p>
              </div>
            </div>

            {order.status === 'delivered' && order.recipient_last_name && (
              <>
                <Separator />
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Info className="size-3" /> Récupéré par
                  </p>
                  <p className="font-medium">{order.recipient_first_name} {order.recipient_last_name}</p>
                  <p className="text-xs text-muted-foreground">CNI : {order.recipient_id_card}</p>
                  {order.recipient_phone && (
                    <p className="text-xs text-muted-foreground">{order.recipient_phone}</p>
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

function OrderCardSkeleton() {
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
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'at_depot', label: 'Au dépôt' },
  { value: 'ready_for_pickup', label: 'À récupérer' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useOrderHistory(statusFilter === 'all' ? undefined : statusFilter);

  const orders = data?.orders ?? [];
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paginated = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/customer')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Mes commandes</h1>
            <p className="text-sm text-muted-foreground">Suivez l'état de vos commandes</p>
          </div>
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filtrer" />
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
          {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
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
            {statusFilter === 'all' ? "Vous n'avez pas encore passé de commande." : 'Aucune commande avec ce statut.'}
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
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <PageControls page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
