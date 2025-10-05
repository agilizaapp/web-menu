export * from './api.types';
export * from './entities.types';

import type { MenuItem } from './entities.types';

// ==================== LEGACY TYPES (mantidos para compatibilidade) ====================
// Nota: MenuItem, MenuModifierGroup, MenuModifierOption, RestaurantTheme vêm de entities.types

export interface DaySchedule {
  open: string;  // formato: "HH:mm"
  close: string; // formato: "HH:mm"
  closed: boolean;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// ==================== CART & ORDER TYPES ====================

export interface CartItem {
  id: string;
  menuItem: MenuItem; // Usando MenuItem de entities.types (id: number)
  quantity: number;
  selectedModifiers: { [modifierId: string]: string[] };
  totalPrice: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'rejected';
  totalAmount: number;
  createdAt: Date | string; // Can be string when deserialized from localStorage
  paymentMethod: 'pix';
  paymentStatus: 'pending' | 'completed' | 'failed';
}