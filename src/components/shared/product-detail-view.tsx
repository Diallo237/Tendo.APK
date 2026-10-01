import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useApproveProduct, useRejectProduct } from '@/services/product.service';
import {
  ShoppingCart,
  Heart,
  Star,
  ChevronLeft,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { AuthService } from '@/services/auth.service';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { CartModal } from '@/components/shared/cart-modal';
import { useFavorites } from '@/contexts/favorites-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '@/types/product';
import { VariantPicker } from '@/components/shared/variant-picker';
import { libelleChoix, libelleDimensionsPluriel } from '@/helpers/product-variants';
import { ReviewSection } from '@/components/shared/review-section';
import { useUser } from '@/contexts/user-context';

interface ProductDetailViewProps {
  product: Product;
  backUrl?: string;
  backLabel?: string;
  /** Bascule clair/sombre : utile là où aucun en-tête d'espace n'en fournit (boutique publique). */
  showThemeToggle?: boolean;
  /** Panier : même raison — sur la boutique publique, cette barre tient lieu d'en-tête. */
  showCart?: boolean;
  showAdminActions?: boolean;
}

export function ProductDetailView({ 
  product, 
  backUrl = '/shop',
  backLabel = 'Retour',
  showThemeToggle = false,
  showCart = false,
  showAdminActions = false
}: ProductDetailViewProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addToCart, items, updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { mutateAsync: approveProduct } = useApproveProduct();
  const { mutateAsync: rejectProduct } = useRejectProduct();

  const [selectedImage, setSelectedImage] = useState(0);

  // Déclinaisons (taille/couleur) : vide pour un produit qui n'en a pas.
  const declinaisons = product.variants ?? [];
  const aDesDeclinaisons = declinaisons.some((v) => v.is_active);
  const choix = libelleChoix(declinaisons);              // « une couleur », « une taille et une couleur »
  const pluriel = libelleDimensionsPluriel(declinaisons); // « couleurs », « tailles et couleurs »
  const [declinaison, setDeclinaison] = useState<ProductVariant | null>(null);

  // Le stock à respecter est celui de la déclinaison choisie, pas celui du
  // produit, qui n'est que la somme de toutes les déclinaisons.
  const stockDisponible = aDesDeclinaisons
    ? (declinaison?.stock_quantity ?? 0)
    : product.stock_quantity;
  const enRupture = aDesDeclinaisons
    ? !declinaisons.some((v) => v.is_available)
    : product.stock_quantity === 0;

  const cartItem = items.find(
    (item) => item.product.id === product.id && (item.variant?.id ?? null) === (declinaison?.id ?? null)
  );
  const isFav = isFavorite(product.id);
  const rating = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating ?? 0);
  const reviewsCount = product.reviews_count || 0;

  // La quantité affichée correspond à ce qui est dans le panier
  const quantity = cartItem?.quantity || 0;

  // Images du produit (simulé pour la démo)
  const productImages = product.images || [product.image, product.image, product.image];

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleAddToCart = () => {
    if (aDesDeclinaisons && !declinaison) {
      toast.error(`Choisissez d'abord ${choix}`);
      return;
    }
    addToCart(product, 1, declinaison);
    const libelle = declinaison ? `${product.name} (${declinaison.label})` : product.name;
    toast.success(`1 ${libelle} ajouté au panier`);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 0) return;
    if (aDesDeclinaisons && !declinaison) {
      toast.error(`Choisissez d'abord ${choix}`);
      return;
    }
    if (newQuantity > stockDisponible) {
      toast.error('Stock insuffisant');
      return;
    }

    // Si la quantité actuelle est 0 et qu'on veut augmenter, utiliser addToCart
    if (quantity === 0 && newQuantity > 0) {
      addToCart(product, newQuantity, declinaison);
    } else {
      // Sinon, mettre à jour directement la quantité dans le panier
      updateQuantity(product.id, newQuantity, declinaison?.id);
    }
  };

  const handleApprove = async () => {
    try {
      await approveProduct(product.id);
      toast.success("Produit approuvé avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    try {
      await rejectProduct(product.id);
      toast.success("Produit rejeté avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)} className="h-8">
            <ChevronLeft className="size-4 mr-1" />
            {backLabel}
          </Button>
          <div className="flex items-center gap-2">
            {showThemeToggle && <ThemeToggle />}
            {showCart && <CartModal />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Galerie d'images - Taille réduite */}
          <div className="space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border max-w-[500px] mx-auto">
              <img
                src={productImages[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* Miniatures */}
            <div className="grid grid-cols-4 gap-2 max-w-[500px] mx-auto">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'aspect-square rounded-md overflow-hidden border-2 transition-all',
                    selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-gray-300'
                  )}
                >
                  <img
                    src={image || product.image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Informations produit - Textes réduits */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 leading-tight">{product.name}</h1>

              {/* Rating et avis */}
              <div className="flex items-center gap-2 mb-3">
                {reviewsCount > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'size-4',
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({reviewsCount} avis)</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Aucun avis</span>
                )}
              </div>

              {/* Prix */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Stock — pour un produit décliné, le détail figure sous le sélecteur */}
              {enRupture ? (
                <Badge variant="destructive" className="text-xs">Rupture de stock</Badge>
              ) : aDesDeclinaisons ? (
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  Plusieurs {pluriel} disponibles
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  En stock ({product.stock_quantity} disponibles)
                </Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="font-semibold text-base mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description ||
                  'Découvrez ce produit de qualité exceptionnelle. Parfait pour répondre à tous vos besoins quotidiens avec style et efficacité.'}
              </p>
            </div>

            <Separator />

            {/* Taille et couleur */}
            {aDesDeclinaisons && (
              <>
                <VariantPicker
                  variants={declinaisons}
                  value={declinaison}
                  onChange={setDeclinaison}
                />
                <Separator />
              </>
            )}

            {/* Quantité et actions */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantité</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleUpdateQuantity(quantity - 1)}
                    disabled={quantity <= 0}
                    className="h-9 w-9"
                  >
                    <Minus className="size-4" />
                  </Button>

                  <span className="w-12 text-center text-base font-semibold">{quantity}</span>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleUpdateQuantity(quantity + 1)}
                    disabled={quantity >= stockDisponible}
                    className="h-9 w-9"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="default"
                  className="flex-1 h-10"
                  onClick={handleAddToCart}
                  disabled={enRupture || (aDesDeclinaisons && !declinaison?.is_available)}
                >
                  <ShoppingCart className="size-4 mr-2" />
                  {aDesDeclinaisons && !declinaison
                    ? `Choisir ${choix}`
                    : cartItem
                      ? 'Ajouter plus'
                      : 'Ajouter au panier'}
                </Button>

                <Button
                  size="default"
                  variant={isFav ? 'default' : 'outline'}
                  onClick={() => {
                    toggleFavorite(product.id);
                    toast.success(
                      isFav ? 'Retiré des favoris' : 'Ajouté aux favoris'
                    );
                  }}
                  className="h-10 w-10 p-0"
                >
                  <Heart className={cn('size-4', isFav && 'fill-current')} />
                </Button>
              </div>

              {/* Actions admin */}
              {showAdminActions && product.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="default"
                    variant="default"
                    className="flex-1 h-10"
                    onClick={handleApprove}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="default"
                    variant="destructive"
                    className="flex-1 h-10"
                    onClick={handleReject}
                  >
                    Rejeter
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Avantages */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                  <Truck className="size-4 text-primary" />
                </div>
                <span>Livraison via dépôt-relais partout au Sénégal</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                  <Shield className="size-4 text-primary" />
                </div>
                <span>Garantie 100% authentique</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                  <RotateCcw className="size-4 text-primary" />
                </div>
                <span>Retour gratuit sous 7 jours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section avis */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <ReviewSection
              productId={product.id}
              isAuthenticated={AuthService.hasRole(user, 'client')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
