import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product, ProductVariant, CartItem } from '@/types/product';
import { cartLineKey, itemKey } from '@/helpers/cart-line';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeFromCart: (productId: number, variantId?: number | null) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

const CART_KEY = 'tendo-cart';
/** Ancienne clé (avant le rebranding) : reprise une fois puis supprimée. */
const LEGACY_CART_KEY = 'diaba-cart';

function readStoredCart(): string | null {
  const current = localStorage.getItem(CART_KEY);
  if (current !== null) return current;

  const legacy = localStorage.getItem(LEGACY_CART_KEY);
  if (legacy !== null) {
    localStorage.setItem(CART_KEY, legacy);
    localStorage.removeItem(LEGACY_CART_KEY);
  }
  return legacy;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = readStoredCart();
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Nettoyer les éléments avec quantité 0 ou invalides
        const validItems = parsedCart.filter((item: CartItem) => 
          item && item.product && item.quantity > 0
        );
        return validItems;
      } catch {
        // Si le localStorage est corrompu, on le vide
        localStorage.removeItem(CART_KEY);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1, variant: ProductVariant | null = null) => {
    const cle = cartLineKey(product.id, variant?.id);
    setItems(prev => {
      const existingItem = prev.find(item => itemKey(item) === cle);

      if (existingItem) {
        return prev.map(item =>
          itemKey(item) === cle
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { product, quantity, variant }];
    });
  };

  const removeFromCart = (productId: number, variantId?: number | null) => {
    const cle = cartLineKey(productId, variantId);
    setItems(prev => prev.filter(item => itemKey(item) !== cle));
  };

  const updateQuantity = (productId: number, quantity: number, variantId?: number | null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    const cle = cartLineKey(productId, variantId);
    setItems(prev =>
      prev.map(item =>
        itemKey(item) === cle ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      return total + parseFloat(item.product.price) * item.quantity;
    }, 0);
  };

  const getItemsCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
