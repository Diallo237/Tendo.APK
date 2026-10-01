import { useState } from "react";
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
import type { Category, CategoryFormData } from "@/types/category";
import { cn } from "@/lib/utils";
import { BaseModal } from "../shared/base-modal";
import { useModal } from "../shared/modal-provider";




interface CreateCategoryModalProps {
  modalId: string;
  onConfirm: (formData: CategoryFormData) => void;
  categories: Category[];
  isLoading?: boolean;
}

export function CreateCategoryModal({
  modalId,
  onConfirm,
  categories,
  isLoading = false,
}: CreateCategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    parent: null,
    is_active: true,
  });
  const [openParentCombobox, setOpenParentCombobox] = useState(false);
  const [parentValue, setParentValue] = useState<string>("");
  const [messageError, setMessageError] = useState<string>("");

  const { closeModal } = useModal();

  // const [searchQuery, setSearchQuery] = useState('');
  // const debouncedQuery = useDebouncedValue(searchQuery, 300);
  // const { data: searchResults } = useGetCategoriesByName(debouncedQuery);
  // const categories = searchResults?.results || [];
  

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
    resetForm();
    closeModal(modalId);
  };

  return (
    <BaseModal
      modalId={modalId}
      title="Nouvelle catégorie"
      description="Créer une nouvelle catégorie"
      // onConfirm={handleSubmit}
      // onCancel={() => {
      //   resetForm();
      //   closeModal(modalId);
      // }}
      // confirmText="Créer"
      // cancelText="Annuler"
      // confirmVariant="default"
      size="md"
      showFooter={false}
      >
      {/* Contenu du modal */}
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Électronique"
            disabled={isLoading}
            // required
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
                        value="aucune-categorie-racine" // Value textuelle pour la recherche
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
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name.toLowerCase()} // Recherche sur le nom
                          onSelect={() => {
                            // Ne pas utiliser currentValue, utiliser directement category
                            setParentValue(category.id.toString());
                            setFormData({ ...formData, parent: category.id });
                            setOpenParentCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              parentValue === category.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de la catégorie"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_active">Actif</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline"
            type="button"
            onClick={() =>{
              resetForm();
              closeModal(modalId);
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>

          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Création..." : "Créer la catégorie"}
          </Button>
        </div>

      </form>
    </BaseModal>
  );
}
