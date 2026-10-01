import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import {
  PRODUCT_EXPORT_COLUMNS,
  downloadProductsExcel,
} from '@/services/reports.service';

const DEFAULT_COLUMNS = ['name', 'sku', 'category', 'price', 'stock_quantity', 'status'];

interface ProductExportDialogProps {
  open: boolean;
  onClose: () => void;
  /** Vue fournisseur : masque la colonne « Fournisseur ». */
  isSupplierView: boolean;
}

export function ProductExportDialog({ open, onClose, isSupplierView }: ProductExportDialogProps) {
  const columns = PRODUCT_EXPORT_COLUMNS.filter((c) => !(isSupplierView && c.supplierHidden));
  const allKeys = columns.map((c) => c.key);

  const [selected, setSelected] = useState<string[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(false);

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const allSelected = allKeys.every((k) => selected.includes(k));
  const toggleAll = () => setSelected(allSelected ? [] : allKeys);

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins une colonne.');
      return;
    }
    setLoading(true);
    try {
      // Exporter dans l'ordre du registre, pas dans l'ordre de sélection
      await downloadProductsExcel(allKeys.filter((k) => selected.includes(k)));
      toast.success('Export Excel généré.');
      onClose();
    } catch {
      toast.error("Échec de l'export Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Exporter les produits
          </DialogTitle>
          <DialogDescription>
            Choisissez les colonnes à inclure dans le fichier Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-primary hover:underline mb-2"
          >
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>

          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {columns.map((c) => {
              const checked = selected.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggle(c.key)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm text-left transition-colors ${
                    checked
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span
                    className={`shrink-0 size-4 rounded border flex items-center justify-center ${
                      checked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    }`}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={loading || selected.length === 0}>
            {loading ? (
              <FileSpreadsheet className="size-4 animate-pulse" />
            ) : (
              <Download className="size-4" />
            )}
            Exporter ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
