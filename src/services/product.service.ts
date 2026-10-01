import { useAxiosDelete, useAxiosGet, useAxiosPost, useAxiosPut } from "@/hooks/use-api";
import type { ApiResponse } from "@/types";
import type { Product, ProductImage } from "@/types/product";
import apiClient, { buildApiUrl } from "@/utils/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";



const PRODUCT_KEYS = {
    all: ['products'] as const,
    list: () => [...PRODUCT_KEYS.all, 'list'] as const,
    detail: (id: number | string) => [...PRODUCT_KEYS.all, 'detail', id] as const,
};


/** Réponse de l'endpoint de recommandations */
export interface ProductRecommendations {
    /** Produits suggérés (catégories préférées, sinon populaires) */
    recommended: Product[];
    /** Produits les plus consultés par l'utilisateur */
    most_viewed: Product[];
    /** Produits favoris de l'utilisateur */
    favorites: Product[];
    /** Produits les plus commandés (mise en avant pour les primo-visiteurs) */
    best_sellers: Product[];
}

/**
 * Fusionne l'historique de consultation anonyme (cookie anon_id) dans le compte
 * qui vient de se connecter. À appeler juste après une connexion réussie.
 * Silencieux : ne doit jamais bloquer le login.
 */
export async function mergeAnonymousHistory(): Promise<void> {
    try {
        await apiClient.post(buildApiUrl('/products/merge-anonymous-history/'));
    } catch {
        // pas de blocage du parcours de connexion si la fusion échoue
    }
}

/** Recherche de produits par image (visual search) — renvoie les produits les plus proches. */
export async function searchProductsByImage(file: File): Promise<Product[]> {
    const form = new FormData();
    form.append('image', file);
    const response = await apiClient.post<{ count: number; results: Product[] }>(
        buildApiUrl('/products/search-by-image/'),
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return (response.data as unknown as { results?: Product[] }).results ?? [];
}

/** Récupère les recommandations personnalisées de l'utilisateur */
export function useGetRecommendations() {
    const url = buildApiUrl('/products/recommendations/');
    return useAxiosGet<ProductRecommendations>(
        [...PRODUCT_KEYS.all, 'recommendations'],
        url,
        {},
        { staleTime: 5 * 60 * 1000 }
    );
}

/**
 * Récupère la liste des produits.
 *
 * `scope='mine'` : catalogue du fournisseur connecté (y compris les produits en
 * attente d'approbation). Nécessaire depuis qu'un compte peut cumuler les rôles
 * client et fournisseur — sans ce paramètre, l'API sert le catalogue public.
 */
export function useGetAllProducts(scope?: 'mine') {
    const url = buildApiUrl('/products/');
    return useAxiosGet<Product[]>(
        scope ? [...PRODUCT_KEYS.all, scope] as const : PRODUCT_KEYS.all,
        url,
        scope ? { params: { scope } } : {},
        {
            staleTime: 30 * 1000,
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
            refetchInterval: 30 * 1000,
        }
    );
}

/** Récupère les détails d'un produit par son ID */
export function useGetProductById(productId: number | string) {
    const url = buildApiUrl(`/products/${productId}/`);
    return useAxiosGet<Product>(
        PRODUCT_KEYS.detail(productId),
        url
    );
}

/** Créer une nouvelle catégorie */
export function useCreateProduct() {
    const url = buildApiUrl('/products/');
    const queryClient = useQueryClient();
    return useAxiosPost<Product, Product>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            }
        },

    );
}

/** Mise à jour d'un produit */
export function useUpdateProduct() {
    const url = buildApiUrl(`/products`);
    const queryClient = useQueryClient();
    return useAxiosPut<ApiResponse<Product>, Partial<Product> & { id: number }>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            },
            
        },

    );
}

/** Supprimer un produit */
/**
 * « Supprimer » un brouillon côté fournisseur : le produit est archivé.
 *
 * Rien n'est détruit — il quitte le catalogue et attend qu'un administrateur
 * confirme. Voir useDeleteProduct pour la suppression définitive.
 */
