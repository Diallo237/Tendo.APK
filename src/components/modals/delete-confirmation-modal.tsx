import { AlertTriangle } from "lucide-react";
import { BaseModal } from "@/components/shared/base-modal";
import { useModal } from "@/components/shared/modal-provider";

interface DeleteConfirmationModalProps {
  modalId: string;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDescription?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  /**
   * Encart rouge « Action requise ». À désactiver quand la suppression n'est
   * pas définitive : l'avertissement annonce une action irréversible.
   */
  showWarning?: boolean;
}

export function DeleteConfirmationModal({
  modalId,
  onConfirm,
  title = "Confirmer la suppression",
  description = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  itemName,
  itemDescription,
  isLoading = false,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  showWarning = true,
}: DeleteConfirmationModalProps) {
  const { closeModal } = useModal();
  return (
    <BaseModal
      modalId={modalId}
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={() => closeModal(modalId)}
      confirmText={isLoading ? "Suppression..." : confirmText}
      cancelText={cancelText}
      confirmVariant="destructive"
      showFooter={true}
      size="sm"
    >
      {showWarning && (
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-full bg-destructive/10 h-10 w-10 shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-destructive">
              Action requise
            </h3>
            <p className="text-sm text-muted-foreground">
              Veuillez confirmer cette opération avant de continuer. Cette action est <strong>irréversible</strong>.
            </p>
          </div>
        </div>
      )}

      {(itemName || itemDescription) && (
        <div className="rounded-lg border bg-muted/50 p-4">
          {itemName && (
            <p className="font-medium text-foreground">{itemName}</p>
          )}
          {itemDescription && (
            <p className="text-sm text-muted-foreground mt-1">
              {itemDescription}
            </p>
          )}
        </div>
      )}
    </BaseModal>
  );
}
