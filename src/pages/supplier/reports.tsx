import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useSupplierLowStock,
  useSupplierReviews,
  downloadReportExcel,
} from '@/services/reports.service';
import PageContainer from '@/components/shared/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  Star,
  MessageSquare,
  Package,
  AlertTriangle,
  PackageX,
  PackageCheck,
  Download,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

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

/** Affiche une note de 0 à 5 sous forme d'étoiles. */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }
        />
      ))}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  isLoading,
  extra,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-background rounded-xl border p-5 flex items-center gap-4">
      <div className={`shrink-0 rounded-xl p-3 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {extra}
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

// ── main ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

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

export default function SupplierReports() {
  const navigate = useNavigate();
  const { data: reviews, isLoading: reviewsLoading } = useSupplierReviews();
  const { data: lowStock, isLoading: stockLoading } = useSupplierLowStock();

  const overall = reviews?.overall;
  const ratedProducts = reviews?.products ?? [];
  const recentReviews = reviews?.recent_reviews ?? [];
  const products = lowStock?.products ?? [];

  // Pagination « Note moyenne par produit »
  const [productPage, setProductPage] = useState(1);
  const productTotalPages = Math.max(1, Math.ceil(ratedProducts.length / PAGE_SIZE));
  const productPageClamped = Math.min(productPage, productTotalPages);
  const ratedProductsPaged = ratedProducts.slice(
    (productPageClamped - 1) * PAGE_SIZE,
    productPageClamped * PAGE_SIZE,
  );
  useEffect(() => { setProductPage(1); }, [ratedProducts.length]);

  return (
    <PageContainer
      title="Rapports"
      subtitle="Avis clients et alertes de stock sur vos produits"
    >
      <div className="space-y-8">

        {/* ════════ Avis & notes ════════ */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Note moyenne"
              value={(overall?.avg_rating ?? 0).toFixed(1)}
              icon={<Star className="size-5 text-amber-500" />}
              iconBg="bg-amber-100 dark:bg-amber-950/40"
              isLoading={reviewsLoading}
              extra={
                <div className="mt-1">
                  <Stars value={overall?.avg_rating ?? 0} />
                </div>
              }
            />
            <KpiCard
              label="Avis reçus"
              value={String(overall?.total_reviews ?? 0)}
              icon={<MessageSquare className="size-5 text-blue-600" />}
              iconBg="bg-blue-100 dark:bg-blue-950/40"
              isLoading={reviewsLoading}
            />
            <KpiCard
              label="Produits notés"
              value={String(overall?.products_rated ?? 0)}
              icon={<Package className="size-5 text-indigo-600" />}
              iconBg="bg-indigo-100 dark:bg-indigo-950/40"
              isLoading={reviewsLoading}
            />
          </div>

          {/* Note par produit */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle
              action={
                <ExportButton
                  disabled={(overall?.total_reviews ?? 0) === 0}
                  onExport={() =>
                    downloadReportExcel(
                      '/analytics/supplier/reviews/',
                      'rapport_avis.xlsx',
                    )
                  }
                />
              }
            >
              Note moyenne par produit
            </SectionTitle>
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : ratedProducts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <MessageSquare className="size-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucun avis reçu pour le moment.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {ratedProductsPaged.map((p) => (
                    <div
                      key={p.product_id}
                      className="flex items-center justify-between gap-4"
                    >
                      <p className="text-sm font-medium truncate flex-1 min-w-0">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-3 shrink-0">
                        <Stars value={p.avg_rating} />
                        <span className="text-sm font-semibold tabular-nums w-8 text-right">
                          {p.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {p.reviews_count} avis
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <PageControls
                  page={productPageClamped}
                  totalPages={productTotalPages}
                  onPage={setProductPage}
                />
              </>
            )}
          </div>

          {/* Avis récents */}
          <div className="bg-background rounded-xl border p-5">
            <SectionTitle
              action={
                recentReviews.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7"
                    onClick={() => navigate('/supplier/reviews')}
                  >
                    Voir tout
                    <ChevronRight className="size-3.5" />
                  </Button>
                ) : undefined
              }
            >
              Avis récents
            </SectionTitle>
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun avis récent.
              </p>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((r, i) => (
                  <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Stars value={r.rating} size={13} />
                        <span className="text-xs font-medium truncate">
                          {r.product_name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {r.created_at.slice(0, 10)}
                      </span>
                    </div>
                    {r.title && <p className="text-sm font-medium">{r.title}</p>}
                    {r.comment && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {r.comment}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      — {r.user}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ════════ Alertes stock ════════ */}
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
                      '/analytics/supplier/low-stock/',
                      'mes_alertes_stock.xlsx',
                    )
                  }
                />
              }
            >
              Produits en rupture ou stock faible
            </SectionTitle>
            {stockLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <PackageCheck className="size-10 mx-auto text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Aucune alerte : vos stocks sont suffisants.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Produit</th>
                      <th className="py-2 px-3 font-medium">Catégorie</th>
                      <th className="py-2 px-3 font-medium text-right">Stock</th>
                      <th className="py-2 pl-3 font-medium text-right">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
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
              </div>
            )}
          </div>
        </section>

      </div>
    </PageContainer>
  );
}
