import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown, Upload, X } from "lucide-react";
import type { Category } from "@/types/category";
import type { Product, ProductVariantDraft } from "@/types/product";
import { VariantEditor } from "../shared/variant-editor";
import { validerDeclinaisons } from "@/helpers/product-variants";
import { cn } from "@/lib/utils";
import { BaseModal } from "../shared/base-modal";
import { useModal } from "../shared/modal-provider";
import { useGetAllCategories } from "@/services/category.service";
import { useGetSuppliers } from "@/services/user.service";
import type { Users } from "@/types/user";
import { useAddProductImage } from "@/services/product.service";
import { toast } from "sonner";
import { stockDesDeclinaisons } from '@/helpers/product-variants';

interface UpdateProductModalProps {
  modalId: string;
  onConfirm: (formData: any) => void;
  product: Product | null;
  isLoading?: boolean;
  isSupplierView?: boolean;
}

export function UpdateProductModal({
  modalId,
  onConfirm,
  product,
  isLoading = false,
  isSupplierView = false,
}: UpdateProductModalProps) {
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    description: "",
    price: "",
    stock_quantity: 0,
    category: null as number | null,
    supplier: null as number | null,
    weight: "",
    unite: 'unit' as 'kg' | 'g' | 'lb' | 'oz' | 'l' | 'ml' | 'unit',
    is_active: true,
    status: 'draft' as 'draft' | 'pending' | 'approved' | 'rejected',
  });
  
  const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [openSupplierCombobox, setOpenSupplierCombobox] = useState(false);
  const [supplierValue, setSupplierValue] = useState<string>("");
  const [messageError, setMessageError] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariantDraft[]>([]);

  // Dès qu'il y a des déclinaisons, le stock du produit en est la somme.
  const aDesDeclinaisons = variants.length > 0;
  const stockDeclinaisons = stockDesDeclinaisons(variants);

  const { closeModal } = useModal();
  const { data: categoriesData } = useGetAllCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.results || [];
  // Le sélecteur de fournisseur n'existe que pour l'admin
  const { data: suppliersData } = useGetSuppliers(!isSupplierView);
  const suppliers = Array.isArray(suppliersData) ? suppliersData : (suppliersData as any)?.results || [];
  
  const { mutateAsync: addProductImage } = useAddProductImage();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limiter à 5 images maximum
    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);

    // Générer les prévisualisations
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Libérer l'URL de la prévisualisation
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Initialiser le formulaire avec les données du produit
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock_quantity: product.stock_quantity,
        category: product.category || null,
        supplier: product.supplier || null,
        weight: product.weight || "",
        unite: product.unite || 'unit',
        is_active: product.is_active,
        status: product.status,
      });
      setCategoryValue(product.category?.toString() || "");
      setSupplierValue(product.supplier?.toString() || "");
      setVariants(
        (product.variants ?? []).map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock_quantity: v.stock_quantity,
          is_active: v.is_active,
        }))
      );
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setMessageError("Le nom est requis");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setMessageError("Le prix doit être supérieur à 0");
      return;
    }
    
    const erreurDeclinaisons = validerDeclinaisons(variants);
    if (erreurDeclinaisons) {
      setMessageError(erreurDeclinaisons);
      return;
    }

    setMessageError("");

    // Préparer les données pour l'API. La liste est envoyée même vide : c'est
    // ainsi qu'on supprime toutes les déclinaisons d'un produit qui en avait.
    const dataToSend: any = { ...formData, variants };
    if (aDesDeclinaisons) {
      dataToSend.stock_quantity = stockDeclinaisons;
    }

    // Ne pas envoyer weight et unite si weight est vide
    if (!formData.weight || formData.weight.toString().trim() === "") {
      delete dataToSend.weight;
      delete dataToSend.unite;
    }
    
    try {
      onConfirm(dataToSend);
      
      // Si des images sont sélectionnées, les uploader
      if (imageFiles.length > 0 && product) {
        toast.info(`Upload de ${imageFiles.length} image(s) en cours...`);
        
        // Uploader chaque image une par une
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const imageFormData = new FormData();
          imageFormData.append('image', file);
          imageFormData.append('product', product.id.toString());
          imageFormData.append('is_primary', 'false');
          
          console.log('Uploading image:', {
            file: file.name,
            product: product.id,
            is_primary: false
          });
          
          try {
            await addProductImage(imageFormData);
          } catch (error) {
            console.error(`Erreur lors de l'upload de l'image ${i + 1}:`, error);
            toast.error(`Erreur lors de l'upload de l'image ${i + 1}`);
          }
        }
        
        toast.success(`Produit modifié avec ${imageFiles.length} nouvelle(s) image(s)`);
      }
      
      closeModal(modalId);
    } catch (error) {
      console.error("Erreur lors de la modification du produit:", error);
      toast.error("Erreur lors de la modification du produit");
    }
  };

  if (!product) return null;

  return (
    <BaseModal
      modalId={modalId}
      title="Modifier le produit"
      description={`Modification de "${product.name}"`}
      size="extraLarge"
      showFooter={false}
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-4">
        {/* Section 1: Informations de base */}
        <div className="space-y-3">
          {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informations générales</h3> */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: MacBook Pro 14"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Prix (XOF) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="25000"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le produit..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Section 2: Stock et Catégorisation */}
        <div className="space-y-3">
          {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stock et Catégorisation</h3> */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stock_quantity">Stock *</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={aDesDeclinaisons ? stockDeclinaisons : formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                placeholder="100"
                disabled={isLoading || aDesDeclinaisons}
                readOnly={aDesDeclinaisons}
              />
              {aDesDeclinaisons && (
                <p className="text-xs text-muted-foreground">
                  Calculé à partir des tailles et couleurs ci-dessous.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategoryCombobox}
                    className="justify-between"
                    disabled={isLoading}
                  >
                    {categoryValue
                      ? categories.find((cat: Category) => cat.id.toString() === categoryValue)?.name || product?.category_name || `Catégorie #${categoryValue}`
                      : "Sélectionner une catégorie"}
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
                          value="aucune-categorie"
                          onSelect={() => {
                            setCategoryValue("");
                            setFormData({ ...formData, category: null });
                            setOpenCategoryCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              categoryValue === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Aucune catégorie
                        </CommandItem>
                        {categories.map((category: Category) => (
                          <CommandItem
                            key={category.id}
                            value={`${category.id}-${category.name}`}
                            onSelect={() => {
                              setCategoryValue(category.id.toString());
                              setFormData({ ...formData, category: category.id });
                              setOpenCategoryCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                categoryValue === category.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
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
          </div>

          {!isSupplierView && (
            <div className="grid gap-2">
              <Label>Fournisseur</Label>
              <Popover open={openSupplierCombobox} onOpenChange={setOpenSupplierCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupplierCombobox}
                    className="justify-between"
                    disabled={isLoading}
                  >
                    {supplierValue
                      ? (() => {
                          const supplier = suppliers.find((sup: Users) => sup.id.toString() === supplierValue);
                          return supplier ? `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() || product?.supplier_name || `Fournisseur #${supplierValue}` : product?.supplier_name || `Fournisseur #${supplierValue}`;
                        })()
                      : "Sélectionner un fournisseur"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un fournisseur..." />
                  <CommandList>
                    <CommandEmpty>Aucun fournisseur trouvé.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="aucun-fournisseur"
                        onSelect={() => {
                          setSupplierValue("");
                          setFormData({ ...formData, supplier: null });
                          setOpenSupplierCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            supplierValue === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Aucun fournisseur
                      </CommandItem>
                      {suppliers.map((supplier: Users) => (
                        <CommandItem
                          key={supplier.id}
                          value={`${supplier.id}-${supplier.first_name}-${supplier.last_name}`}
                          onSelect={() => {
                            setSupplierValue(supplier.id.toString());
                            setFormData({ ...formData, supplier: supplier.id });
                            setOpenSupplierCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              supplierValue === supplier.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {supplier.first_name} {supplier.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            </div>
          )}
        </div>

        {/* Section 2 bis: Déclinaisons taille / couleur */}
        <div className="rounded-lg border p-3">
          <VariantEditor variants={variants} onChange={setVariants} disabled={isLoading} />
        </div>

        {/* Section 3: Poids et Dimensions */}
        <div className="space-y-3">
          {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Poids et Dimensions</h3> */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weight">Poids</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="1.5"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unite">Unité</Label>
              <Select
                value={formData.unite}
                onValueChange={(value: any) => setFormData({ ...formData, unite: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unité</SelectItem>
                  <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                  <SelectItem value="g">Gramme (g)</SelectItem>
                  <SelectItem value="lb">Livre (lb)</SelectItem>
                  <SelectItem value="oz">Once (oz)</SelectItem>
                  <SelectItem value="l">Litre (l)</SelectItem>
                  <SelectItem value="ml">Millilitre (ml)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section 4: Images du produit */}
        <div className="space-y-3">
          {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Images du produit</h3> */}
          <div className="space-y-3">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {imageFiles.length < 5 && (
              <div>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <Label
                  htmlFor="images"
                  className="flex items-center justify-center gap-2 h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour ajouter des images (max 5)
                  </span>
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Statut et Visibilité */}
        <div className="space-y-3">
          {/* <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Statut et Visibilité</h3> */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  {!isSupplierView && (
                    <>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Produit actif</Label>
                <div className="text-sm text-muted-foreground">
                  Le produit sera visible dans le catalogue
                </div>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {messageError && (
          <p className="text-sm text-destructive">{messageError}</p>
        )}
      </form>

      {/* Boutons de pied de page */}
      <div className="border-t pt-4 mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal(modalId)}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button 
          onClick={() => {
            const form = document.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }} 
          disabled={isLoading}
        >
          {isLoading ? "Modification..." : "Modifier"}
        </Button>
      </div>
    </BaseModal>
  );
}
