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
// import { useModal } from "@/components/shared/modal-provider";
import { toast } from "sonner";
import {
  ChevronLeft,
  AlertCircle,
//   Edit,
  Image as ImageIcon,
  Package,
  DollarSign,
  Layers,
  Calendar,
  User
} from "lucide-react";

import { getImageUrl } from '@/utils/image';
import { ProductVariantsCard } from '@/components/shared/product-variants-card';

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useGetProductById(id || "");
//   const { openModal } = useModal();
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

  // État de chargement
  if (isLoading) {
    return (
      <PageContainer title="Détails du produit" subtitle="Chargement...">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // État d'erreur
  if (error || !normalizedProduct) {
    return (
      <PageContainer title="Détails du produit" subtitle="Erreur">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Impossible de charger le produit. Veuillez réessayer.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              {error?.message}
            </span>
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/products")}
          className="mt-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </PageContainer>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className?: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      approved: { variant: "default", label: "Approuvé", className: "bg-green-600 hover:bg-green-500" },
      rejected: { variant: "destructive", label: "Rejeté" }
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdate = async (formData: any) => {
    try {
      await updateProduct(formData);
      toast.success("Produit modifié avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
      throw error;
    }
  };

  return (
    <PageContainer
      title={normalizedProduct?.name || "Produit"}
      subtitle={normalizedProduct?.sku ? `SKU: ${normalizedProduct.sku}` : ""}
    >
      <div className="space-y-4">
        {/* En-tête avec actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/products")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>

          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              onClick={() => openModal("update-product-view")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button> */}
          </div>
        </div>

        {/* Modal de mise à jour */}
        {normalizedProduct && (
          <UpdateProductModal
            modalId="update-product-view"
            onConfirm={handleUpdate}
            product={normalizedProduct}
            isLoading={false}
          />
        )}

        {/* Grille de cartes */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Carte Prix */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prix
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(normalizedProduct.price)}</div>
            </CardContent>
          </Card>

          {/* Carte Stock */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stock disponible
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{normalizedProduct.stock_quantity}</div>
              <Badge variant={normalizedProduct.stock_quantity > 0 ? "default" : "destructive"} className="mt-2">
                {normalizedProduct.stock_quantity > 0 ? "En stock" : "Rupture"}
              </Badge>
            </CardContent>
          </Card>

          {/* Carte Statut */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Statut
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getStatusBadge(normalizedProduct.status)}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Actif:</span>
                  <Badge variant={normalizedProduct.is_active ? "default" : "secondary"}>
                    {normalizedProduct.is_active ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image principale */}
            {normalizedProduct.image && (
              <div className="flex justify-center">
                <img
                  src={normalizedProduct.image}
                  alt={normalizedProduct.name}
                  className="max-w-md rounded-lg border"
                />
              </div>
            )}

            <Separator />

            {/* Détails */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Catégorie
                </h3>
                <p className="text-base">{normalizedProduct.category_name || "Aucune"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Poids / Unité
                </h3>
                <p className="text-base">
                  {normalizedProduct.weight ? `${normalizedProduct.weight} ${normalizedProduct.unite || 'unit'}` : "Non spécifié"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Fournisseur
                </h3>
                <p className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {normalizedProduct.supplier_name || "Non attribué"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Date de création
                </h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(normalizedProduct.created_at)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="text-base text-muted-foreground">
                {normalizedProduct.description || "Aucune description disponible"}
              </p>
            </div>

            <Separator />

            {/* Images */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images ({normalizedProduct.images?.length || 0})
              </h3>
              {normalizedProduct.images && normalizedProduct.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {normalizedProduct.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${normalizedProduct.name} ${index + 1}`}
                      className="w-full aspect-square object-cover rounded border"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune image</p>
              )}
            </div>
          </CardContent>
        </Card>

        <ProductVariantsCard variants={normalizedProduct.variants} />

        {/* Section métadonnées */}
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">ID: </span>
                <span className="text-sm font-mono">{normalizedProduct.id}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Slug: </span>
                <span className="text-sm font-mono">{normalizedProduct.slug}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Créé le: </span>
                <span className="text-sm">{formatDate(normalizedProduct.created_at)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modifié le: </span>
                <span className="text-sm">{formatDate(normalizedProduct.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
