import { useNavigate } from 'react-router-dom';
import { useSupplierOrders } from '@/services/order.service';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  Package,
  Truck,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Store,
  Bell,
  XCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import type { OrderStatus } from '@/types/order';

// ── helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (amount: string | number) =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));

// ── status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending:          { label: 'En attente',       icon: <Clock className="size-3.5" />,        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
  confirmed:        { label: 'Confirmée',         icon: <CheckCircle2 className="size-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' },
  processing:       { label: 'En traitement',     icon: <Package className="size-3.5" />,      color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400' },
  shipped:          { label: 'Expédiée',          icon: <Truck className="size-3.5" />,        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' },
  at_depot:         { label: 'Au dépôt',          icon: <Store className="size-3.5" />,        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400' },
  ready_for_pickup: { label: 'À récupérer',       icon: <Bell className="size-3.5" />,         color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400' },
  delivered:        { label: 'Livrée',            icon: <CheckCircle2 className="size-3.5" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
  cancelled:        { label: 'Annulée',           icon: <XCircle className="size-3.5" />,      color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  isLoading: boolean;
}

function KpiCard({ label, value, icon, iconBg, isLoading }: KpiCardProps) {
  return (
    <div className="bg-background rounded-xl border p-5 flex items-center gap-4">
      <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useSupplierOrders();

  const orders = data?.orders ?? [];

  // ── KPI computations ──────────────────────────────────────────────────────
  const totalOrders = orders.length;
  const toProcessOrders = orders.filter((o) =>
    (['confirmed', 'processing'] as OrderStatus[]).includes(o.status)
  ).length;
  const shippingOrders = orders.filter((o) =>
    (['shipped', 'at_depot', 'ready_for_pickup'] as OrderStatus[]).includes(o.status)
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  // ── Alerts ────────────────────────────────────────────────────────────────
  const pendingAttentionCount = orders.filter((o) =>
    (['pending', 'confirmed'] as OrderStatus[]).includes(o.status)
  ).length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;

  // ── Recent orders: last 5 ─────────────────────────────────────────────────
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité fournisseur"
    >
      <div className="space-y-6">

        {/* ── Alert banner ──────────────────────────────────────────────── */}
        {!isLoading && pendingAttentionCount > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-800 dark:text-amber-300">
                  {pendingAttentionCount} commande{pendingAttentionCount > 1 ? 's' : ''} nécessitent votre attention
                </p>
                {confirmedCount > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {confirmedCount} commande{confirmedCount > 1 ? 's' : ''} confirmée{confirmedCount > 1 ? 's' : ''} en attente de traitement
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0"
              onClick={() => navigate('/supplier/orders')}
            >
              Voir les commandes <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total commandes"
            value={totalOrders}
            icon={<ShoppingBag className="size-5 text-blue-600" />}
            iconBg="bg-blue-100 dark:bg-blue-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="À traiter"
            value={toProcessOrders}
            icon={<Package className="size-5 text-amber-600" />}
            iconBg="bg-amber-100 dark:bg-amber-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="En expédition"
            value={shippingOrders}
            icon={<Truck className="size-5 text-indigo-600" />}
            iconBg="bg-indigo-100 dark:bg-indigo-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="Livrées"
            value={deliveredOrders}
            icon={<PackageCheck className="size-5 text-emerald-600" />}
            iconBg="bg-emerald-100 dark:bg-emerald-950/40"
            isLoading={isLoading}
          />
        </div>

        {/* ── Commandes récentes ─────────────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Commandes récentes</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => navigate('/supplier/orders')}
            >
              Voir tout <ArrowRight className="size-3.5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="size-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    {order.shipment_depot_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        {order.shipment_depot_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-sm">{formatPrice(order.my_subtotal)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Delivered success stat ─────────────────────────────────────── */}
        {!isLoading && deliveredOrders > 0 && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
            <div className="shrink-0 size-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
              <PackageCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-emerald-800 dark:text-emerald-300">
                {deliveredOrders} commande{deliveredOrders > 1 ? 's' : ''} livrée{deliveredOrders > 1 ? 's' : ''} avec succès
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Excellent taux de livraison — continuez ainsi !
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
