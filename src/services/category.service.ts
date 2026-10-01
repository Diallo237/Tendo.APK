import { useAxiosDelete, useAxiosGet, useAxiosPost, useAxiosPut } from "@/hooks/use-api";
import type { ApiResponse } from "@/types";
import type { Category, CategoryFormData, CategorySearchResponse, CommissionGrid } from "@/types/category";
import apiClient, { buildApiUrl } from "@/utils/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Factory function pour créer des query keys par contexte
// const createCategoryKeys = (context: 'admin' | 'supplier' | 'customer' = 'admin') => ({
//     all: ['categories', context] as const,
//     detail: (id: number | string) => ['categories', context, 'detail', id] as const,
// });

const CATEGORY_KEYS = {
    all: ['categories'] as const,
    detail: (id: number | string) => ['categories', 'detail', id] as const,
}


    
/** Récupère la liste des catégories */
export function useGetAllCategories() {
    const url = buildApiUrl('/categories/');
    // const keys = createCategoryKeys();
    return useAxiosGet<Category[]>(
        CATEGORY_KEYS.all,
        url,
        {},
        { staleTime: 2 * 60 * 1000 }
    );
}

/** Récupère une catégorie par son ID */
export function useGetCategoryBy(id: number | string) {
     const url = buildApiUrl(`/categories/${id}/`);
    return useAxiosGet<Category>(
        CATEGORY_KEYS.detail(id),
        url,
    );
}

/** Créer une nouvelle catégorie */
export function useCreateCategory() {
    const url = buildApiUrl('/categories/');
    const queryClient = useQueryClient();
    return useAxiosPost<Category, CategoryFormData>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
            }
        },

    );
}

/** Mise à jour d'une catégorie */
export function useUpdateCategory() {
    const url = buildApiUrl(`/categories`);
    const queryClient = useQueryClient();
    return useAxiosPut<ApiResponse<Category>, CategoryFormData & { id: number | string }>(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
            },
            
        },

    );
}

/** Activer/désactiver une catégorie (désactive aussi sous-catégories et produits) */
export function useToggleCategoryActivation() {
    const queryClient = useQueryClient();
    
    return {
        mutateAsync: async (id: number | string) => {
            const url = buildApiUrl(`/categories/${id}/toggle-activation/`);
            const response = await apiClient.post<{ data: Category }>(url);
            
            // Invalider tous les contextes (admin, supplier, customer)
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
            
            return response.data.data;
        },
        isPending: false, // À gérer avec un état si nécessaire
    };
}


/**
 * Rechercher par nom de la categorie
 */
export function useGetCategoriesByName(name: string) {
    const url = buildApiUrl('/categories/search/');
    return useAxiosGet<CategorySearchResponse>(
        [ ...CATEGORY_KEYS.all, 'search', name ],
        url,
        {
            params: { q: name }
        },
        { enabled: !!name } 
    );
}

/** Supprimer une catégorie */
export function useDeleteCategory() {
    const url = buildApiUrl(`/categories`);
    const queryClient = useQueryClient();
    return useAxiosDelete(
        url,
        undefined,
        {
            onSuccess: () => {
                // Invalider tous les contextes (admin, supplier, customer)
                queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
            }
        },
    );
}

/** Grille des commissions (administrateur et fournisseur). */
export function useCommissionGrid() {
    return useAxiosGet<CommissionGrid>(
        [...CATEGORY_KEYS.all, 'commissions'],
        buildApiUrl('/categories/commissions/'),
    );
}

/** Enregistrer les taux modifiés (administrateur). Un taux nul = héritage du parent. */
export function useUpdateCommissionGrid() {
    const queryClient = useQueryClient();
    return useMutation<CommissionGrid, Error, { id: number; commission_rate: string | null }[]>({
        mutationFn: async (rates): Promise<CommissionGrid> => {
            const res = await apiClient.put(buildApiUrl('/categories/commissions/'), { rates });
            return res.data as unknown as CommissionGrid;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
    });
}

/** Ouvre la grille des commissions en PDF dans un nouvel onglet. */
export async function openCommissionGridPdf(): Promise<void> {
    const res = await apiClient.get(buildApiUrl('/categories/commissions/pdf/'), {
        responseType: 'blob',
    });
    const url = window.URL.createObjectURL(
        new Blob([res.data as unknown as BlobPart], { type: 'application/pdf' }),
    );
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}


/** Rapport d'un import de catégories, tel que renvoyé par le serveur. */
export interface CategoryImportReport {
    /** Catégories créées. */
    created: string[];
    /** Catégories existantes mises à jour (option « remplacer »). */
    updated: string[];
    /** Catégories déjà en base, laissées intactes. */
    unchanged: string[];
    errors: { ligne: number; nom: string; message: string }[];
    /** En-têtes du fichier qui n'ont pas été reconnus. */
    ignored_columns: string[];
}

/** Télécharge le modèle Excel prérempli des catégories (administrateur). */
export async function downloadCategoryTemplate(): Promise<void> {
    const res = await apiClient.get(buildApiUrl('/categories/import-template/'), {
        responseType: 'blob',
    });
    const data = res.data as unknown as Blob;
    if (data.size === 0 || (data.type || '').includes('json')) {
        throw new Error("Le serveur n'a pas renvoyé de fichier Excel.");
    }
    const url = window.URL.createObjectURL(data);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = 'categories-tendo.xlsx';
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}

/** Importer un classeur de catégories (administrateur). */
export function useImportCategories() {
    const queryClient = useQueryClient();
    return useMutation<CategoryImportReport, Error, { file: File; replace: boolean }>({
        mutationFn: async ({ file, replace }): Promise<CategoryImportReport> => {
            const corps = new FormData();
            corps.append('file', file);
            corps.append('replace', replace ? 'true' : 'false');
            // En-tête explicite : le client envoie du JSON par défaut, et le
            // serveur ne trouvait alors aucun fichier.
            const res = await apiClient.post(buildApiUrl('/categories/import/'), corps, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data as unknown as CategoryImportReport;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
    });
}
