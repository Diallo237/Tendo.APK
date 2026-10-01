import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/shared/product-card';
import { useCart } from '@/contexts/cart-context';
import { useUser } from '@/contexts/user-context';
import { useGetRecommendations } from '@/services/product.service';
import { getImageUrl } from '@/utils/image';
import type { Product } from '@/types/product';

const MAX_MOST_VIEWED = 6;      // nb de "plus consultés" en tête
const MAX_EXTRA_FAVORITES = 3;  // favoris pas encore consultés (→ 6 + 3 = 9 max)

/** Normalise un produit de l'API pour la ProductCard (image dérivée + rating numérique). */
function normalize(products: Product[] = []): Product[] {
  return products.map((product) => ({
    ...product,
    image: getImageUrl(product.images),
    rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
  }));
}

/**
 * Carrousel personnalisé affiché en haut de la home, uniquement pour un
 * utilisateur connecté. Une seule ligne (max 9) : les 6 produits les plus
 * consultés + jusqu'à 3 favoris pas encore consultés, sans doublon. Un produit
 * favori est marqué d'un badge « Favori » (au lieu d'être affiché deux fois).
 * (« Recommandé pour vous » est mis en pause en attendant un modèle ML.)
 */
export function ProductRecommendations() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useUser();
  const { data, isLoading } = useGetRecommendations();

  const mostViewed = useMemo(() => normalize(data?.most_viewed).slice(0, MAX_MOST_VIEWED), [data]);
  const favorites = useMemo(() => normalize(data?.favorites), [data]);
  const favoriteIds = useMemo(() => new Set(favorites.map((p) => p.id)), [favorites]);

  // Une seule liste : les 6 plus consultés + jusqu'à 3 favoris pas encore
  // consultés (sans doublon) → 9 max.
  const items = useMemo(() => {
    const viewedIds = new Set(mostViewed.map((p) => p.id));
    const extraFavorites = favorites
      .filter((p) => !viewedIds.has(p.id))
      .slice(0, MAX_EXTRA_FAVORITES);
    return [...mostViewed, ...extraFavorites];
  }, [mostViewed, favorites]);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast.success(`${product.name} ajouté au panier`, { description: `Quantité: ${quantity}` });
  };

  const handleViewDetails = (product: Product) => {
    navigate(`/customer/product/${product.slug}`);
  };

  // Réservé aux connectés (l'anonyme est traité dans la grille de la home)
  if (!user) return null;
  if (isLoading) return null;
  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Vos produits les plus consultés</h2>
      </div>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((product) => (
          <div key={product.id} className="relative w-[150px] sm:w-[170px] flex-shrink-0 snap-start">
            {favoriteIds.has(product.id) && (
              <Badge className="absolute top-1 left-1 z-10 gap-0.5 bg-red-500 hover:bg-red-500 text-white text-[9px] px-1 py-0 h-4">
                <Heart className="size-2.5 fill-current" /> Favori
              </Badge>
            )}
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
