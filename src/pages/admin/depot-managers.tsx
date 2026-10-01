import { useState, useEffect } from 'react';
import {
  useAdminUsers,
  useAdminCreateUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminToggleUserActive,
} from '@/services/user.service';
import { useDepots } from '@/services/shipping.service';
import type { AdminUser } from '@/types/user';
import type { Depot } from '@/types/order';
import PageContainer from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRolesDialog } from '@/components/shared/user-roles-dialog';
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
import { toast } from 'sonner';
import { validatePassword } from '@/utils/password';
import { validatePhoneNumber, PHONE_ERROR_MESSAGE } from '@/utils/validate-data';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  EyeOff,
  Pencil,
  ShieldCheck,
  Trash2,
  ToggleLeft,
  Users,
  MapPin,
  Mail,
  Phone,
  Store,
  CalendarDays,
} from 'lucide-react';

const formatDate = (d: string) =>
  new Intl.DateTimeFormat('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : ''}
    >
      {isActive ? 'Actif' : 'Inactif'}
    </Badge>
  );
}

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

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        onSuccess: () => {
          toast.success('Gérant créé avec succès');
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
          <DialogTitle>Ajouter un gérant de dépôt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="gd-email">Email *</Label>
            <Input id="gd-email" type="email" placeholder="email@exemple.com" value={form.email} onChange={set('email')} className={fieldErrors.email ? 'border-destructive' : ''} />
            <FieldError msg={fieldErrors.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gd-password">Mot de passe *</Label>
            <div className="relative">
              <Input id="gd-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} className={`pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FieldError msg={fieldErrors.password} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gd-first">Prénom *</Label>
              <Input id="gd-first" placeholder="Prénom" value={form.first_name} onChange={set('first_name')} className={fieldErrors.first_name ? 'border-destructive' : ''} />
              <FieldError msg={fieldErrors.first_name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gd-last">Nom</Label>
              <Input id="gd-last" placeholder="Nom" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gd-phone">Téléphone</Label>
            <Input id="gd-phone" placeholder="+221 77 000 00 00" value={form.phone} onChange={set('phone')} className={fieldErrors.phone ? 'border-destructive' : ''} />
            <FieldError msg={fieldErrors.phone} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Création...' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onClose,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: update, isPending } = useAdminUpdateUser();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
      });
    }
  }, [user?.id]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!user) return;
    if (form.phone && !validatePhoneNumber(form.phone)) { setPhoneError(PHONE_ERROR_MESSAGE); return; }
    setPhoneError('');
    update(
      { id: user.id, ...form, phone: form.phone || undefined, address: form.address || undefined },
      {
        onSuccess: () => {
          toast.success('Gérant modifié avec succès');
          onClose();
        },
        onError: (err: any) => {
          const p = err?.response?.data?.phone;
          if (p) setPhoneError(Array.isArray(p) ? p[0] : p);
          else toast.error('Erreur lors de la modification');
        },
      }
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier le gérant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gdedit-first">Prénom</Label>
              <Input id="gdedit-first" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gdedit-last">Nom</Label>
              <Input id="gdedit-last" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gdedit-phone">Téléphone</Label>
            <Input id="gdedit-phone" value={form.phone} onChange={(e) => { set('phone')(e); if (phoneError) setPhoneError(''); }} className={phoneError ? 'border-destructive' : ''} />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gdedit-address">Adresse</Label>
            <Input id="gdedit-address" value={form.address} onChange={set('address')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepotManagerDetailSheet({
  user,
  depot,
  open,
  onClose,
  onEdit,
}: {
  user: AdminUser | null;
  depot: Depot | undefined;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-10">
          <SheetTitle>Détail du gérant de dépôt</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">{getInitials(user.full_name)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg truncate">{user.full_name}</p>
              <div className="mt-1">
                <StatusBadge isActive={user.is_active} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <span>{user.address}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Dépôt géré</p>
            {depot ? (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="size-4 text-primary shrink-0" />
                    <p className="font-medium truncate">{depot.name}</p>
                  </div>
                  <Badge
                    variant={depot.is_active ? 'default' : 'secondary'}
                    className={`shrink-0 text-xs ${depot.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : ''}`}
                  >
                    {depot.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                {depot.address && (
                  <p className="text-sm text-muted-foreground">{depot.address}</p>
                )}
                {(depot.commune_name || depot.departement_name) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 shrink-0" />
                    {[depot.commune_name, depot.departement_name].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                <Store className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun dépôt assigné</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span>Membre depuis le {formatDate(user.created_at)}</span>
          </div>

          <Button className="w-full" onClick={() => { onClose(); onEdit(); }}>
            <Pencil className="size-4 mr-2" /> Modifier
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminDepotManagers() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [rolesUser, setRolesUser] = useState<AdminUser | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const { data, isLoading, error } = useAdminUsers('gerant_depot', search || undefined);
  const { data: depots = [] } = useDepots();
  const { mutate: deleteUser } = useAdminDeleteUser();
  const { mutate: toggleActive } = useAdminToggleUserActive();

  const users = data?.results ?? [];

  const getAssignedDepot = (userId: number): Depot | undefined =>
    depots.find((d) => d.manager === userId);

  const handleToggle = (user: AdminUser) => {
    toggleActive(user.id, {
      onSuccess: (res) => toast.success(res.message ?? (res.is_active ? 'Compte activé' : 'Compte désactivé')),
      onError: () => toast.error('Erreur lors du changement de statut'),
    });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id, {
      onSuccess: () => {
        toast.success('Gérant supprimé');
        setDeletingUser(null);
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  return (
    <PageContainer
      title="Gérants de dépôt"
      subtitle="Gérez les comptes gérants de dépôt de la plateforme"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Ajouter un gérant
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive py-8 text-center">Erreur : {error.message}</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Dépôt assigné</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-16 text-center space-y-3">
                      <Users className="size-12 mx-auto text-muted-foreground" />
                      <p className="font-medium">Aucun gérant trouvé</p>
                      <p className="text-sm text-muted-foreground">
                        {search ? 'Modifiez votre recherche.' : 'Ajoutez le premier gérant de dépôt.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const depot = getAssignedDepot(user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {depot ? (
                          <span className="flex items-center gap-1.5">
                            <Store className="size-3.5 text-muted-foreground shrink-0" />
                            {depot.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge isActive={user.is_active} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailUser(user)}>
                              <Eye className="size-4 mr-2" /> Voir détail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Pencil className="size-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRolesUser(user)}>
                              <ShieldCheck className="size-4 mr-2" /> Rôles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(user)}>
                              <ToggleLeft className="size-4 mr-2" />
                              {user.is_active ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="size-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground mt-3">
          {data.count} gérant{data.count !== 1 ? 's' : ''} au total
        </p>
      )}

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
      />

      <UserRolesDialog user={rolesUser} onClose={() => setRolesUser(null)} />

      <DepotManagerDetailSheet
        user={detailUser}
        depot={detailUser ? getAssignedDepot(detailUser.id) : undefined}
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        onEdit={() => detailUser && setEditUser(detailUser)}
      />

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce gérant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte de <strong>{deletingUser?.full_name}</strong> sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
