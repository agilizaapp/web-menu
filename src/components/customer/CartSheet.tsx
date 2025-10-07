import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore, useRestaurantStore } from '@/stores';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface CartSheetProps {
  onCheckout?: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({ onCheckout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    getTotalCartPrice, 
    getCartItemCount
  } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();

  const cartCount = getCartItemCount();
  const cartTotal = getTotalCartPrice();
  const deliveryFee = currentRestaurant?.settings?.deliveryFee || 0;
  const tax = cartTotal * 0.1; // 10% tax
  const finalTotal = cartTotal + deliveryFee + tax;

  const handleCheckout = () => {
    setIsOpen(false);
    onCheckout?.();
  };

  // Don't render until client-side mount to prevent hydration mismatch
  if (!isClient || cartCount === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="px-2 fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
          style={{ backgroundColor: 'var(--restaurant-primary)' }}
        >
          <ShoppingBag className="w-8 h-8" />
          <Badge 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: 'var(--restaurant-accent)', color: 'white' }}
          >
            {cartCount}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent className="px-2 w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Seu Carrinho ({cartCount} {cartCount === 1 ? 'item' : 'itens'})
          </SheetTitle>
          <SheetDescription>
            Revise os itens do seu pedido e prossiga para o checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                  <ImageWithFallback
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{item.menuItem.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    R$ {item.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cada
                  </p>

                  {/* Selected Modifiers */}
                  {Object.entries(item.selectedModifiers).map(([modifierId, optionIds]) => {
                    const modifier = item.menuItem.modifiers?.find(m => m.id === modifierId);
                    if (!modifier || optionIds.length === 0) return null;

                    return (
                      <div key={modifierId} className="mt-1">
                        <span className="text-xs text-muted-foreground">
                          {modifier.name}: {optionIds.map(id => {
                            const option = modifier.options.find(o => o.id === id);
                            return option?.name;
                          }).join(', ')}
                        </span>
                      </div>
                    );
                  })}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItem(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-medium min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    R$ {(item.totalPrice * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>R$ {cartTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taxa de Entrega</span>
              <span>R$ {deliveryFee.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {/* <div className="flex justify-between text-sm">
              <span>Taxas</span>
              <span>R$ {tax.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div> */}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>R$ {finalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex gap-2 py-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={clearCart}
              >
                Limpar Carrinho
              </Button>
              <Button 
                className="flex-1"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
                onClick={handleCheckout}
              >
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};