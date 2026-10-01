import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/category";
import { BaseModal } from "@/components/shared/base-modal";
import { useModal } from "@/components/shared/modal-provider";

interface ViewCategoryModalProps {
  modalId: string;
  category: Category | null;
  getParentName?: (parentId: number | null) => string;
}

export function ViewCategoryModal({
  modalId,
  category,
  getParentName = (parentId) => parentId ? `ID: ${parentId}` : "-",
}: ViewCategoryModalProps) {
  const { closeModal } = useModal();
  if (!category) return null;

  return (
    <BaseModal
      modalId={modalId}
      title="Détails de la catégorie"
      onCancel={() => closeModal(modalId)}
      cancelText="Fermer"
      // showConfirmButton={false}
      size="lg"
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Nom:</div>
          <div className="col-span-2">{category.name}</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Slug:</div>
          <div className="col-span-2 text-muted-foreground">
            {category.slug}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Description:</div>
          <div className="col-span-2">
            {category.description || "-"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Parent:</div>
          <div className="col-span-2">
            {getParentName(category.parent)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Statut:</div>
          <div className="col-span-2">
            <Badge variant={category.is_active ? "default" : "secondary"}>
              {category.is_active ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Créée le:</div>
          <div className="col-span-2 text-sm">
            {new Date(category.created_at).toLocaleString("fr-FR")}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="font-medium">Modifiée le:</div>
          <div className="col-span-2 text-sm">
            {new Date(category.updated_at).toLocaleString("fr-FR")}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
