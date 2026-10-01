import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { itemKey, availableStock } from '@/helpers/cart-line';
import { useModal } from '@/components/shared/modal-provider';
import { useUser } from '@/contexts/user-context';
import { useNavigate } from 'react-router-dom';

interface CartModalProps {
  onCheckout?: () => void;
}

export function CartModal({ onCheckout }: CartModalProps) {
  const { items, updateQuantity, removeFromCart, getTotal, getItemsCount } = useCart();
  const { openModal, closeModal, isModalOpen } = useModal();
  const { user } = useUser();
  const navigate = useNavigate();

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleCheckout = () => {
    closeModal('cart');
    onCheckout?.();
    // Sans compte : commande invité (mêmes étapes, coordonnées saisies au checkout)
    navigate(user ? '/customer/checkout' : '/checkout');
  };

  const itemsCount = getItemsCount();
  const total = getTotal();
  const isOpen = isModalOpen('cart');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? openModal('cart') : closeModal('cart')}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="size-5" />
          {itemsCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {itemsCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Panier ({itemsCount} article{itemsCount > 1 ? 's' : ''})
          </DialogTitle>
          <DialogDescription>
            Gérez vos articles avant de passer commande
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingCart className="size-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Votre panier est vide</h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez des produits pour commencer vos achats
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={itemKey(item)} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {item.product.name}
                          </h4>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.variant.label}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 shrink-0"
                          >
                            <Minus className="size-4" />
                          </Button>

                          <span className="w-8 sm:w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            disabled={item.quantity >= availableStock(item)}
                            className="h-8 w-8 shrink-0"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>

                        <p className="font-semibold whitespace-nowrap ml-auto">
                          {formatPrice((parseFloat(item.product.price) * item.quantity).toString())}
                        </p>
                      </div>

                      {availableStock(item) < 10 && (
                        <p className="text-xs text-amber-600">
                          Plus que {availableStock(item)} en stock
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatPrice(total.toString())}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-medium text-green-600">Gratuite</span>
                </div> */}
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-lg">{formatPrice(total.toString())}</span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                >
                  Commander maintenant
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
