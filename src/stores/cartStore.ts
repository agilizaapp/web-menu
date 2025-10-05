import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartStore {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void; // CartItem.id é string
  updateCartItem: (itemId: string, quantity: number) => void; // CartItem.id é string
  clearCart: () => void;
  getTotalCartPrice: () => number;
  getCartItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (item: CartItem) => {
        set((state) => {
          // Verifica se item já existe no carrinho com os mesmos modificadores
          const existingItem = state.cart.find(
            (cartItem) =>
              cartItem.menuItem.id === item.menuItem.id &&
              JSON.stringify(cartItem.selectedModifiers) === JSON.stringify(item.selectedModifiers)
          );

          if (existingItem) {
            // Atualiza quantidade do item existente
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.id === existingItem.id
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              ),
            };
          }

          // Adiciona novo item ao carrinho
          const newItem = {
            ...item,
            id: `cart-${Date.now()}-${Math.random()}`, // Mantém o ID do item original
          };

          return {
            cart: [...state.cart, newItem],
          };
        });
      },

      removeFromCart: (itemId: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== itemId),
        }));
      },

      updateCartItem: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      getTotalCartPrice: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.totalPrice * item.quantity, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'restaurant-cart-storage', // Nome no localStorage
      version: 1, // Versão para migrações futuras
    }
  )
);
