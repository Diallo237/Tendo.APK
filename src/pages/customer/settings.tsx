import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/user-context';
import { useUpdateProfile, useChangePassword } from '@/services/user.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LocalisationSelect } from '@/components/shared/localisation-select';
import type { Localite } from '@/services/localisation.service';
import {
  Lock,
  Bell,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Package,
  CreditCard,
  ArrowLeft,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { validatePhoneNumber, PHONE_ERROR_MESSAGE } from '@/utils/validate-data';
import PageContainer from '@/components/shared/page-container';
import { BecomeSupplierCard } from '@/components/shared/become-supplier-card';

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

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    commune_id: null as number | null,
  });

  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPromotions: false,
    emailNewsletter: true,
    pushOrders: true,
    pushPromotions: false,
    smsOrders: false,
    smsPromotions: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'fr',
    currency: 'XOF',
    timezone: 'Africa/Dakar',
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: true,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        commune_id: user.commune_id ?? null,
      });
    }
  }, [user?.id]);

  const handleLocationChange = ({ region, departement, commune }: {
    region: Localite | null;
    departement: Localite | null;
    commune: Localite | null;
  }) => {
    const newCommuneId = commune?.id ?? null;
    setProfileForm((prev) => {
      const autoAddress = [commune?.name, departement?.name, region?.name].filter(Boolean).join(', ');
      return {
        ...prev,
        commune_id: newCommuneId,
        address: prev.address || autoAddress,
      };
    });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.phone && !validatePhoneNumber(profileForm.phone)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return;
    }
    updateProfile.mutate(profileForm, {
      onSuccess: () => toast.success('Profil mis à jour.'),
      onError: (err: any) => {
        const data = err?.response?.data;
        const msg =
          data?.email?.[0] ?? data?.phone?.[0] ?? data?.detail ?? 'Erreur lors de la mise à jour.';
        toast.error(msg);
      },
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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/customer')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Retour à l'accueil
        </Button>

        <PageContainer title="Paramètres" subtitle="Gérez votre profil, notifications et sécurité">
          <Tabs defaultValue="profile" className="w-full">
            {/* `h-auto` : sur mobile les 5 onglets tiennent sur plusieurs lignes,
                la hauteur fixe de la barre les écrasait les uns sur les autres. */}
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="profile">
                <User className="mr-2 size-4" />
                <span>Profil</span>
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="mr-2 size-4" />
                <span className="hidden sm:inline">Mot de passe</span>
                <span className="sm:hidden">MDP</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="mr-2 size-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notif</span>
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Globe className="mr-2 size-4" />
                <span className="hidden sm:inline">Préférences</span>
                <span className="sm:hidden">Préf</span>
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="mr-2 size-4" />
                <span className="hidden sm:inline">Sécurité</span>
                <span className="sm:hidden">Sécu</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Profil ─────────────────────────────────────────────────── */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Modifiez vos informations de contact et votre localisation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSave} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Prénom</Label>
                        <Input
                          id="first_name"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Nom de famille</Label>
                        <Input
                          id="last_name"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+221 70 000 00 00"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Localisation (région / département / commune)</Label>
                      <LocalisationSelect
                        onLocationChange={handleLocationChange}
                        initialRegionId={user?.region_id}
                        initialDepartementId={user?.departement_id}
                        initialCommuneId={user?.commune_id}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse détaillée</Label>
                      <Input
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="Rue, quartier, numéro..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Accès fournisseur : même compte, rôle supplémentaire après validation admin */}
              <BecomeSupplierCard />
            </TabsContent>

            {/* ── Tab: Mot de passe ───────────────────────────────────────────── */}
            <TabsContent value="password" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Changer le mot de passe</CardTitle>
                  <CardDescription>
                    Assurez-vous que votre mot de passe contient au moins 8 caractères.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSave} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <PasswordInput
                        id="currentPassword"
                        value={pwdForm.current_password}
                        onChange={(v) => setPwdForm({ ...pwdForm, current_password: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <PasswordInput
                        id="newPassword"
                        value={pwdForm.new_password}
                        onChange={(v) => setPwdForm({ ...pwdForm, new_password: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <PasswordInput
                        id="confirmPassword"
                        value={pwdForm.confirm_password}
                        onChange={(v) => setPwdForm({ ...pwdForm, confirm_password: v })}
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" onClick={() => setPwdForm({ current_password: '', new_password: '', confirm_password: '' })}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={changePassword.isPending}>
                        {changePassword.isPending ? 'Modification...' : 'Changer le mot de passe'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Notifications ──────────────────────────────────────────── */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications Email</CardTitle>
                  <CardDescription>
                    Gérez les notifications que vous recevez par email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Commandes</p>
                        <p className="text-sm text-muted-foreground">Notifications sur l'état de vos commandes</p>
                      </div>
                    </div>
                    <Switch checked={notifications.emailOrders} onCheckedChange={(c) => setNotifications({ ...notifications, emailOrders: c })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Promotions</p>
                        <p className="text-sm text-muted-foreground">Offres spéciales et codes promo</p>
                      </div>
                    </div>
                    <Switch checked={notifications.emailPromotions} onCheckedChange={(c) => setNotifications({ ...notifications, emailPromotions: c })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Newsletter</p>
                        <p className="text-sm text-muted-foreground">Actualités et nouveaux produits</p>
                      </div>
                    </div>
                    <Switch checked={notifications.emailNewsletter} onCheckedChange={(c) => setNotifications({ ...notifications, emailNewsletter: c })} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications Push & SMS</CardTitle>
                  <CardDescription>Notifications sur votre appareil.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Commandes (push)</p>
                        <p className="text-sm text-muted-foreground">Mises à jour en temps réel</p>
                      </div>
                    </div>
                    <Switch checked={notifications.pushOrders} onCheckedChange={(c) => setNotifications({ ...notifications, pushOrders: c })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Commandes (SMS)</p>
                        <p className="text-sm text-muted-foreground">SMS de livraison et confirmations</p>
                      </div>
                    </div>
                    <Switch checked={notifications.smsOrders} onCheckedChange={(c) => setNotifications({ ...notifications, smsOrders: c })} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => toast.success('Préférences de notification mises à jour.')}>
                  Enregistrer les préférences
                </Button>
              </div>
            </TabsContent>

            {/* ── Tab: Préférences ────────────────────────────────────────────── */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences Générales</CardTitle>
                  <CardDescription>Personnalisez votre expérience sur la plateforme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="wo">Wolof</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <select
                      id="currency"
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="XOF">Franc CFA (XOF)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Préférences mises à jour.')}>Enregistrer</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Sécurité ───────────────────────────────────────────────── */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alertes de sécurité</CardTitle>
                  <CardDescription>Restez informé des activités sur votre compte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Alertes de connexion</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications lors de connexions depuis un nouvel appareil
                        </p>
                      </div>
                    </div>
                    <Switch checked={security.loginAlerts} onCheckedChange={(c) => setSecurity({ ...security, loginAlerts: c })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Déconnexion automatique</p>
                        <p className="text-sm text-muted-foreground">Déconnexion après 30 minutes d'inactivité</p>
                      </div>
                    </div>
                    <Switch checked={security.sessionTimeout} onCheckedChange={(c) => setSecurity({ ...security, sessionTimeout: c })} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Méthodes de paiement</CardTitle>
                  <CardDescription>Gérez vos cartes bancaires enregistrées.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 rounded-lg border border-muted p-4">
                    <CreditCard className="size-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Aucune carte enregistrée</p>
                      <p className="text-sm text-muted-foreground">
                        Vous pourrez enregistrer une carte lors de votre prochain paiement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => toast.success('Paramètres de sécurité mis à jour.')}>
                  Enregistrer les paramètres
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </main>
    </div>
  );
}
