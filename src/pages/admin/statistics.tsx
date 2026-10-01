import { useAdminStats } from '@/services/stats.service';
import { useDepotShipments } from '@/services/shipping.service';
import PageContainer from '@/components/shared/page-container';
import { ReturnsChart } from '@/components/shared/returns-chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  XCircle,
  Store,
  Truck,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

const pct = (n: number, total: number) =>
  total === 0 ? '0 %' : `${Math.round((n / total) * 100)} %`;

const STATUS_LABELS: Record<string, string> = {
  pending:          'En attente',
  confirmed:        'Confirmée',
  processing:       'En traitement',
  shipped:          'Expédiée',
  at_depot:         'Au dépôt',
  ready_for_pickup: 'À récupérer',
  delivered:        'Livrée',
  cancelled:        'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  pending:          '#f59e0b',
  confirmed:        '#3b82f6',
  processing:       '#a855f7',
  shipped:          '#6366f1',
  at_depot:         '#f97316',
  ready_for_pickup: '#14b8a6',
  delivered:        '#10b981',
  cancelled:        '#ef4444',
};

// ── sub-components ────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading: boolean;
}

function KpiCard({ label, value, sub, icon, iconBg, isLoading }: KpiProps) {
  return (
    <div className="bg-background rounded-xl border p-5 flex items-center gap-4">
      <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-3 w-28" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-semibold text-base mb-4">{children}</h2>;
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="text-xs">
          {p.name} : <span className="font-semibold">{p.value}</span>
          {p.dataKey === 'revenue' && <span className="ml-1">({fmt(p.value)})</span>}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-background border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-medium" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-xs text-muted-foreground">{d.value} · {d.payload.pct}</p>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Statistics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: shipmentsData, isLoading: shipmentsLoading } = useDepotShipments();

  const shipments = shipmentsData?.shipments ?? [];
  const isLoading = statsLoading;

  // Répartition par statut pour le pie chart
  const total = stats?.total_orders ?? 0;
  const statusData = (stats?.orders_by_status ?? []).map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? '#94a3b8',
    pct: pct(s.count, total),
  }));

  // Paiement
  const paymentData = (stats?.orders_by_payment ?? []).map((p) => ({
    name: p.payment_timing === 'pay_before' ? 'Payer avant' : 'Payer après',
    value: p.count,
    fill: p.payment_timing === 'pay_before' ? '#6366f1' : '#10b981',
    pct: pct(p.count, total),
  })).filter((d) => d.value > 0);

  // Évolution mensuelle
  const monthlyData = stats?.monthly ?? [];

  // Top dépôts
  const depotCounts: Record<string, { name: string; total: number; delivered: number }> = {};
  for (const s of shipments) {
    if (!depotCounts[s.depot_name]) depotCounts[s.depot_name] = { name: s.depot_name, total: 0, delivered: 0 };
    depotCounts[s.depot_name].total++;
    if (s.status === 'delivered') depotCounts[s.depot_name].delivered++;
  }
  const depotStats = Object.values(depotCounts).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <PageContainer title="Statistiques" subtitle="Vue analytique de la plateforme">
      <div className="space-y-8">

        {/* ── KPI cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Chiffre d'affaires (livrées)"
            value={fmt(stats?.total_revenue ?? 0)}
            icon={<TrendingUp className="size-5 text-emerald-600" />}
            iconBg="bg-emerald-100 dark:bg-emerald-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="Valeur moyenne / commande"
            value={fmt(stats?.avg_order_value ?? 0)}
            sub={`sur ${total} commandes`}
            icon={<ShoppingBag className="size-5 text-blue-600" />}
            iconBg="bg-blue-100 dark:bg-blue-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="Taux de livraison"
            value={pct(stats?.delivered_count ?? 0, total)}
            sub={`${stats?.delivered_count ?? 0} livrées`}
            icon={<PackageCheck className="size-5 text-indigo-600" />}
            iconBg="bg-indigo-100 dark:bg-indigo-950/40"
            isLoading={isLoading}
          />
          <KpiCard
            label="Taux d'annulation"
            value={pct(stats?.cancelled_count ?? 0, total)}
            sub={`${stats?.cancelled_count ?? 0} annulées`}
            icon={<XCircle className="size-5 text-red-500" />}
            iconBg="bg-red-100 dark:bg-red-950/40"
            isLoading={isLoading}
          />
        </div>

        {/* ── Bar chart: commandes par mois ─────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5">
          <SectionTitle>Évolution des commandes (6 derniers mois)</SectionTitle>
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-lg" />
          ) : monthlyData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="orders" name="Commandes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delivered" name="Livrées" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Pie charts ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Statuts */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle>Répartition par statut</SectionTitle>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : statusData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 w-full">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="truncate text-xs">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold tabular-nums">{d.value}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{d.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mode de paiement */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle>Mode de paiement</SectionTitle>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : paymentData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                      {paymentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-4 w-full">
                  {paymentData.map((d) => (
                    <div key={d.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" style={{ color: d.fill }} />
                          <span className="font-medium">{d.name}</span>
                        </div>
                        <span className="font-bold tabular-nums">{d.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: d.pct, backgroundColor: d.fill }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{d.pct}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CA mensuel ────────────────────────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5">
          <SectionTitle>Chiffre d'affaires mensuel (livrées)</SectionTitle>
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-lg" />
          ) : monthlyData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="revenue" name="CA (FCFA)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Top dépôts ────────────────────────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5">
          <SectionTitle>Top dépôts par colis traités</SectionTitle>
          {shipmentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : depotStats.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Store className="size-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun colis traité pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {depotStats.map((d, i) => {
                const rate = d.total > 0 ? Math.round((d.delivered / d.total) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center gap-4">
                    <span className="shrink-0 text-xs font-bold text-muted-foreground w-4 text-right">#{i + 1}</span>
                    <div className="shrink-0 size-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                      <Store className="size-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Truck className="size-3" /> {d.total} colis</span>
                          <span className="flex items-center gap-1"><PackageCheck className="size-3 text-emerald-500" /> {d.delivered} livrés</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 w-10 text-right">{rate}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Retours (client vs délai dépassé) ─────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5">
          <SectionTitle>Retours de commandes (client vs délai dépassé)</SectionTitle>
          <ReturnsChart
            summary={stats?.returns_summary}
            timeline={stats?.returns_timeline}
            isLoading={isLoading}
          />
        </div>

      </div>
    </PageContainer>
  );
}
