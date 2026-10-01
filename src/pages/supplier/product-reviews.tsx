import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierReviewsList } from '@/services/reports.service';
import PageContainer from '@/components/shared/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
import { Star, Search, MessageSquare, ArrowLeft } from 'lucide-react';

const PAGE_SIZE = 10;

function Stars({ value, size = 13 }: { value: number; size?: number }) {
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

export default function SupplierProductReviews() {
  const navigate = useNavigate();
  const { data, isLoading } = useSupplierReviewsList();
  const reviews = data?.reviews ?? [];

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? reviews.filter((r) =>
        r.product_name.toLowerCase().includes(query) ||
        r.user.toLowerCase().includes(query) ||
        (r.comment?.toLowerCase().includes(query) ?? false),
      )
    : reviews;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const paged = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <PageContainer
      title="Avis sur mes produits"
      subtitle="Tous les avis reçus de vos clients"
    >
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => navigate('/supplier/reports')}
        >
          <ArrowLeft className="size-4" /> Retour aux rapports
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par produit, client ou commentaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-background rounded-xl border py-16 text-center space-y-3">
            <MessageSquare className="size-12 mx-auto text-muted-foreground" />
            <p className="font-medium">Aucun avis</p>
            <p className="text-sm text-muted-foreground">
              Vos produits n'ont pas encore reçu d'avis.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-background rounded-xl border py-16 text-center space-y-2">
            <Search className="size-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun avis ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filtered.length} avis
              {totalPages > 1 ? ` · page ${pageClamped}/${totalPages}` : ''}
            </p>
            <div className="space-y-3">
              {paged.map((r) => (
                <div key={r.id} className="bg-background rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Stars value={r.rating} />
                      <span className="text-sm font-medium truncate">
                        {r.product_name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>
                  {r.title && <p className="text-sm font-medium">{r.title}</p>}
                  {r.comment && (
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">— {r.user}</p>
                </div>
              ))}
            </div>
            <PageControls page={pageClamped} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
