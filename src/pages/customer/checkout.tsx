import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/cart-context';
import { itemKey } from '@/helpers/cart-line';
import { useUser } from '@/contexts/user-context';
import { useCheckout } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LocalisationSelect } from '@/components/shared/localisation-select';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import type { Localite } from '@/services/localisation.service';
import {
  MapPin,
  Phone,
  ShoppingBag,
  Truck,
  Wallet,
  ChevronLeft,
  CheckCircle2,
  Package,
  UserRound,
  LogIn,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GuestCheckoutInfo, PaymentTiming, ShippingAddress } from '@/types/order';
import { validatePhoneNumber, PHONE_ERROR_MESSAGE } from '@/utils/validate-data';
import { CLIENT_LOGIN_PATH } from '@/helpers/login-paths';

const STATUS_COLORS: Record<string, string> = {
  pay_after: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400',
  pay_before: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
};

/** Clé de mémorisation des coordonnées d'un invité (pré-remplissage). */
const GUEST_INFO_KEY = 'guestCheckoutInfo';

function readGuestInfo(): Partial<GuestCheckoutInfo> {
  try {
    return JSON.parse(localStorage.getItem(GUEST_INFO_KEY) || '{}') as Partial<GuestCheckoutInfo>;
  } catch {
    return {};
  }
}

function saveGuestInfo(info: GuestCheckoutInfo): void {
  try {
    localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
  } catch {
    // Stockage indisponible (navigation privée) : le pré-remplissage est un confort
  }
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);

