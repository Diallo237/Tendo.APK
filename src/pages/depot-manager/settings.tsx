import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { useDepots, useDepotShipments } from '@/services/shipping.service';
import { useUpdateProfile, useChangePassword } from '@/services/user.service';
import PageContainer from '@/components/shared/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Phone,
  MapPin,
  Store,
  Package,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  Truck,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Info,
} from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] ?? '';
  const l = lastName.trim()[0] ?? '';
  return (f + l).toUpperCase();
}

// ── sub-components ────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="bg-background rounded-xl border p-5 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-52" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-background rounded-xl border p-4 space-y-2">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  isLoading: boolean;
}

function StatCard({ label, value, icon, iconBg, isLoading }: StatCardProps) {
  return (
    <div className="bg-background rounded-xl border p-4 flex items-center gap-3">
      <div className={`shrink-0 rounded-xl p-2.5 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-10 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DepotManagerSettings() {
  const { user } = useUser();
  const { data: depots = [], isLoading: depotsLoading } = useDepots();
  const { data: shipmentsData, isLoading: shipmentsLoading } = useDepotShipments();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [form, setForm] = useState({ first_name: '', last_name: '' });
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name ?? '', last_name: user.last_name ?? '' });
    }
  }, [user?.id]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form, {
      onSuccess: () => toast.success('Profil mis à jour.'),
      onError: () => toast.error('Erreur lors de la mise à jour.'),
    });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwdForm.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    changePassword.mutate(
      { current_password: pwdForm.current_password, new_password: pwdForm.new_password },
      {
        onSuccess: () => {
          toast.success('Mot de passe modifié.');
          setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
        },
        onError: (err: any) => {
          const detail =
            err?.response?.data?.current_password?.[0] ??
            err?.response?.data?.detail ??
            'Erreur lors du changement de mot de passe.';
          toast.error(detail);
        },
      },
    );
  };

  const shipments = shipmentsData?.shipments ?? [];

  // ── Find manager's depot ──────────────────────────────────────────────────
  const myDepot = user ? depots.find((d) => d.manager === user.id) ?? null : null;

  // ── Shipment stats ────────────────────────────────────────────────────────
  const totalShipments = shipments.length;
  const deliveredShipments = shipments.filter((s) => s.status === 'delivered').length;
  const returnedShipments = shipments.filter((s) => s.status === 'returned').length;

  // ── Location label ────────────────────────────────────────────────────────
  const userLocation = [user?.commune_name, user?.departement_name, user?.region_name]
    .filter(Boolean)
    .join(', ');

  const depotLocation = myDepot
    ? [myDepot.commune_name, myDepot.departement_name, myDepot.region_name]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <PageContainer
      title="Mon compte"
      subtitle="Gérez vos informations personnelles et votre dépôt"
    >
      <div className="space-y-6">

        {/* ── Edit profile ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5" />
              <CardTitle>Informations personnelles</CardTitle>
            </div>
            <CardDescription>Modifiez votre prénom et nom de famille.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom de famille</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    Email
                  </Label>
                  <Input value={user?.email ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Téléphone
                  </Label>
                  <Input value={user?.phone ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 text-sm text-blue-700 dark:text-blue-400">
                <Info className="size-4 shrink-0 mt-0.5" />
                <span>L'email et le téléphone ne peuvent être modifiés que par un administrateur.</span>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Password ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="size-5" />
              <CardTitle>Changer le mot de passe</CardTitle>
            </div>
            <CardDescription>Minimum 8 caractères.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_pwd">Mot de passe actuel</Label>
                <PasswordInput id="current_pwd" value={pwdForm.current_password} onChange={(v) => setPwdForm({ ...pwdForm, current_password: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_pwd">Nouveau mot de passe</Label>
                <PasswordInput id="new_pwd" value={pwdForm.new_password} onChange={(v) => setPwdForm({ ...pwdForm, new_password: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_pwd">Confirmer</Label>
                <PasswordInput id="confirm_pwd" value={pwdForm.confirm_password} onChange={(v) => setPwdForm({ ...pwdForm, confirm_password: v })} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Modification...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Profile section ────────────────────────────────────────────── */}
        {!user ? (
          <ProfileSkeleton />
        ) : (
          <div className="bg-background rounded-xl border p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Avatar */}
              <div className="shrink-0 size-16 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center">
                <span className="text-xl font-bold text-teal-700 dark:text-teal-300">
                  {getInitials(user.first_name, user.last_name)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{user.full_name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400">
                    Gérant de dépôt
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{user.email}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {user.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0" />
                      {user.phone}
                    </span>
                  )}
                  {userLocation && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {userLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Mon dépôt section ──────────────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-base">Mon dépôt</h2>

          {depotsLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </div>
          ) : myDepot === null ? (
            <div className="py-8 text-center space-y-2">
              <Store className="size-10 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Aucun dépôt assigné</p>
              <p className="text-xs text-muted-foreground">
                Contactez l'administrateur pour être assigné à un dépôt.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="shrink-0 size-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                <Store className="size-5 text-orange-600" />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-base">{myDepot.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    myDepot.is_active
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    <CheckCircle2 className="size-3 mr-1" />
                    {myDepot.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {myDepot.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {myDepot.address}
                    </p>
                  )}
                  {depotLocation && (
                    <p className="text-xs">{depotLocation}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Activité section ───────────────────────────────────────────── */}
        <div className="bg-background rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-base">Activité du dépôt</h2>

          {shipmentsLoading ? (
            <ActivitySkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total colis"
                value={totalShipments}
                icon={<Truck className="size-4 text-blue-600" />}
                iconBg="bg-blue-100 dark:bg-blue-950/40"
                isLoading={false}
              />
              <StatCard
                label="Récupérés"
                value={deliveredShipments}
                icon={<PackageCheck className="size-4 text-emerald-600" />}
                iconBg="bg-emerald-100 dark:bg-emerald-950/40"
                isLoading={false}
              />
              <StatCard
                label="Retournés"
                value={returnedShipments}
                icon={<RotateCcw className="size-4 text-red-600" />}
                iconBg="bg-red-100 dark:bg-red-950/40"
                isLoading={false}
              />
            </div>
          )}

          {!shipmentsLoading && totalShipments === 0 && (
            <div className="py-6 text-center space-y-2">
              <Package className="size-9 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun colis enregistré pour ce dépôt.</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
