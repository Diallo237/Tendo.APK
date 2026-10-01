import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  Search,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { trackGuestOrder } from '@/services/order.service';
import type { Order } from '@/types/order';

const formatPrice = (amount: string | number) =>
  new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);

const formatDate = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface TrackingState {
  orderNumber?: string;
  phone?: string;
  justOrdered?: boolean;
}

/**
 * Suivi d'une commande sans compte : numéro de commande + téléphone.
 * Sert aussi de page de confirmation juste après une commande invité.
 */
export default function OrderTrackingPage() {
  const location = useLocation();
  const state = (location.state as TrackingState | null) ?? {};

  const [orderNumber, setOrderNumber] = useState(state.orderNumber ?? '');
  const [phone, setPhone] = useState(state.phone ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justOrdered] = useState(Boolean(state.justOrdered));

  const fetchOrder = useCallback(async (numberValue: string, phoneValue: string) => {
    setIsLoading(true);
    setError('');
    try {
      setOrder(await trackGuestOrder(numberValue.trim(), phoneValue.trim()));
    } catch (requestError: unknown) {
      const details = (requestError as { details?: { detail?: string } })?.details;
      setOrder(null);
      setError(details?.detail || "Aucune commande ne correspond à ce numéro et à ce téléphone.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Arrivée depuis le checkout : la commande est chargée automatiquement
  useEffect(() => {
    if (state.orderNumber && state.phone) {
      void fetchOrder(state.orderNumber, state.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Renseignez le numéro de commande et le téléphone utilisés lors de l’achat.');
      return;
    }
    void fetchOrder(orderNumber, phone);
  };

  return (
    <div className="relative min-h-screen bg-muted/30 px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 gap-1.5">
            <Link to="/shop">
              <ArrowLeft className="size-4" />
              Retour à la boutique
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Suivi de commande</h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez votre commande avec son numéro et le téléphone saisi lors de l'achat.
          </p>
        </div>

        {justOrdered && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Commande enregistrée</AlertTitle>
            <AlertDescription>
              Merci ! Un email de confirmation vient de vous être envoyé. Conservez le numéro
              de commande ci-dessous : il vous servira à suivre votre colis et à le retirer au dépôt.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rechercher ma commande</CardTitle>
            <CardDescription>Les deux informations sont nécessaires.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="order-number">Numéro de commande</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="order-number"
                      className="pl-10"
                      placeholder="DIA-0001"
                      value={orderNumber}
                      onChange={(event) => setOrderNumber(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tracking-phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="tracking-phone"
                      className="pl-10"
                      placeholder="77 123 45 67"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="gap-2" disabled={isLoading}>
                <Search className="size-4" />
                {isLoading ? 'Recherche...' : 'Suivre ma commande'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {order && (
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Commande {order.order_number}</CardTitle>
                  <CardDescription>Passée le {formatDate(order.created_at)}</CardDescription>
                </div>
                <Badge>{order.status_display}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Client</p>
                  <p className="text-sm">{order.client_name || '—'}</p>
                  <p className="text-sm text-muted-foreground">{order.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Livraison</p>
                  <p className="whitespace-pre-line text-sm">
                    {typeof order.shipping_address === 'string'
                      ? order.shipping_address
                      : Object.values(order.shipping_address).join(', ')}
                  </p>
                </div>
              </div>

              {order.shipment_depot_name && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium">Retrait au dépôt {order.shipment_depot_name}</p>
                    {order.shipment_depot_address && (
                      <p className="text-muted-foreground">{order.shipment_depot_address}</p>
                    )}
                    {order.shipment_depot_location && (
                      <p className="text-muted-foreground">{order.shipment_depot_location}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.product_name}</p>
                      {item.variant_label && (
                        <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Qté : {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                {order.payment_timing_display} — vous serez prévenu par email dès que votre colis
                sera disponible au dépôt.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