export default function CheckoutPage() {
  const navigate = useNavigate();
  // La même page sert /checkout (public, sans en-tête) et /customer/checkout
  // (sous l'en-tête client, qui porte déjà la bascule de thème).
  const estPagePublique = useLocation().pathname === '/checkout';
  const { items, getTotal, clearCart } = useCart();
  const { user } = useUser();
  const { mutate: placeOrder, isPending } = useCheckout();

  // Commande invité : aucun compte connecté — les coordonnées sont portées par
  // la commande, et mémorisées localement pour la prochaine fois.
  const isGuest = !user;
  const savedGuest = isGuest ? readGuestInfo() : {};

  const [firstName, setFirstName] = useState(savedGuest.first_name || '');
  const [lastName, setLastName] = useState(savedGuest.last_name || '');
  const [email, setEmail] = useState(savedGuest.email || '');
  const [address, setAddress] = useState<ShippingAddress>({
    name: user?.full_name || [savedGuest.first_name, savedGuest.last_name].filter(Boolean).join(' '),
    phone: user?.phone || savedGuest.phone || '',
    street: user?.address || '',
    city: '',
    country: 'Sénégal',
  });
  const [phone, setPhone] = useState(user?.phone || savedGuest.phone || '');
  const [location, setLocation] = useState<{
    region: Localite | null;
    departement: Localite | null;
    commune: Localite | null;
  }>({ region: null, departement: null, commune: null });
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('pay_after');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShoppingBag className="size-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Votre panier est vide</h2>
          <p className="text-sm text-muted-foreground">Ajoutez des produits avant de commander.</p>
          <Button onClick={() => navigate(user ? '/customer' : '/shop')}>Retour à la boutique</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const guestName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const customerName = isGuest ? guestName : address.name;

    if (isGuest && (!firstName.trim() || !lastName.trim() || !email.trim())) {
      toast.error('Veuillez renseigner votre prénom, votre nom et votre email');
      return;
    }

    if (!customerName || !phone || !location.region || !location.commune) {
      toast.error('Veuillez remplir tous les champs obligatoires (nom, téléphone, région, commune)');
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setPhoneError(PHONE_ERROR_MESSAGE);
      return;
    }
    setPhoneError('');

    const city = [location.commune?.name, location.departement?.name, location.region?.name]
      .filter(Boolean).join(', ');

    placeOrder(
      {
        shipping_address: { ...address, name: customerName, phone, city },
        payment_timing: paymentTiming,
        commune_id: location.commune?.id ?? null,
        phone,
        notes,
        cart_items: items.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id ?? null,
          quantity: item.quantity,
        })),
        ...(isGuest && {
          guest_first_name: firstName.trim(),
          guest_last_name: lastName.trim(),
          guest_email: email.trim(),
        }),
      },
      {
        onSuccess: (data: { order?: { order_number?: string } }) => {
          clearCart();
          const orderNumber = data?.order?.order_number || '';
          toast.success('Commande passée avec succès !', {
            description: orderNumber ? `N° ${orderNumber}` : undefined,
          });

          if (isGuest) {
            // Coordonnées mémorisées pour la prochaine commande
            saveGuestInfo({
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              email: email.trim(),
              phone,
              region_id: location.region?.id ?? null,
              departement_id: location.departement?.id ?? null,
              commune_id: location.commune?.id ?? null,
            });
            navigate('/suivi-commande', {
              state: { orderNumber, phone, justOrdered: true },
              replace: true,
            });
            return;
          }

          navigate('/customer/orders');
        },
        onError: (error: Error) => {
          const err = error as Error & { response?: { data?: Record<string, unknown> | string } };
          // Extraire le message d'erreur DRF (err.response.data), pas le message axios générique
          const data = err?.response?.data;
          let msg = 'Impossible de passer la commande';
          if (data) {
            if (typeof data === 'string') {
              msg = data;
            } else if (data.detail) {
              msg = String(data.detail);
            } else if (data.phone) {
              msg = Array.isArray(data.phone) ? String(data.phone[0]) : String(data.phone);
              setPhoneError(msg); // affiche aussi l'erreur sous le champ
            } else {
              const first = Object.values(data)[0];
              msg = Array.isArray(first) ? String(first[0]) : String(first);
            }
          }
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Finaliser la commande</h1>
            <p className="text-sm text-muted-foreground">{items.length} article{items.length > 1 ? 's' : ''}</p>
          </div>
          {/* Page publique : aucun en-tête au-dessus, on fournit la bascule ici */}
          {estPagePublique && <ThemeToggle />}
        </div>

        {/* Commande sans compte : on rappelle qu'un compte reste possible */}
        {isGuest && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Vous commandez en tant qu'invité</p>
                <p className="text-xs text-muted-foreground">
                  Aucun compte n'est nécessaire. Vous suivrez votre commande avec son numéro
                  et votre téléphone.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Link to={CLIENT_LOGIN_PATH}>
                <LogIn className="size-4" />
                J'ai déjà un compte
              </Link>
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Colonne gauche ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Adresse de livraison */}
              <div className="bg-background rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="size-5 text-primary" />
                  <h2 className="font-semibold text-base">Adresse de livraison</h2>
                </div>
                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isGuest ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="first-name">Prénom <span className="text-destructive">*</span></Label>
                        <Input
                          id="first-name"
                          placeholder="Votre prénom"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="last-name">Nom <span className="text-destructive">*</span></Label>
                        <Input
                          id="last-name"
                          placeholder="Votre nom"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email">
                          <Mail className="inline size-3.5 mr-1 mb-0.5" />
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Pour recevoir la confirmation et le suivi de votre commande.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        placeholder="Votre nom"
                        value={address.name}
                        onChange={(e) => setAddress(p => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">
                      <Phone className="inline size-3.5 mr-1 mb-0.5" />
                      Téléphone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="77 123 45 67"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(''); }}
                      required
                      aria-invalid={!!phoneError}
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive">{phoneError}</p>
                    )}
                  </div>

                </div>

                {/* Région / Département / Commune */}
                <LocalisationSelect
                  onLocationChange={setLocation}
                  initialRegionId={user?.region_id ?? savedGuest.region_id ?? undefined}
                  initialDepartementId={user?.departement_id ?? savedGuest.departement_id ?? undefined}
                  initialCommuneId={user?.commune_id ?? savedGuest.commune_id ?? undefined}
                  required
                />
              </div>

              {/* Mode de paiement */}
              <div className="bg-background rounded-xl border p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="size-5 text-primary" />
                  <h2 className="font-semibold text-base">Mode de paiement</h2>
                </div>
                <Separator />

                <RadioGroup
                  value={paymentTiming}
                  onValueChange={(v) => setPaymentTiming(v as PaymentTiming)}
                  className="space-y-3"
                >
                  {/* Après livraison */}
                  <label
                    htmlFor="pay_after"
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentTiming === 'pay_after'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem value="pay_after" id="pay_after" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-emerald-600" />
                        <span className="font-medium text-sm">Paiement à la récupération</span>
                        {/* <Badge variant="secondary" className="text-xs">Recommandé</Badge> */}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Payez uniquement quand vous récupérez votre colis au dépôt le plus proche.
                      </p>
                    </div>
                  </label>

                  {/* Avant livraison — désactivé temporairement */}
                  <label
                    htmlFor="pay_before"
                    className="flex items-start gap-4 p-4 rounded-lg border-2 border-border opacity-40 cursor-not-allowed"
                  >
                    <RadioGroupItem value="pay_before" id="pay_before" className="mt-0.5" disabled />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="size-4 text-blue-600" />
                        <span className="font-medium text-sm">Paiement avant livraison</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Réglez votre commande à l'avance via Mobile Money.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="bg-background rounded-xl border p-5 space-y-3">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instructions spéciales, horaire préféré..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* ── Colonne droite — Résumé ── */}
            <div className="space-y-4">
              <div className="bg-background rounded-xl border p-5 space-y-4 sticky top-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-5 text-primary" />
                  <h2 className="font-semibold text-base">Résumé</h2>
                </div>
                <Separator />

                {/* Liste articles */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={itemKey(item)} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">{item.variant.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qté : {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totaux */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {/* <div className="flex justify-between text-muted-foreground">
                    <span>Livraison</span>
                    <span className="text-emerald-600 font-medium">Gratuite</span>
                  </div> */}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Badge paiement sélectionné */}
                <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium ${STATUS_COLORS[paymentTiming]}`}>
                  <Truck className="size-4 shrink-0" />
                  {paymentTiming === 'pay_after'
                    ? 'Paiement à la récupération au dépôt'
                    : 'Paiement avant livraison (Mobile Money)'}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Traitement...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      Confirmer la commande
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  En confirmant, vous acceptez nos conditions d'utilisation.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
