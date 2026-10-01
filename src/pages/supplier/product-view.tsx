import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useGetProductById, useUpdateProduct } from "@/services/product.service";
import PageContainer from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UpdateProductModal } from "@/components/modals";
import { useModal } from "@/components/shared/modal-provider";
import { ProductVariantsCard } from "@/components/shared/product-variants-card";
import { toast } from "sonner";
import {
  ChevronLeft,
  AlertCircle,
  Edit,
  Image as ImageIcon,
  Package,
  DollarSign,
  Layers,
  Calendar,
  User
} from "lucide-react";

import { getImageUrl } from '@/utils/image';

export default function SupplierProductView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useGetProductById(id || "");
  const { openModal } = useModal();
  const { mutateAsync: updateProduct } = useUpdateProduct();

  // Normaliser les URLs des images
  const normalizedProduct = useMemo(() => {
    if (!product) return null;
    return {
      ...product,
      image: product.images?.[0] ? getImageUrl(product.images[0]) : undefined,
      images: product.images?.map(getImageUrl) || []
    };
  }, [product]);

  const handleUpdate = async (formData: any) => {
    try {
      await updateProduct(formData);
      toast.success("Produit modifié avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
      throw error;
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <PageContainer
        title="Détails du produit"
        subtitle="Chargement des informations..."
      >
        <div className="space-y-6 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/supplier/products")}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Skeleton pour images */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <Skeleton className="aspect-square w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Skeleton pour informations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  // État d'erreur
  if (error || !normalizedProduct) {
    return (
      <PageContainer
        title="Détails du produit"
        subtitle="Erreur de chargement"
      >
        <div className="space-y-6 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/supplier/products")}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les détails du produit.
              {error && (
                <span className="text-xs block mt-2">
                  Détails : {(error as any).message}
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className?: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      approved: { variant: "default", label: "Approuvé", className: "bg-green-600" },
      rejected: { variant: "destructive", label: "Rejeté" }
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <PageContainer
      title={normalizedProduct.name}
      subtitle={normalizedProduct.description || "Détails du produit"}
    >
      <div className="space-y-6 px-2">
        {/* En-tête avec boutons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/supplier/products")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => openModal("update-product-view")}
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>

        {/* Grille principale */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne gauche : Images */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image principale */}
              {normalizedProduct.image ? (
                <div className="aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={normalizedProduct.image}
                    alt={normalizedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* Galerie miniatures */}
              {normalizedProduct.images && normalizedProduct.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {normalizedProduct.images.map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded border"
                    >
                      <img
                        src={img}
                        alt={`${normalizedProduct.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colonne droite : Informations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Informations du produit</CardTitle>
                {getStatusBadge(normalizedProduct.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="text-base">{normalizedProduct.sku}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Prix</p>
                    <p className="text-2xl font-bold">{formatPrice(normalizedProduct.price)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Stock disponible</p>
                    <p className="text-base">
                      <Badge variant={normalizedProduct.stock_quantity > 0 ? "default" : "destructive"}>
                        {normalizedProduct.stock_quantity} unités
                      </Badge>
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                    <p className="text-base">{normalizedProduct.category_name || "-"}</p>
                  </div>
                </div>

                {normalizedProduct.weight && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Poids</p>
                        <p className="text-base">
                          {normalizedProduct.weight} {normalizedProduct.unite}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Statut d'activation</p>
                    <p className="text-base">
                      <Badge variant={normalizedProduct.is_active ? "default" : "secondary"}>
                        {normalizedProduct.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Dates</p>
                    <div className="space-y-1 text-sm">
                      {normalizedProduct.created_at && (
                        <p>
                          Créé le : {new Date(normalizedProduct.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {normalizedProduct.updated_at && (
                        <p>
                          Modifié le : {new Date(normalizedProduct.updated_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {normalizedProduct.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-base leading-relaxed">
                      {normalizedProduct.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <ProductVariantsCard variants={normalizedProduct.variants} />
      </div>

      {/* Modal de modification */}
      {normalizedProduct && (
        <UpdateProductModal
          modalId="update-product-view"
          onConfirm={handleUpdate}
          product={normalizedProduct}
          isLoading={false}
          isSupplierView={true}
        />
      )}
    </PageContainer>
  );
}