export function useArchiveProduct() {
    const queryClient = useQueryClient();
    return useMutation<{ detail: string }, Error, number>({
        mutationFn: async (productId) => {
            // Le client enveloppe parfois la réponse dans `data` : on déballe.
            const res = await apiClient.post<{ detail: string }>(buildApiUrl(`/products/${productId}/archive/`));
            const corps = res.data as unknown as { detail?: string; data?: { detail: string } };
            return corps.data ?? { detail: corps.detail ?? '' };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
    });
}

/** Remettre un produit archivé au catalogue de son fournisseur (administrateur). */
export function useRestoreProduct() {
    const queryClient = useQueryClient();
    return useMutation<{ detail: string }, Error, number>({
        mutationFn: async (productId) => {
            // Le client enveloppe parfois la réponse dans `data` : on déballe.
            const res = await apiClient.post<{ detail: string }>(buildApiUrl(`/products/${productId}/restore/`));
            const corps = res.data as unknown as { detail?: string; data?: { detail: string } };
            return corps.data ?? { detail: corps.detail ?? '' };
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
    });
}

/** Produits archivés en attente d'une décision de l'administrateur. */
export function useArchivedProducts() {
    return useAxiosGet<Product[]>(
        [...PRODUCT_KEYS.all, 'archived'],
        buildApiUrl('/products/'),
        { params: { archived: 1 } },
    );
}

export function useDeleteProduct() {
    const url = buildApiUrl(`/products`);
    const queryClient = useQueryClient();
    return useAxiosDelete(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            }
        },
    );
}

/** Ajiuter une image a un produit */
export function useAddProductImage() {
    const url = buildApiUrl(`/product-images/`);
    const queryClient = useQueryClient();
    return useAxiosPost<ApiResponse<ProductImage>, FormData>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            }
        },
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }
    );
}

/** Modifier une image de produit */
export function useUpdateProductImage() {
    const url = buildApiUrl(`/product-images/`);
    const queryClient = useQueryClient();
    return useAxiosPut<ApiResponse<ProductImage>, ProductImage>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            }
        },

    );
}

/** Supprimer une image de produit */
export function useDeleteProductImage() {
    const url = buildApiUrl(`/product-images/`);
    const queryClient = useQueryClient();
    return useAxiosDelete(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            }
        },
    );
}

/** Recuperer un produit par son slug  */
export function useGetProductBySlug(slug: string) {
    const url = buildApiUrl(`/products/slug/${slug}/`);
    return useAxiosGet<Product>(
        [...PRODUCT_KEYS.all, 'slug', slug],
        url
    );
}

/** Hook pour activer/désactiver un produit */
export function useToggleProductActivation() {
    const queryClient = useQueryClient();
    
    return {
        mutateAsync: async (id: number | string) => {
            const url = buildApiUrl(`/products/${id}/toggle-active/`);
            const response = await apiClient.post<{ data: Product }>(url);
            
            // Invalider tous les contextes (admin, supplier, customer)
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            return response.data.data;
        }
    };
}

/** Hook pour approuver un produit */
export function useApproveProduct() {
    const queryClient = useQueryClient();
    
    return {
        mutateAsync: async (id: number | string) => {
            const url = buildApiUrl(`/products/${id}/approve/`);
            const response = await apiClient.post<{ data: Product }>(url);
            
            // Invalider tous les contextes (admin, supplier, customer)
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            return response.data.data;
        }
    };
}

/** Hook pour rejeter un produit */
export function useRejectProduct() {
    const queryClient = useQueryClient();
    
    return {
        mutateAsync: async (id: number | string) => {
            const url = buildApiUrl(`/products/${id}/reject/`);
            const response = await apiClient.post<{ data: Product }>(url);
            
            // Invalider tous les contextes (admin, supplier, customer)
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
            return response.data.data;
        }
    };
}