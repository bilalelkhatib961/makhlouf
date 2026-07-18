import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/cart/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CartSheet() {
  const cart = useCart();

  return (
    <Sheet open={cart.isOpen} onOpenChange={cart.setCartOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl uppercase tracking-tight">
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
            <p className="text-sm">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {cart.items.map((item) => (
              <div key={item.key} className="flex gap-3 border-b border-border pb-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {item.image && (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => cart.updateQuantity(item.key, item.quantity - 1)}
                        className="grid h-7 w-7 place-items-center rounded-sm border border-border hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm">{item.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => cart.updateQuantity(item.key, item.quantity + 1)}
                        className="grid h-7 w-7 place-items-center rounded-sm border border-border hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-medium">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  aria-label="Remove item"
                  onClick={() => cart.removeItem(item.key)}
                  className="self-start text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {cart.items.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display text-lg">${cart.subtotal.toFixed(2)}</span>
            </div>
            <button
              disabled
              title="Checkout isn't available yet"
              className="mt-4 h-12 w-full rounded-sm bg-foreground text-sm font-medium uppercase tracking-[0.18em] text-background opacity-50"
            >
              Checkout — Coming Soon
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
