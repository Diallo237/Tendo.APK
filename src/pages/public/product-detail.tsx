import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProductDetailView } from '@/components/shared/product-detail-view';
import { useGetProductBySlug } from '@/services/product.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';
import { useMemo } from 'react';

import { getImageUrl } from '@/utils/image';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Récupérer le produit par son slug
  const { data: productData, isLoading, isError } = useGetProductBySlug(slug || '');

  // Normaliser le produit avec les URLs complètes des images
  const product = useMemo(() => {
    if (!productData) return null;
    return {
      ...productData,
      image: getImageUrl(productData.images),
      images: Array.isArray(productData.images) 
        ? productData.images.map(img => getImageUrl(img))
        : [getImageUrl(productData.images)],
      rating: typeof productData.rating === 'string' ? parseFloat(productData.rating) : productData.rating,
    };
  }, [productData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Store className="size-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <Button onClick={() => navigate('/shop')}>
          Retour à la boutique
        </Button>
      </div>
    );
  }

  return (
    <ProductDetailView 
      product={product} 
      backUrl="/shop" 
      backLabel="Retour à la boutique" 
      showThemeToggle
      showCart
    />
  );
}
