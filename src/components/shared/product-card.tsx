import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Star, Heart, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types/product';
import { useCart } from '@/contexts/cart-context';
import { useFavorites } from '@/contexts/favorites-context';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { items, updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Un produit décliné (taille/couleur) ne peut pas être ajouté depuis la
  // vignette : le choix se fait sur la fiche, où les disponibilités sont
  // visibles. La carte y renvoie donc simplement.
  const aDesDeclinaisons = (product.variants ?? []).some(v => v.is_active);

  // Vérifier si le produit est dans le panier
  const cartItem = aDesDeclinaisons
    ? undefined
    : items.find(item => item.product.id === product.id && !item.variant);
  const isInCart = !!cartItem && cartItem.quantity > 0;
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (aDesDeclinaisons) {
      onViewDetails?.(product);
      return;
    }
    onAddToCart(product, 1);
  };

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(product.id, quantity + 1);
    } else {
      onAddToCart(product, 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem && quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else if (cartItem && quantity === 1) {
      updateQuantity(product.id, 0); // Supprimer du panier
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  // Fonction pour afficher les étoiles
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "size-3",
              star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  const productRating = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating ?? 0);
  const reviewsCount = product.reviews_count || 0;
  const isFav = isFavorite(product.id);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-[340px] relative">
      <CardHeader className="p-0 relative">
        <div className="overflow-hidden bg-muted relative h-[135px]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <ShoppingCart className="size-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Bouton Voir plus en overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails?.(product)}
              className="gap-1 text-xs h-6 px-2"
            >
              <Eye className="size-3" />
              Voir
            </Button>
          </div>

          {/* Bouton favori en haut à droite */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 hover:bg-white shadow-sm text-gray-600 hover:text-red-500",
              isFav && "text-red-500 hover:text-red-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
          >
            <Heart className={cn("size-3", isFav && "fill-current")} />
          </Button>
        </div>
        
        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <Badge variant="destructive" className="absolute top-1 left-1 text-[9px] px-1 py-0 h-4">
            Stock limité
          </Badge>
        )}
        
        {product.stock_quantity === 0 && (
          <Badge variant="destructive" className="absolute top-1 left-1 text-[9px] px-1 py-0 h-4">
            Rupture
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-2 flex-1 flex flex-col justify-between">
        <h3 className="font-medium text-xs line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        {/* Étoiles et avis */}
        {reviewsCount > 0 && (
          <div className="flex items-center gap-0.5">
            {renderStars(productRating)}
            <span className="text-[9px] text-muted-foreground">
              ({reviewsCount})
            </span>
          </div>
        )}
        
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">{isInCart && quantity > 0 ? (
          // Boutons +/- quand le produit est dans le panier
          <div className="flex items-center gap-1.5 w-full">
            <Button
              size="icon"
              variant="outline"
              onClick={handleDecrement}
              className="h-8 w-8 flex-shrink-0"
            >
              <Minus className="size-4" />
            </Button>
            
            <span className="flex-1 text-center text-base font-semibold">
              {quantity}
            </span>
            
            <Button
              size="icon"
              variant="outline"
              onClick={handleIncrement}
              disabled={quantity >= product.stock_quantity}
              className="h-8 w-8 flex-shrink-0"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        ) : (
          // Bouton Ajouter au panier - TOUJOURS visible si pas dans le panier
          // Un libellé unique et court : « Choisir une taille et une couleur »
          // débordait du bouton sur les petits écrans. Pour un produit
          // décliné, le bouton mène à la fiche, où le choix se fait.
          <Button
            className="w-full h-8 text-xs font-medium"
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            size="sm"
            title={aDesDeclinaisons
              ? 'Choisissez la taille ou la couleur sur la fiche du produit'
              : undefined}
          >
            <ShoppingCart className="size-3.5 mr-1.5 shrink-0" />
            <span className="truncate">
              {product.stock_quantity === 0 ? 'Rupture' : 'Ajouter au panier'}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
