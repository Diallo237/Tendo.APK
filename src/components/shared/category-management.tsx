import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/components/shared/modal-provider";
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
import { 
  DeleteConfirmationModal, 
  CreateCategoryModal, 
  UpdateCategoryModal,
  ViewCategoryModal 
} from "@/components/modals";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Power,
  PowerOff,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { toast } from "sonner";
import type { Category, CategoryFormData } from "@/types/category";
import { useUser } from "@/contexts/user-context";
import { AuthService } from "@/services/auth.service";
import { 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useToggleCategoryActivation
} from "@/services/category.service";
import { CategoryImportButton } from "@/components/shared/category-import-dialog";

interface CategoryManagementProps {
  allCategories?: Category[];
  /** Force la lecture seule (ex: espace fournisseur) quel que soit le rôle. */
  readOnly?: boolean;
}

export function CategoryManagement({
  allCategories = [],
  readOnly = false
}: CategoryManagementProps) {
  // Utiliser directement les props - React gère automatiquement les re-renders
  const categories = allCategories;
  
  const [searchQuery, setSearchQuery] = useState("");
  // Utilisation du système de modal avec useModal
  const { openModal } = useModal();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { user } = useUser();
  // Gestion (créer/modifier/supprimer) réservée à l'admin ; jamais en mode lecture seule.
  const canManage = !readOnly && AuthService.hasRole(user, "admin");
  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();
  const { mutateAsync: toggleCategoryActivation } = useToggleCategoryActivation();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof Category | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fonction pour obtenir le nom du parent
  const getParentName = (parentId: number | null): string => {
    if (!parentId) return "-";
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : "-";
  };

  // Filtrage
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tri
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];

    // Gestion spéciale pour la colonne parent
    if (sortColumn === "parent") {
      aValue = getParentName(a.parent);
      bValue = getParentName(b.parent);
    }

    // Gestion des différents types
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue, "fr");
      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return sortDirection === "asc"
        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
        : (aValue === bValue ? 0 : aValue ? -1 : 1);
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = sortedCategories.slice(startIndex, endIndex);

  // Handler pour le tri
  const handleSort = (column: keyof Category) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handlers CRUD
  const handleCreate = async (formData: CategoryFormData) => {
    try {
      await createCategory(formData);
      toast.success("Catégorie créée avec succès");
      // setIsCreateOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la création de la catégorie");
    }
  };

  const handleUpdate = async (formData: CategoryFormData) => {
    if (!selectedCategory) return;

    try {
      await updateCategory({ ...formData, id: selectedCategory.id });
      toast.success("Catégorie mise à jour avec succès");
      setSelectedCategory(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la catégorie");
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    // Vérifier si la catégorie a des enfants
    const hasChildren = categories.some(cat => cat.parent === selectedCategory.id);
    if (hasChildren) {
      toast.error("Impossible de supprimer une catégorie ayant des sous-catégories");
      return;
    }

    try {
      await deleteCategory(selectedCategory.id);
      toast.success("Catégorie supprimée avec succès");
      // setIsDeleteOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression de la catégorie");
    }
  };

  const handleToggleActivation = async (category: Category) => {
    try {
      await toggleCategoryActivation(category.id);
      toast.success(
        category.is_active
          ? "Catégorie désactivée avec succès (sous-catégories et produits aussi)"
          : "Catégorie activée avec succès"
      );
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la catégorie");
    }
  };  // Ouvrir les dialogs
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    openModal("update-category-modal");
  };

  const openViewDialog = (category: Category) => {
    setSelectedCategory(category);
    openModal("view-category-modal");
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    openModal("delete-category-modal");
  };

  // Statistiques
  const totalCategories = categories.length;
  const mainCategories = categories.filter(cat => cat.parent === null).length;
  const subCategories = categories.filter(cat => cat.parent !== null).length;
  const activeCategories = categories.filter(cat => cat.is_active).length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 pt-0 sm:p-4 sm:pt-0">
      {/* Cards de statistiques */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">Total Catégories</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">Catégories Actives</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{mainCategories} / {subCategories}</div>
            <p className="text-xs text-muted-foreground">Principales / Sous-catégories</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau principal */}
      <Card className="bg-muted/50 flex-1">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>Gestion des Catégories</span>
            {/* Seul l'admin peut créer une catégorie (le fournisseur consulte uniquement) */}
            {canManage && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <CategoryImportButton />
                <Button
                  onClick={() => openModal("create-category-modal")}
                  size="sm"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle catégorie
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
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
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 px-2"
                    >
                      Nom
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("parent")}
                      className="h-8 px-2"
                    >
                      Parent
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("is_active")}
                      className="h-8 px-2"
                    >
                      Statut
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucune catégorie trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        {getParentName(category.parent)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openViewDialog(category)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActivation(category)}>
                                  {category.is_active ? (
                                    <>
                                      <PowerOff className="w-4 h-4 mr-2" />
                                      Désactiver
                                    </>
                                  ) : (
                                    <>
                                      <Power className="w-4 h-4 mr-2" />
                                      Activer
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(category)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
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
              {filteredCategories.length === 0
                ? "Aucune catégorie"
                : `${startIndex + 1}-${Math.min(endIndex, filteredCategories.length)} sur ${
                    filteredCategories.length
                  } catégorie(s)`}
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
                <span className="hidden sm:inline">Suivant</span>
                <span className="sm:hidden">Suiv</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateCategoryModal
        modalId="create-category-modal"
        onConfirm={handleCreate}
        categories={categories}
      />

      <UpdateCategoryModal
        modalId="update-category-modal"
        onConfirm={handleUpdate}
        category={selectedCategory}
        categories={categories}
      />

      <ViewCategoryModal
        modalId="view-category-modal"
        category={selectedCategory}
        getParentName={getParentName}
      />

      <DeleteConfirmationModal
        modalId="delete-category-modal"
        onConfirm={handleDelete}
        title="Supprimer la catégorie"
        description="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."
        itemName={selectedCategory?.name}
        itemDescription={selectedCategory?.description}
      />
    </div>
  );
}
