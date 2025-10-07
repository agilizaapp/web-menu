// Export all stores from a single entry point
export { useCartStore } from './cartStore';
export { useRestaurantStore } from './restaurantStore';
export { useOrderStore } from './orderStore';
export { useCustomerStore } from './customerStore';

// Re-export types for convenience
export type { CartItem, Restaurant, MenuItem, Order } from '@/types';
