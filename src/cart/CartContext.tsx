import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  key: string;
  productId: string;
  variantId: string;
  variantName?: string;
  title: string;
  image?: string;
  unitPrice: number;
  quantity: number;
}

interface AddItemInput {
  productId: string;
  variantId: string;
  variantName?: string;
  title: string;
  image?: string;
  unitPrice: number;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (input: AddItemInput, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
}

const STORAGE_KEY = "makhlouf_cart";

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, variantId: string) {
  return `${productId}__${variantId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage after mount only, to avoid SSR/client markup mismatches.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed/unavailable storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (input: AddItemInput, quantity = 1) => {
      const key = lineKey(input.productId, input.variantId);
      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }
        return [...prev, { ...input, key, quantity }];
      });
    };

    const updateQuantity = (key: string, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((item) => item.key !== key)
          : prev.map((item) => (item.key === key ? { ...item, quantity } : item)),
      );
    };

    const removeItem = (key: string) => {
      setItems((prev) => prev.filter((item) => item.key !== key));
    };

    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return {
      items,
      totalCount,
      subtotal,
      isOpen,
      addItem,
      updateQuantity,
      removeItem,
      clear: () => setItems([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      setCartOpen: setIsOpen,
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Co-exported with CartProvider by design — a Context's accessor hook has to
// live alongside the provider that creates the context.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
