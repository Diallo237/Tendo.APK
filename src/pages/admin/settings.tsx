import { useState, useRef } from 'react';
import { useUser } from '@/contexts/user-context';
import { useUpdateProfile, useChangePassword, usePlatformSettings, useUpdatePlatformSettings } from '@/services/user.service';
import PageContainer from '@/components/shared/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle2, Building2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { validatePhoneNumber, PHONE_ERROR_MESSAGE } from '@/utils/validate-data';

function parseDRFErrors(err: any): Record<string, string> {
  const data = err?.response?.data ?? err?.details ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
  }
  return out;
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useUser();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (form.phone && !validatePhoneNumber(form.phone)) {
      setErrors({ phone: PHONE_ERROR_MESSAGE });
      return;
    }
    updateProfile(form, {
      onSuccess: () => {
        toast.success('Profil mis à jour');
        setSaved(true);
      },
      onError: (err: any) => {
        const fe = parseDRFErrors(err);
        if (Object.keys(fe).length) setErrors(fe);
        else toast.error(err?.message ?? 'Erreur lors de la mise à jour');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="size-5" />
          <CardTitle>Informations personnelles</CardTitle>
        </div>
        <CardDescription>Mettez à jour votre nom et votre téléphone</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Prénom</Label>
              <Input id="first_name" value={form.first_name} onChange={set('first_name')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" value={form.last_name} onChange={set('last_name')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+221 7X XXX XX XX" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin mr-2" />Enregistrement...</> : 'Enregistrer'}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" /> Enregistré
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Password section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const { mutate: changePassword, isPending } = useChangePassword();

  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState({ current: false, newp: false, confirm: false });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const toggle = (field: 'current' | 'newp' | 'confirm') =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.current_password) errs.current_password = 'Mot de passe actuel requis';
    if (form.new_password.length < 8) errs.new_password = 'Minimum 8 caractères';
    if (form.new_password !== form.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    changePassword(
      { current_password: form.current_password, new_password: form.new_password },
      {
        onSuccess: () => {
          toast.success('Mot de passe modifié avec succès');
          setForm({ current_password: '', new_password: '', confirm: '' });
          setErrors({});
        },
        onError: (err: any) => {
          const fe = parseDRFErrors(err);
          if (Object.keys(fe).length) setErrors(fe);
          else toast.error(err?.message ?? 'Erreur lors du changement de mot de passe');
        },
      }
    );
  };

  const PasswordInput = ({
    id, label, field, showKey,
  }: { id: string; label: string; field: keyof typeof form; showKey: 'current' | 'newp' | 'confirm' }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show[showKey] ? 'text' : 'password'}
          value={form[field]}
          onChange={set(field)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => toggle(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show[showKey] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5" />
          <CardTitle>Changer le mot de passe</CardTitle>
        </div>
        <CardDescription>Saisissez votre mot de passe actuel puis le nouveau</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput id="current_password" label="Mot de passe actuel" field="current_password" showKey="current" />
          <Separator />
          <PasswordInput id="new_password" label="Nouveau mot de passe" field="new_password" showKey="newp" />
          <PasswordInput id="confirm" label="Confirmer le nouveau mot de passe" field="confirm" showKey="confirm" />

          <Button type="submit" disabled={isPending} className="mt-1">
            {isPending ? <><Loader2 className="size-4 animate-spin mr-2" />Modification...</> : 'Changer le mot de passe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Company section ───────────────────────────────────────────────────────────

function CompanySection() {
  const { data: current, isLoading } = usePlatformSettings();
  const { mutate: update, isPending } = useUpdatePlatformSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: '', ninea: '', address: '', phone: '', email: '', website: '' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialise le formulaire quand les données arrivent
  const [initialized, setInitialized] = useState(false);
  if (current && !initialized) {
    setForm({
      name:    current.name    ?? '',
      ninea:   current.ninea   ?? '',
      address: current.address ?? '',
      phone:   current.phone   ?? '',
      email:   current.email   ?? '',
      website: current.website ?? '',
    });
    setInitialized(true);
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoRemoved(false);
    setSaved(false);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
    if (fileRef.current) fileRef.current.value = '';
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append('logo', logoFile);
    else if (logoRemoved) fd.append('remove_logo', 'true');

    update(fd, {
      onSuccess: () => { toast.success('Paramètres entreprise mis à jour'); setSaved(true); },
      onError: (err: any) => {
        const fe = parseDRFErrors(err);
        if (Object.keys(fe).length) setErrors(fe);
        else toast.error(err?.message ?? 'Erreur lors de la mise à jour');
      },
    });
  };

  const displayLogo = logoPreview ?? current?.logo;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="size-5" />
          <CardTitle>Paramètres entreprise</CardTitle>
        </div>
        <CardDescription>Informations utilisées sur les factures et documents officiels</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
                  {displayLogo ? (
                    <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                    <ImagePlus className="size-4" /> Choisir un logo
                  </Button>
                  {displayLogo && (
                    <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={removeLogo}>
                      <X className="size-4" /> Supprimer
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG — recommandé 200×200 px</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="co-name">Nom de l'entreprise *</Label>
                <Input id="co-name" value={form.name} onChange={set('name')} placeholder="Tendo" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-ninea">NINEA</Label>
                <Input id="co-ninea" value={form.ninea} onChange={set('ninea')} placeholder="00000000000" />
                {errors.ninea && <p className="text-xs text-destructive">{errors.ninea}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="co-address">Adresse</Label>
              <Input id="co-address" value={form.address} onChange={set('address')} placeholder="Dakar, Sénégal" />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="co-phone">Téléphone</Label>
                <Input id="co-phone" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 00 00" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-email">Email de contact</Label>
                <Input id="co-email" type="email" value={form.email} onChange={set('email')} placeholder="contact@tendo.sn" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="co-website">Site web</Label>
              <Input id="co-website" value={form.website} onChange={set('website')} placeholder="https://tendo.sn" />
              {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="size-4 animate-spin mr-2" />Enregistrement...</> : 'Enregistrer'}
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="size-4" /> Enregistré
                </span>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <PageContainer title="Paramètres" subtitle="Gérez votre compte administrateur">
      <div className="space-y-6">
        <CompanySection />
        <ProfileSection />
        <PasswordSection />
      </div>
    </PageContainer>
  );
}
