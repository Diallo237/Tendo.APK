import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/shared/product-card';
import { PromoCarousel } from '@/components/shared/promo-carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, SlidersHorizontal, Store, X, ImageOff } from 'lucide-react';
import { ImageSearchButton } from '@/components/shared/image-search-button';
import { useImageSearch } from '@/hooks/use-image-search';
import { useCart } from '@/contexts/cart-context';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { toast } from 'sonner';
import { useGetAllProducts, useGetRecommendations } from '@/services/product.service';
import { useGetAllCategories } from '@/services/category.service';
import { shuffle } from '@/utils/shuffle';
import { CategoryPicker, getDescendantIds } from '@/components/shared/category-picker';
import { ProductRecommendations } from '@/components/shared/product-recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

// Composant Skeleton pour les cartes produits
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-[340px]">
      <CardHeader className="p-0">
        <Skeleton className="h-[135px] w-full rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-2 flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
      </CardContent>
      <CardFooter className="p-2 pt-0">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}

import { getImageUrl } from '@/utils/image';

export function CustomerHome() {
  const navigate = useNavigate();
  
  // Récupération des produits et catégories depuis l'API
  const { data: productsData, isLoading, isError, error } = useGetAllProducts();
  const { data: categoriesData } = useGetAllCategories();
  const { data: recoData } = useGetRecommendations();
  const imageSearch = useImageSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 35;
  const { addToCart } = useCart();
  
  // Normaliser les produits de l'API avec useMemo pour éviter les recalculs
  const products = useMemo(() => {
    if (!productsData) return [];
    // Vérifier si productsData est un tableau, sinon prendre productsData.results ou retourner un tableau vide
    const dataArray = Array.isArray(productsData) ? productsData : (productsData as any)?.results || [];
    return dataArray.map((product: Product) => ({
      ...product,
      image: getImageUrl(product.images),
      rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
    }));
  }, [productsData]);
  
  const categories = categoriesData || [];
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    let result = [...products];

    // Filtrer par recherche
    if (searchQuery) {
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrer par catégorie (inclut toutes les sous-catégories)
    if (selectedCategory !== 'all') {
      const categoryId = parseInt(selectedCategory);
      const ids = getDescendantIds(categoryId, categories as Category[]);
      result = result.filter(product => ids.includes(product.category as number));
    }

    // Trier
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Vue par défaut (sans recherche/filtre/tri) : un primo-visiteur (aucune vue
  // ni favori) voit les best-sellers en tête puis le reste en ordre aléatoire.
  // Un utilisateur avec historique garde la grille normale (sa perso est dans le carrousel).
  const orderedProducts = useMemo(() => {
    const isDefaultView = !searchQuery && selectedCategory === 'all' && sortBy === 'name';
    if (!isDefaultView) return filteredProducts;
    const hasHistory = (recoData?.most_viewed?.length ?? 0) > 0 || (recoData?.favorites?.length ?? 0) > 0;
    if (hasHistory) return filteredProducts;
    const byId = new Map(filteredProducts.map((p) => [p.id, p]));
    const best = (recoData?.best_sellers ?? [])
      .map((p) => byId.get(p.id))
      .filter((p): p is Product => Boolean(p));
    const bestSet = new Set(best.map((p) => p.id));
    const rest = shuffle(filteredProducts.filter((p) => !bestSet.has(p.id)));
    return [...best, ...rest];
  }, [filteredProducts, recoData, searchQuery, selectedCategory, sortBy]);

  // Calcul de la pagination
  const totalPages = Math.ceil(orderedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = orderedProducts.slice(startIndex, endIndex);

  // Réinitialiser la page à 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast.success(`${product.name} ajouté au panier`, {
      description: `Quantité: ${quantity}`,
    });
  };

  const handleViewDetails = (product: Product) => {
    navigate(`/customer/product/${product.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-4">
        {/* Carrousel de promotions */}
        <PromoCarousel />

        {/* Recommandations personnalisées (recommandés / plus consultés / favoris) */}
        <ProductRecommendations />

        {/* Filtres et recherche */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Barre de recherche + recherche par image */}
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un produit..."
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <ImageSearchButton onSelect={imageSearch.searchByImage} isSearching={imageSearch.isSearching} />
            </div>

            {/* Filtre par catégorie */}
            <CategoryPicker
              categories={categories as Category[]}
              value={selectedCategory}
              onChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
            />

            {/* Tri */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[160px] h-9">
                <SlidersHorizontal className="size-3 mr-2" />
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
                <SelectItem value="price-asc">Prix ↑</SelectItem>
                <SelectItem value="price-desc">Prix ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résultats */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Grille de produits */}
        {imageSearch.active ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                Résultats de la recherche par image ({imageSearch.results!.length})
              </p>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={imageSearch.clear}>
                <X className="size-3 mr-1" /> Effacer
              </Button>
            </div>
            {imageSearch.results!.length === 0 ? (
              <div className="text-center py-12">
                <ImageOff className="size-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold mb-2">Aucune image trouvée pour cette image</h3>
                <p className="text-sm text-muted-foreground">Aucun produit similaire dans le catalogue. Essayez avec une autre image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                {imageSearch.results!.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {Array.from({ length: 20 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <Store className="size-12 mx-auto text-destructive mb-4" />
            <h3 className="text-base font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Impossible de charger les produits'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Store className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
              {currentProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
