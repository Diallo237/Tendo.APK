import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepots, useCreateDepot, useUpdateDepot, useDeleteDepot } from '@/services/shipping.service';
import type { DepotPayload } from '@/services/shipping.service';
import { useDepotManagers, useAdminCreateUser } from '@/services/user.service';
import type { DepotManager } from '@/services/user.service';
import type { Depot } from '@/types/order';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LocalisationSelect } from '@/components/shared/localisation-select';
import type { Localite } from '@/services/localisation.service';
import { Plus, Pencil, Trash2, MapPin, User, Phone, Store, UserPlus, Eye, EyeOff, Search } from 'lucide-react';
import { validatePassword } from '@/utils/password';
import { validatePhoneNumber, PHONE_ERROR_MESSAGE } from '@/utils/validate-data';
import { toast } from 'sonner';

function parseDRFErrors(err: any): Record<string, string> {
  const data = err?.response?.data ?? err?.details;
  if (!data || typeof data !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(data)) {
    out[key] = Array.isArray(val) ? (val[0] as string) : String(val);
  }
  return out;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function CreateManagerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (manager: { id: number; full_name: string; phone: string | null; email: string }) => void;
}) {
  const { mutate: create, isPending } = useAdminCreateUser();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!form.email) errors.email = 'L\'email est requis.';
    const pwdErr = validatePassword(form.password);
    if (pwdErr) errors.password = pwdErr;
    if (!form.first_name) errors.first_name = 'Le prénom est requis.';
    if (form.phone && !validatePhoneNumber(form.phone)) errors.phone = PHONE_ERROR_MESSAGE;
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    create(
      { ...form, role: 'gerant_depot', phone: form.phone || undefined, last_name: form.last_name || undefined },
      {
        onSuccess: (user) => {
          toast.success('Gérant créé avec succès');
          onCreated({ id: user.id, full_name: user.full_name, phone: user.phone ?? null, email: user.email });
          setForm({ email: '', password: '', first_name: '', last_name: '', phone: '' });
          setFieldErrors({});
          onClose();
        },
        onError: (err) => {
          const errors = parseDRFErrors(err);
          if (Object.keys(errors).length) {
            setFieldErrors(errors);
          } else {
            toast.error('Erreur lors de la création du gérant');
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Nouveau gérant de dépôt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="mgr-email">Email *</Label>
            <Input id="mgr-email" type="email" placeholder="email@exemple.com" value={form.email} onChange={set('email')} className={fieldErrors.email ? 'border-destructive' : ''} />
            <FieldError msg={fieldErrors.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mgr-password">Mot de passe *</Label>
            <div className="relative">
              <Input id="mgr-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} className={`pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FieldError msg={fieldErrors.password} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mgr-first">Prénom *</Label>
              <Input id="mgr-first" placeholder="Prénom" value={form.first_name} onChange={set('first_name')} className={fieldErrors.first_name ? 'border-destructive' : ''} />
              <FieldError msg={fieldErrors.first_name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgr-last">Nom</Label>
              <Input id="mgr-last" placeholder="Nom" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mgr-phone">Téléphone</Label>
            <Input id="mgr-phone" placeholder="+221 77 000 00 00" value={form.phone} onChange={set('phone')} className={fieldErrors.phone ? 'border-destructive' : ''} />
            <FieldError msg={fieldErrors.phone} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Création...' : 'Créer le gérant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LocationState {
  region: Localite | null;
  departement: Localite | null;
  commune: Localite | null;
}

const emptyLocation: LocationState = { region: null, departement: null, commune: null };

interface DepotForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

function emptyForm(depot?: Depot | null): DepotForm {
  return {
    name: depot?.name ?? '',
    address: depot?.address ?? '',
    latitude: depot?.latitude ?? '',
    longitude: depot?.longitude ?? '',
  };
}

function DepotFormDialog({
  open,
  onClose,
  depot,
}: {
  open: boolean;
  onClose: () => void;
  depot: Depot | null;
}) {
  const isEdit = depot !== null;
  const [form, setForm] = useState<DepotForm>(() => emptyForm(depot));
  const [location, setLocation] = useState<LocationState>(emptyLocation);
  const [managerId, setManagerId] = useState<number | null>(depot?.manager ?? null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [createManagerOpen, setCreateManagerOpen] = useState(false);
  const { data: managersData } = useDepotManagers();
  const [extraManagers, setExtraManagers] = useState<DepotManager[]>([]);
  const managers = [...(managersData?.results ?? []), ...extraManagers.filter(
    em => !(managersData?.results ?? []).some(m => m.id === em.id)
  )];

  // Reset form when depot changes (switching between create / edit)
  useEffect(() => {
    setForm(emptyForm(depot));
    setLocation(emptyLocation);
    setManagerId(depot?.manager ?? null);
  }, [depot, open]);

  // When commune changes, auto-fill lat/lon only if fields are empty
  useEffect(() => {
    if (location.commune) {
      const { latitude, longitude } = location.commune;
      setForm(prev => ({
        ...prev,
        latitude: prev.latitude || (latitude ?? ''),
        longitude: prev.longitude || (longitude ?? ''),
      }));
    }
  }, [location.commune]);

  const { mutate: create, isPending: creating } = useCreateDepot();
  const { mutate: update, isPending: updating } = useUpdateDepot();
  const isPending = creating || updating;

  const handleChange = (field: keyof DepotForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Le nom du dépôt est obligatoire');
      return;
    }
    const communeId = location.commune?.id ?? depot?.commune ?? null;
    if (!communeId) {
      toast.error('Veuillez sélectionner une commune');
      return;
    }

    const payload: DepotPayload = {
      name: form.name.trim(),
      address: form.address.trim(),
      commune: communeId,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      manager: managerId,
    };

    if (isEdit && depot) {
      update(
        { id: depot.id, ...payload },
        {
          onSuccess: () => { toast.success('Dépôt mis à jour'); onClose(); },
          onError: () => toast.error('Erreur lors de la mise à jour'),
        }
      );
    } else {
      create(payload, {
        onSuccess: () => { toast.success('Dépôt créé'); onClose(); },
        onError: () => toast.error('Erreur lors de la création'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            {isEdit ? 'Modifier le dépôt' : 'Nouveau dépôt'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="depot-name">Nom du dépôt *</Label>
            <Input
              id="depot-name"
              placeholder="Ex: Dépôt de Thiès Centre"
              value={form.name}
              onChange={handleChange('name')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Commune *</Label>
            <LocalisationSelect
              onLocationChange={setLocation}
              initialRegionId={depot?.region_id}
              initialDepartementId={depot?.departement_id}
              initialCommuneId={depot?.commune}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="depot-address">Adresse détaillée</Label>
            <Input
              id="depot-address"
              placeholder="Quartier, rue..."
              value={form.address}
              onChange={handleChange('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="depot-lat">
                Latitude
                <span className="text-xs text-muted-foreground ml-1">(auto depuis commune)</span>
              </Label>
              <Input
                id="depot-lat"
                type="number"
                step="any"
                placeholder="14.6937"
                value={form.latitude}
                onChange={handleChange('latitude')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depot-lon">
                Longitude
                <span className="text-xs text-muted-foreground ml-1">(auto depuis commune)</span>
              </Label>
              <Input
                id="depot-lon"
                type="number"
                step="any"
                placeholder="-17.4441"
                value={form.longitude}
                onChange={handleChange('longitude')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Gérant du dépôt</Label>
            <div className="flex gap-2">
              <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal min-w-0">
                    <span className="truncate">
                      {managerId
                        ? (managers.find(m => m.id === managerId)?.full_name ?? 'Gérant introuvable')
                        : <span className="text-muted-foreground">Sélectionner un gérant (optionnel)</span>
                      }
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un gérant..." />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>Aucun gérant trouvé.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setManagerId(null); setManagerOpen(false); }}>
                          <Check className={cn('mr-2 size-4 shrink-0', managerId === null ? 'opacity-100' : 'opacity-0')} />
                          <span className="text-muted-foreground">Aucun gérant</span>
                        </CommandItem>
                        {managers.map((m: DepotManager) => (
                          <CommandItem
                            key={m.id}
                            value={m.full_name}
                            onSelect={() => { setManagerId(m.id); setManagerOpen(false); }}
                          >
                            <Check className={cn('mr-2 size-4 shrink-0', managerId === m.id ? 'opacity-100' : 'opacity-0')} />
                            <div>
                              <p className="text-sm">{m.full_name}</p>
                              {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                size="icon"
                variant="outline"
                title="Créer un nouveau gérant"
                onClick={() => setCreateManagerOpen(true)}
              >
                <UserPlus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CreateManagerDialog
        open={createManagerOpen}
        onClose={() => setCreateManagerOpen(false)}
        onCreated={(mgr) => {
          setExtraManagers((prev) => [...prev, mgr]);
          setManagerId(mgr.id);
        }}
      />
    </Dialog>
  );
}

function DepotCard({ depot, onEdit, onDelete }: { depot: Depot; onEdit: () => void; onDelete: () => void }) {
  const location = [depot.commune_name, depot.departement_name, depot.region_name].filter(Boolean).join(', ');

  return (
    <div className="bg-background rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="size-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{depot.name}</p>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 shrink-0" />
                {location}
              </p>
            )}
            {depot.address && (
              <p className="text-xs text-muted-foreground mt-0.5">{depot.address}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={depot.is_active ? 'default' : 'secondary'} className="text-xs">
            {depot.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </div>

      {(depot.manager_name || depot.manager_phone) && (
        <>
          <Separator />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {depot.manager_name && (
              <span className="flex items-center gap-1"><User className="size-3" /> {depot.manager_name}</span>
            )}
            {depot.manager_phone && (
              <span className="flex items-center gap-1"><Phone className="size-3" /> {depot.manager_phone}</span>
            )}
          </div>
        </>
      )}

      <Separator />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
          <Pencil className="size-3.5" /> Modifier
        </Button>
        <Button size="sm" variant="destructive" className="gap-1.5" onClick={onDelete}>
          <Trash2 className="size-3.5" /> Supprimer
        </Button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 12;

function PageControls({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); if (page > 1) onPage(page - 1); }}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); onPage(p); }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); if (page < totalPages) onPage(page + 1); }}
            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default function Depots() {
  const { data: depots = [], isLoading } = useDepots();
  const { mutate: deleteDepot } = useDeleteDepot();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [deletingDepot, setDeletingDepot] = useState<Depot | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Filtrage par nom de dépôt, gérant ou localité
  const query = search.trim().toLowerCase();
  const filtered = query
    ? depots.filter((d) =>
        d.name.toLowerCase().includes(query) ||
        (d.manager_name?.toLowerCase().includes(query) ?? false) ||
        (d.commune_name?.toLowerCase().includes(query) ?? false) ||
        (d.departement_name?.toLowerCase().includes(query) ?? false) ||
        (d.region_name?.toLowerCase().includes(query) ?? false) ||
        (d.city?.toLowerCase().includes(query) ?? false),
      )
    : depots;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Revenir à la page 1 quand la recherche change
  useEffect(() => { setPage(1); }, [search]);

  const handleEdit = (depot: Depot) => { setEditingDepot(depot); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setEditingDepot(null); };

  const handleConfirmDelete = () => {
    if (!deletingDepot) return;
    deleteDepot(deletingDepot.id, {
      onSuccess: () => { toast.success('Dépôt supprimé'); setDeletingDepot(null); },
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  return (
    <PageContainer title="Dépôts" subtitle="Points relais de livraison">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par dépôt, gérant ou localité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setEditingDepot(null); setFormOpen(true); }}>
          <Plus className="size-4" /> Nouveau dépôt
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : depots.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Store className="size-14 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">Aucun dépôt</h3>
          <p className="text-sm text-muted-foreground">Créez le premier point relais de livraison.</p>
          <Button className="gap-2 mt-2" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Créer un dépôt
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Search className="size-14 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground">Aucun dépôt ne correspond à votre recherche.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {filtered.length} dépôt{filtered.length > 1 ? 's' : ''}
            {totalPages > 1 ? ` · page ${currentPage}/${totalPages}` : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((depot) => (
              <DepotCard
                key={depot.id}
                depot={depot}
                onEdit={() => handleEdit(depot)}
                onDelete={() => setDeletingDepot(depot)}
              />
            ))}
          </div>
          <PageControls page={currentPage} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <DepotFormDialog open={formOpen} onClose={handleCloseForm} depot={editingDepot} />

      <AlertDialog open={!!deletingDepot} onOpenChange={() => setDeletingDepot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dépôt ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dépôt <strong>{deletingDepot?.name}</strong> sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
