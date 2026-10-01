import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useAdminDepotStats,
  useAdminLowStock,
  downloadReportExcel,
} from '@/services/reports.service';
import PageContainer from '@/components/shared/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  Truck,
  PackageCheck,
  MapPin,
  Store,
  AlertTriangle,
  PackageX,
  Download,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 12;

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(n);

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-semibold text-base">{children}</h2>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading: boolean;
}) {
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
          </>
        )}
      </div>
    </div>
  );
}

function ExportButton({
  onExport,
  disabled,
}: {
  onExport: () => Promise<void>;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      title={disabled ? 'Aucune donnée à exporter' : undefined}
      disabled={loading || disabled}
      onClick={async () => {
        setLoading(true);
        try {
          await onExport();
        } catch {
          toast.error("Échec de l'export Excel");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <FileSpreadsheet className="size-4 animate-pulse" />
      ) : (
        <Download className="size-4" />
      )}
      Export Excel
    </Button>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="text-xs">
          {p.name} : <span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
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
    <Pagination className="mt-4">
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

// ── main ────────────────────────────────────────────────────────────────────

export default function Reports() {
  const { data: depotStats, isLoading: depotLoading } = useAdminDepotStats();
  const { data: lowStock, isLoading: stockLoading } = useAdminLowStock();

  const depots = depotStats?.depots ?? [];
  const regions = depotStats?.regions ?? [];
  const products = lowStock?.products ?? [];

  const totalRevenue = regions.reduce((s, r) => s + r.revenue, 0);
  const totalVolume = regions.reduce((s, r) => s + r.volume, 0);
  const totalDelivered = regions.reduce((s, r) => s + r.delivered, 0);

  // Pagination des tableaux (12 lignes / page)
  const [depotPage, setDepotPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [depotSearch, setDepotSearch] = useState('');

  // Recherche « Détail par dépôt » : nom de dépôt, région ou ville
  const depotQuery = depotSearch.trim().toLowerCase();
  const depotsFiltered = depotQuery
    ? depots.filter((d) =>
        d.depot_name.toLowerCase().includes(depotQuery) ||
        d.region.toLowerCase().includes(depotQuery) ||
        (d.city?.toLowerCase().includes(depotQuery) ?? false),
      )
    : depots;

  const depotTotalPages = Math.max(1, Math.ceil(depotsFiltered.length / PAGE_SIZE));
  const depotPageClamped = Math.min(depotPage, depotTotalPages);
  const depotsPaged = depotsFiltered.slice((depotPageClamped - 1) * PAGE_SIZE, depotPageClamped * PAGE_SIZE);

  // Retour à la page 1 quand la recherche change
  useEffect(() => { setDepotPage(1); }, [depotSearch]);

  const stockTotalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const stockPageClamped = Math.min(stockPage, stockTotalPages);
  const productsPaged = products.slice((stockPageClamped - 1) * PAGE_SIZE, stockPageClamped * PAGE_SIZE);

  const regionChart = regions.map((r) => ({ name: r.region, revenue: r.revenue }));

  return (
    <PageContainer
      title="Rapports"
      subtitle="Performances logistiques et alertes de stock de la plateforme"
    >
      <div className="space-y-8">

        {/* ════════ Revenus par dépôt / région ════════ */}
        <section className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="CA livré (tous dépôts)"
              value={fmt(totalRevenue)}
              icon={<TrendingUp className="size-5 text-emerald-600" />}
              iconBg="bg-emerald-100 dark:bg-emerald-950/40"
              isLoading={depotLoading}
            />
            <KpiCard
              label="Colis routés"
              value={String(totalVolume)}
              icon={<Truck className="size-5 text-blue-600" />}
              iconBg="bg-blue-100 dark:bg-blue-950/40"
              isLoading={depotLoading}
            />
            <KpiCard
              label="Colis livrés"
              value={String(totalDelivered)}
              icon={<PackageCheck className="size-5 text-indigo-600" />}
              iconBg="bg-indigo-100 dark:bg-indigo-950/40"
              isLoading={depotLoading}
            />
          </div>

          {/* CA par région */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle
              action={
                <ExportButton
                  disabled={depots.length === 0}
                  onExport={() =>
                    downloadReportExcel(
                      '/analytics/admin/depot-stats/',
                      'rapport_depots.xlsx',
                    )
                  }
                />
              }
            >
              Chiffre d'affaires par région
            </SectionTitle>
            {depotLoading ? (
              <Skeleton className="h-56 w-full rounded-lg" />
            ) : regionChart.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                Aucune donnée
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={regionChart} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="CA"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Détail par dépôt */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle>Détail par dépôt</SectionTitle>
            {depotLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : depots.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Store className="size-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucun dépôt enregistré.
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Rechercher par dépôt, région ou ville..."
                    value={depotSearch}
                    onChange={(e) => setDepotSearch(e.target.value)}
                  />
                </div>
                {depotsFiltered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Aucun dépôt ne correspond à votre recherche.
                  </p>
                ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Dépôt</th>
                      <th className="py-2 px-3 font-medium">Région</th>
                      <th className="py-2 px-3 font-medium text-right">Colis</th>
                      <th className="py-2 px-3 font-medium text-right">Livrés</th>
                      <th className="py-2 pl-3 font-medium text-right">CA livré</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depotsPaged.map((d) => (
                      <tr key={d.depot_id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 size-7 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                              <Store className="size-3.5 text-orange-600" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{d.depot_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {d.city}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {d.region}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {d.volume}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600">
                          {d.delivered}
                        </td>
                        <td className="py-2.5 pl-3 text-right tabular-nums font-semibold">
                          {fmt(d.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PageControls page={depotPageClamped} totalPages={depotTotalPages} onPage={setDepotPage} />
              </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ════════ Alertes stock faible ════════ */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              label="Produits en rupture"
              value={String(lowStock?.out_of_stock_count ?? 0)}
              icon={<PackageX className="size-5 text-red-500" />}
              iconBg="bg-red-100 dark:bg-red-950/40"
              isLoading={stockLoading}
            />
            <KpiCard
              label={`Stock faible (≤ ${lowStock?.threshold ?? 10})`}
              value={String(lowStock?.low_stock_count ?? 0)}
              icon={<AlertTriangle className="size-5 text-amber-500" />}
              iconBg="bg-amber-100 dark:bg-amber-950/40"
              isLoading={stockLoading}
            />
          </div>

          <div className="bg-background rounded-xl border p-5">
            <SectionTitle
              action={
                <ExportButton
                  disabled={products.length === 0}
                  onExport={() =>
                    downloadReportExcel(
                      '/analytics/admin/low-stock/',
                      'alertes_stock.xlsx',
                    )
                  }
                />
              }
            >
              Alertes stock — tous fournisseurs
            </SectionTitle>
            {stockLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <PackageCheck className="size-10 mx-auto text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Aucune alerte : tous les stocks sont suffisants.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Produit</th>
                      <th className="py-2 px-3 font-medium">Fournisseur</th>
                      <th className="py-2 px-3 font-medium">Catégorie</th>
                      <th className="py-2 px-3 font-medium text-right">Stock</th>
                      <th className="py-2 pl-3 font-medium text-right">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsPaged.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {p.supplier_name}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {p.category || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                          {p.stock_quantity}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.state === 'out'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            }`}
                          >
                            {p.state === 'out' ? (
                              <>
                                <PackageX className="size-3" /> Rupture
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="size-3" /> Faible
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PageControls page={stockPageClamped} totalPages={stockTotalPages} onPage={setStockPage} />
              </div>
            )}
          </div>
        </section>

      </div>
    </PageContainer>
  );
}
