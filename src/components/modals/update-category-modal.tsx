import { useState, useEffect } from "react";
import { BaseModal } from "@/components/shared/base-modal";
import { useModal } from "@/components/shared/modal-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, CategoryFormData } from "@/types/category";

interface UpdateCategoryModalProps {
  modalId: string;
  onConfirm: (formData: CategoryFormData) => void;
  category: Category | null;
  categories: Category[];
  isLoading?: boolean;
}

export function UpdateCategoryModal({
  modalId,
  onConfirm,
  category,
  categories,
  isLoading = false,
}: UpdateCategoryModalProps) {

  const { closeModal } = useModal();

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    parent: null,
    is_active: true,
  });
  const [openParentCombobox, setOpenParentCombobox] = useState(false);
  const [parentValue, setParentValue] = useState<string>("");
  const [messageError, setMessageError] = useState<string>("");

  // Mise à jour du formulaire quand la catégorie change
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
        is_active: category.is_active,
      });
      setParentValue(category.parent ? category.parent.toString() : "");
    }
  }, [category]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parent: null,
      is_active: true,
    });
    setParentValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setMessageError("Le nom est requis");
      return;
    }
    setMessageError("");
    onConfirm(formData);

    closeModal(modalId);
  };

  const handleCancel = () => {
    resetForm();
    closeModal(modalId);
  };

  return (
    <BaseModal
      modalId={modalId}
      title="Modifier la catégorie"
      description="Modifiez les informations de la catégorie"
      // onConfirm={handleSubmit}
      // onCancel={handleCancel}
      // confirmText={isLoading ? "Modification..." : "Modifier"}
      // cancelText="Annuler"
      size="lg"
      showFooter={false}
    >

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nom *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Électronique"
              disabled={isLoading}
            />
            {messageError && (
              <p className="text-sm text-destructive">{messageError}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Catégorie parente</Label>
            <Popover open={openParentCombobox} onOpenChange={setOpenParentCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openParentCombobox}
                  className="justify-between"
                  disabled={isLoading}
                >
                  {parentValue
                    ? categories.find((cat) => cat.id.toString() === parentValue)?.name
                    : "Aucune (catégorie racine)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher une catégorie..." />
                  <CommandList>
                    <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="aucune-categorie-racine" 
                        onSelect={() => {
                          setParentValue("");
                          setFormData({ ...formData, parent: null });
                          setOpenParentCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            parentValue === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Aucune (catégorie racine)
                      </CommandItem>
                      {categories
                        // .filter(cat => cat.id !== category?.id) // Décommentez si besoin
                        .map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name.toLowerCase()} // Utiliser le nom pour la recherche
                            onSelect={() => {
                              // Utiliser cat.id directement au lieu de currentValue
                              setParentValue(cat.id.toString());
                              setFormData({ ...formData, parent: cat.id });
                              setOpenParentCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                parentValue === cat.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Catégorie d'article d'électronique"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-is_active">Actif</Label>
            <Switch
              id="edit-is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline"
              type="button"
              onClick={() => handleCancel()}
              disabled={isLoading}
            >
              Annuler
            </Button>

            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Modification..." : "Modifier"}
            </Button>
        </div>
        </form>
    </BaseModal>
  );
}
