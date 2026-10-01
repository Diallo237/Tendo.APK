import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/components/shared/modal-provider";
import { useUser } from "@/contexts/user-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Check,
  X,
  Download
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useArchiveProduct,
  useDeleteProduct,
  useToggleProductActivation,
  useApproveProduct,
  useRejectProduct
} from "@/services/product.service";
import { useNavigate } from "react-router-dom";
import {
  CreateProductModal,
  UpdateProductModal,
  DeleteConfirmationModal
} from "@/components/modals";
import { ProductExportDialog } from "@/components/shared/product-export-dialog";

interface ProductManagementProps {
  allProducts?: Product[];
  isSupplierView?: boolean;
}

import { getImageUrl } from '@/utils/image';

export function ProductManagement({ 
  allProducts = [],
  isSupplierView = false
}: ProductManagementProps) {
  const products = allProducts;
  const { user } = useUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const { openModal } = useModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const navigate = useNavigate();
  
  const { mutateAsync: createProduct } = useCreateProduct();
  const { mutateAsync: updateProduct } = useUpdateProduct();
  const { mutateAsync: archiveProduct } = useArchiveProduct();
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { mutateAsync: toggleProductActivation } = useToggleProductActivation();
  const { mutateAsync: approveProduct } = useApproveProduct();
  const { mutateAsync: rejectProduct } = useRejectProduct();

  // Normaliser les URLs des images
  const normalizedProducts = useMemo(() => {
    return products.map(product => ({
      ...product,
      image: product.images?.[0] ? getImageUrl(product.images[0]) : undefined,
      images: product.images?.map(getImageUrl) || []
    }));
  }, [products]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtrage
  const filteredProducts = normalizedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tri
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];

    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Gestion du tri
  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handlers CRUD
  const handleCreate = async (formData: any) => {
    try {
      const result = await createProduct(formData);
      toast.success("Produit créé avec succès");
      return result; // Retourner le produit créé
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
      throw error; // Propager l'erreur
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      await updateProduct(formData);
      toast.success("Produit modifié avec succès");
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  /**
   * « Supprimer » côté fournisseur : le produit est archivé, pas détruit.
   *
   * Il quitte la boutique et son catalogue immédiatement, quel que soit son
   * statut ; un administrateur confirme ensuite la suppression définitive.
   */
  const handleArchive = async () => {
    if (!selectedProduct) return;

    try {
      const { detail } = await archiveProduct(selectedProduct.id);
      toast.success(detail || 'Produit supprimé de votre catalogue');
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error?.details?.detail || error.message || "Erreur lors de la suppression");
    }
  };

  /** Suppression définitive par l'administrateur, quel que soit le statut. */
  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct(selectedProduct.id);
      toast.success(`« ${selectedProduct.name} » a été supprimé définitivement`);
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error?.details?.detail || error.message || "Suppression impossible");
    }
  };

  const handleToggleActivation = async (product: Product) => {
    try {
      await toggleProductActivation(product.id);
      toast.success(`Produit ${!product.is_active ? 'activé' : 'désactivé'}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de statut");
    }
  };

  const handleApprove = async (product: Product) => {
    try {
      await approveProduct(product.id);
      toast.success("Produit approuvé avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async (product: Product) => {
    try {
      await rejectProduct(product.id);
      toast.success("Produit rejeté avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet");
    }
  };

  const handleApproval = async (product: Product, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      await handleApprove(product);
    } else {
      await handleReject(product);
    }
  };

  // Badge de statut
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 pt-0 sm:p-4 sm:pt-0">
      {/* Cards de statistiques */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{normalizedProducts.length}</div>
            <p className="text-xs text-muted-foreground">Total Produits</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {normalizedProducts.filter(p => p.status === 'approved' && p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Produits Actifs</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {normalizedProducts.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">En Attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card className="bg-muted/50 flex-1">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>Gestion des Produits</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setExportOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2 flex-1 sm:flex-none"
                disabled={products.length === 0}
                title={products.length === 0 ? 'Aucun produit à exporter' : undefined}
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button
                onClick={() => openModal("create-product")}
                size="sm"
                className="gap-2 flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                Nouveau produit
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, description ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tableau */}
          <div className="rounded-md border bg-background">
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] min-w-[50px]">Image</TableHead>
                <TableHead className="min-w-[150px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="h-8 gap-1 p-0 hover:bg-transparent"
                  >
                    Nom
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[100px]">SKU</TableHead>
                <TableHead className="min-w-[120px]">Catégorie</TableHead>
                <TableHead className="min-w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("price")}
                    className="h-8 gap-1 p-0 hover:bg-transparent"
                  >
                    Prix
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[80px]">Stock</TableHead>
                <TableHead className="min-w-[100px]">Statut</TableHead>
                <TableHead className="min-w-[80px]">Actif</TableHead>
                <TableHead className="text-right min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Aucun produit trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.category_name || "-"}</TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                        {product.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={() => handleToggleActivation(product)}
                        disabled={product.status !== 'approved'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigate(isSupplierView ? `/supplier/products/${product.id}` : `/admin/products/${product.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product);
                              openModal("update-product");
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {isSupplierView && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  openModal("archive-product");
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                          {!isSupplierView && (
                            <>
                              <DropdownMenuSeparator />
                              {product.status !== 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => handleApproval(product, 'approved')}
                                  className="text-green-600"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approuver
                                </DropdownMenuItem>
                              )}
                              {product.status !== 'rejected' && (
                                <DropdownMenuItem
                                  onClick={() => handleApproval(product, 'rejected')}
                                  className="text-orange-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Rejeter
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {/* Un produit commandé ne peut pas être effacé :
                                  ses lignes de commande partiraient avec lui. */}
                              {product.orders_count ? (
                                <DropdownMenuItem disabled className="flex-col items-start gap-0">
                                  <span className="flex items-center">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </span>
                                  <span className="pl-6 text-xs">Déjà commandé</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    openModal("delete-product");
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          </div>
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4">
          <div className="text-sm text-muted-foreground">
            {filteredProducts.length === 0
              ? "Aucun produit"
              : `${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} sur ${
                  filteredProducts.length
                } produit(s)`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Précédent</span>
              <span className="sm:hidden">Préc</span>
            </Button>

            <div className="text-sm">
              Page {currentPage} sur {totalPages || 1}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <CreateProductModal
        modalId="create-product"
        onConfirm={handleCreate}
        isLoading={false}
        isSupplierView={isSupplierView}
        currentUserId={user?.id}
      />

      {selectedProduct && (
        <>
          <UpdateProductModal
            modalId="update-product"
            onConfirm={handleUpdate}
            product={selectedProduct}
            isLoading={false}
            isSupplierView={isSupplierView}
          />

          <DeleteConfirmationModal
            modalId="archive-product"
            title="Supprimer le produit"
            description={`Voulez-vous supprimer « ${selectedProduct.name} » ? Il ne sera plus visible dans la boutique ni dans vos produits.`}
            // L'encart par défaut annonce une action irréversible : ici le
            // produit est seulement archivé.
            showWarning={false}
            onConfirm={handleArchive}
            confirmText="Supprimer"
          />

          <DeleteConfirmationModal
            modalId="delete-product"
            title="Supprimer définitivement"
            description={`« ${selectedProduct.name} » sera effacé de la base.`}
            onConfirm={handleDelete}
            confirmText="Supprimer définitivement"
          />
        </>
      )}
    </Card>

    <ProductExportDialog
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      isSupplierView={isSupplierView}
    />
  </div>
  );
}
