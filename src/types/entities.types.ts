// ==================== RESTAURANT ====================
import { WeeklySchedule } from '@/types/index';

export interface Restaurant {
  id: number;
  name: string;
  theme: RestaurantTheme;
  settings: RestaurantSettings;
  menu: MenuItem[] | string[];
}

export interface RestaurantTheme {
  name?: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface RestaurantSettings {
  hours: string;
  useCustomHours?: boolean;
  customHours?: WeeklySchedule;
  deliveryFee: number;
  deliveryZones: string[];
  pixKey: string;
  phone?: string;
  address?: string;
  minimumOrder?: number;
  estimatedDeliveryTime?: string;
  paymentMethods?: PaymentMethod[];
  isOpen?: boolean;
  acceptingOrders?: boolean;
}

export type PaymentMethod = 'pix' | 'credit-card' | 'debit-card' | 'cash';

// ==================== MENU ====================

export interface Menu {
  id: string;
  restaurantId: 1;
  categories: MenuCategory[] | string[];
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  image?: string;
  category: string;
  price: number;
  available: boolean;
  modifiers?: MenuModifierGroup[];
  preparationTime?: number;
  tags?: string[];
  calories?: number;
  allergens?: string[];
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  minSelection?: number;
  maxSelection?: number;
  options: MenuModifierOption[];
}

export interface MenuModifierOption {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

// ... rest of file remains the same