import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/product-card';
import { useFavorites } from '@/contexts/favorites-context';
import { useGetAllProducts } from '@/services/product.service';
import { useCart } from '@/contexts/cart-context';
import { getImageUrl } from '@/utils/image';
import { AuthModal } from '@/components/modals';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import type { Product } from '@/types/product';

export default function PublicFavoritesPage() {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { addToCart } = useCart();
  const { data: productsData } = useGetAllProducts();

  const products: Product[] = (productsData as any)?.results ?? productsData ?? [];
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const mapped = favoriteProducts.map((p) => ({
    ...p,
    image: p.images?.[0] ? getImageUrl(p.images[0]) : getImageUrl(undefined),
    images: p.images?.map(getImageUrl) || [],
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="flex flex-1 items-center gap-2 text-2xl font-bold">
          <Heart className="size-6 text-red-500 fill-red-500" />
          Mes Favoris
          {favorites.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({favorites.length})</span>
          )}
        </h1>
        <ThemeToggle />
      </div>

      {mapped.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="size-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Aucun favori pour le moment</p>
          <p className="text-sm mt-1">Ajoutez des produits à vos favoris en cliquant sur le cœur</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mapped.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p, qty) => addToCart(p, qty)}
              onViewDetails={(p) => navigate(`/shop/product/${p.slug}`)}
            />
          ))}
        </div>
      )}

      <AuthModal modalId="auth-modal" />
    </div>
  );
}
