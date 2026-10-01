import PageContainer from "@/components/shared/page-container";
import { ProductManagement } from "@/components/shared/product-management";
import { useGetAllProducts } from "@/services/product.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AdminProducts() {
  const { data: response, isLoading, error } = useGetAllProducts();

  // État de chargement
  if (isLoading) {
    return (
      <PageContainer
        title="Produits"
        subtitle="Gérez votre catalogue de produits"
      >
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Chargement des produits...
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Skeleton pour la barre de recherche */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
            
            {/* Skeleton pour le tableau */}
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            
            {/* Skeleton pour la pagination */}
            <div className="flex justify-between">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-60" />
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <PageContainer
        title="Produits"
        subtitle="Gérez votre catalogue de produits"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Impossible de charger les produits. Veuillez vérifier votre
            connexion et réessayer.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Détails : {error.message}
            </span>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // Extraire le tableau data de la réponse
  const products = Array.isArray(response) ? response : (response as any)?.results || [];

  return (
    <ProductManagement allProducts={products} />
  );
}
