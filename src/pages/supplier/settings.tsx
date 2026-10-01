import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { useUpdateProfile, useChangePassword } from '@/services/user.service';
import PageContainer from '@/components/shared/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Lock, User, Mail, Phone, Info } from 'lucide-react';
import { toast } from 'sonner';
import { CommissionGridCard } from '@/components/shared/commission-grid-card';

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

export default function SupplierSettings() {
  const { user } = useUser();
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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form, {
      onSuccess: () => toast.success('Profil mis à jour.'),
      onError: () => toast.error('Erreur lors de la mise à jour.'),
    });
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
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
          toast.success('Mot de passe modifié avec succès.');
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

  return (
    <PageContainer title="Mon compte" subtitle="Gérez vos informations personnelles et votre mot de passe">
      <div className="space-y-6">

        {/* Informations personnelles */}
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

              {/* Email et téléphone en lecture seule */}
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

        {/* Changer le mot de passe */}
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
                <Label htmlFor="current_password">Mot de passe actuel</Label>
                <PasswordInput
                  id="current_password"
                  value={pwdForm.current_password}
                  onChange={(v) => setPwdForm({ ...pwdForm, current_password: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <PasswordInput
                  id="new_password"
                  value={pwdForm.new_password}
                  onChange={(v) => setPwdForm({ ...pwdForm, new_password: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                <PasswordInput
                  id="confirm_password"
                  value={pwdForm.confirm_password}
                  onChange={(v) => setPwdForm({ ...pwdForm, confirm_password: v })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Modification...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ce que la plateforme prélève sur ses ventes */}
        <CommissionGridCard />

      </div>
    </PageContainer>
  );
}
