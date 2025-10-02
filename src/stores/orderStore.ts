import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from '@/types';
import { mockOrders } from '@/data/mockData';

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  setCurrentOrder: (order: Order | null) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      currentOrder: null,

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders],
          currentOrder: order,
        }));
      },

      updateOrderStatus: (orderId: string, status: Order['status']) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? { ...state.currentOrder, status }
              : state.currentOrder,
        }));
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((order) => order.id === orderId);
      },

      setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
      },

      clearOrders: () => {
        set({ orders: [] });
      },
    }),
    {
      name: 'restaurant-orders-storage',
      version: 1,
    }
  )
);
