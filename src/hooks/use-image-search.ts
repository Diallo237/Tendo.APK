import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { searchProductsByImage } from '@/services/product.service';
import { getImageUrl } from '@/utils/image';
import type { Product } from '@/types/product';

/**
 * Gère la recherche de produits par image.
 * `results` est null quand aucune recherche par image n'est active (grille normale).
 */
export function useImageSearch() {
  const [results, setResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const searchByImage = useCallback(async (file: File) => {
    setIsSearching(true);
    setFileName(file.name);
    try {
      const products = await searchProductsByImage(file);
      // Normalisation pour la ProductCard (image dérivée + rating numérique)
      setResults(
        products.map((p) => ({
          ...p,
          image: getImageUrl(p.images),
          rating: typeof p.rating === 'string' ? parseFloat(p.rating) : p.rating,
        }))
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        toast.error("La recherche par image n'est pas disponible pour le moment.");
      } else if (status === 400) {
        toast.error('Image invalide. Essayez une autre photo.');
      } else {
        toast.error('La recherche par image a échoué.');
      }
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults(null);
    setFileName(null);
  }, []);

  return { results, isSearching, fileName, searchByImage, clear, active: results !== null };
}
