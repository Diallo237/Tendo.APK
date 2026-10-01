import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useSupplierStats, type StatsPeriod } from '@/services/stats.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnsChart } from '@/components/shared/returns-chart';
import { ShoppingBag, TrendingUp, Package, BarChart3, RotateCcw } from 'lucide-react';

const formatPrice = (n: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  day: '30 derniers jours',
  week: '12 dernières semaines',
  month: '12 derniers mois',
};

const PRODUCT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

function CustomTooltipRevenue({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-md px-3 py-2 text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.dataKey === 'revenue' ? formatPrice(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

interface SupplierChartsProps {
  supplierId?: number | null;
  compact?: boolean;
}

export function SupplierCharts({ supplierId, compact = false }: SupplierChartsProps) {
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const { data, isLoading } = useSupplierStats(period, supplierId);

  const summary = data?.summary;
  const timeline = data?.timeline ?? [];
  const topProducts = data?.top_products ?? [];
  const returnsSummary = data?.returns_summary;
  const returnsTimeline = data?.returns_timeline ?? [];

  const chartHeight = compact ? 160 : 220;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-1.5">
        {(['day', 'week', 'month'] as StatsPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center hidden sm:block">
          {PERIOD_LABELS[period]}
        </span>
      </div>

      {/* Summary cards */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <ShoppingBag className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className={`font-bold tabular-nums ${compact ? 'text-lg' : 'text-2xl'}`}>{summary?.total_orders ?? 0}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <TrendingUp className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className={`font-bold tabular-nums leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>{formatPrice(summary?.total_revenue ?? 0)}</p>
              <p className="text-xs text-muted-foreground">CA total</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Package className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className={`font-bold tabular-nums ${compact ? 'text-lg' : 'text-2xl'}`}>{summary?.active_products ?? 0}</p>
              <p className="text-xs text-muted-foreground">Produits actifs</p>
            </div>
          </>
        )}
      </div>

      {/* Orders timeline */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <BarChart3 className="size-3.5" /> Commandes par période
        </p>
        {isLoading ? (
          <Skeleton className={`w-full rounded-lg`} style={{ height: chartHeight }} />
        ) : timeline.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground" style={{ height: chartHeight }}>
            Aucune donnée pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Bar dataKey="orders" name="Commandes" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue timeline */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingUp className="size-3.5" /> Chiffre d'affaires par période
        </p>
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: chartHeight }} />
        ) : timeline.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground" style={{ height: chartHeight }}>
            Aucune donnée pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Bar dataKey="revenue" name="CA" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Package className="size-3.5" /> Top 5 produits (CA)
        </p>
        {isLoading ? (
          <Skeleton className="w-full rounded-lg" style={{ height: chartHeight }} />
        ) : topProducts.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground" style={{ height: chartHeight }}>
            Aucun produit vendu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartHeight, topProducts.length * 36)}>
            <BarChart
              layout="vertical"
              data={topProducts}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={compact ? 90 : 120} tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.length > (compact ? 14 : 18) ? v.slice(0, compact ? 14 : 18) + '…' : v}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Bar dataKey="revenue" name="CA" radius={[0, 3, 3, 0]} maxBarSize={28}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Retours (client vs délai dépassé) */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <RotateCcw className="size-3.5" /> Retours (client vs délai dépassé)
        </p>
        <ReturnsChart
          summary={returnsSummary}
          timeline={returnsTimeline}
          isLoading={isLoading}
          height={chartHeight}
        />
      </div>
    </div>
  );
}
