import { useNavigate } from 'react-router-dom';
import { useOrderHistory } from '@/services/order.service';
import { useDepots, useDepotShipments } from '@/services/shipping.service';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  CheckCircle2,
  Truck,
  PackageCheck,
  Store,
  MapPin,
  Package,
  Bell,
  Clock,
  XCircle,
  ArrowRight,
  User,
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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: ordersData, isLoading: ordersLoading } = useOrderHistory();
  const { data: depots = [], isLoading: depotsLoading } = useDepots();
  const { data: shipmentsData, isLoading: shipmentsLoading } = useDepotShipments();

  const orders = ordersData?.orders ?? [];
  const shipments = shipmentsData?.shipments ?? [];

  // ── KPI computations ──────────────────────────────────────────────────────
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed').length;
  const inTransitOrders = orders.filter((o) =>
    (['shipped', 'at_depot', 'ready_for_pickup'] as OrderStatus[]).includes(o.status)
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  // ── Recent orders: last 5 ─────────────────────────────────────────────────
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // ── Depots ────────────────────────────────────────────────────────────────
  const activeDepots = depots.filter((d) => d.is_active);

  // ── Shipment stats ────────────────────────────────────────────────────────
  const inTransitShipments = shipments.filter((s) => s.status === 'sent_to_depot').length;
  const atDepotShipments = shipments.filter((s) => s.status === 'at_depot').length;
  const notifiedShipments = shipments.filter((s) => s.status === 'client_notified').length;

  return (
    <PageContainer
      title="Tableau de bord"
      subtitle="Vue d'ensemble de la plateforme Tendo"
    >
      <div className="space-y-6">

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total commandes"
            value={totalOrders}
            icon={<ShoppingBag className="size-5 text-blue-600" />}
            iconBg="bg-blue-100 dark:bg-blue-950/40"
            isLoading={ordersLoading}
          />
          <KpiCard
            label="Confirmées"
            value={confirmedOrders}
            icon={<CheckCircle2 className="size-5 text-purple-600" />}
            iconBg="bg-purple-100 dark:bg-purple-950/40"
            isLoading={ordersLoading}
          />
          <KpiCard
            label="En livraison"
            value={inTransitOrders}
            icon={<Truck className="size-5 text-indigo-600" />}
            iconBg="bg-indigo-100 dark:bg-indigo-950/40"
            isLoading={ordersLoading}
          />
          <KpiCard
            label="Livrées"
            value={deliveredOrders}
            icon={<PackageCheck className="size-5 text-emerald-600" />}
            iconBg="bg-emerald-100 dark:bg-emerald-950/40"
            isLoading={ordersLoading}
          />
        </div>

        {/* ── Bottom sections: 2-column on lg ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Commandes récentes ─────────────────────────────────────── */}
          <div className="bg-background rounded-xl border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Commandes récentes</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={() => navigate('/admin/orders')}
              >
                Voir tout <ArrowRight className="size-3.5" />
              </Button>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <ShoppingBag className="size-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{order.order_number}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <User className="size-3" />
                        <span className="truncate">{order.client_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="font-semibold text-sm">{formatPrice(order.total_amount)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column: Dépôts + Colis ──────────────────────────── */}
          <div className="space-y-6">

            {/* Dépôts actifs */}
            <div className="bg-background rounded-xl border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Dépôts actifs</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => navigate('/admin/depots')}
                >
                  Gérer <ArrowRight className="size-3.5" />
                </Button>
              </div>

              {depotsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="size-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeDepots.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <Store className="size-9 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Aucun dépôt actif.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {activeDepots.length} dépôt{activeDepots.length > 1 ? 's' : ''} actif{activeDepots.length > 1 ? 's' : ''}
                    {depots.length > activeDepots.length && ` · ${depots.length - activeDepots.length} inactif${depots.length - activeDepots.length > 1 ? 's' : ''}`}
                  </p>
                  <div className="space-y-2">
                    {activeDepots.slice(0, 4).map((depot) => {
                      const location = [depot.commune_name, depot.departement_name].filter(Boolean).join(', ');
                      return (
                        <div key={depot.id} className="flex items-center gap-3">
                          <div className="shrink-0 size-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                            <Store className="size-4 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{depot.name}</p>
                            {location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="size-3 shrink-0" />
                                {location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {activeDepots.length > 4 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        + {activeDepots.length - 4} autre{activeDepots.length - 4 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Colis en cours */}
            <div className="bg-background rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold text-base">Colis en cours</h2>

              {shipmentsLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3 text-center">
                    <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{inTransitShipments}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Truck className="size-3 text-indigo-500" />
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">En transit</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3 text-center">
                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400 tabular-nums">{atDepotShipments}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Store className="size-3 text-orange-500" />
                      <p className="text-xs text-orange-600 dark:text-orange-400">Au dépôt</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 p-3 text-center">
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">{notifiedShipments}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Bell className="size-3 text-teal-500" />
                      <p className="text-xs text-teal-600 dark:text-teal-400">Notifiés</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
