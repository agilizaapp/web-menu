export * from './restaurant/api.types';
// Export específicos de admin para evitar conflitos
export type { 
  PaginatedResponse,
  IGetAllOrdersApiResponse,
  IOrderApi,
  IOrderDetail,
  IOrderItem,
  IOrderItemModifier,
  IOrderCustomer,
  IOrderAddress,
  OrderStatus,
  IGetProductByIdStoreApiResponse,
  IStoreConfigs,
  DayScheduleApi,
  PaginationParams,
  SortParams,
  FilterParams
} from './admin/api.types';
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

export interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  complement?: string;
}

export interface Order {
  id: string;
  apiOrderId?: number; // ID retornado pela API
  apiToken?: string; // Token de autenticação da API
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    address: string | AddressData;
  };
  deliveryType: 'delivery' | 'pickup';
  status: 'pending' | 'confirmed' | 'in_progress' | 'prepared' | 'finished' | 'cancelled';
  totalAmount: number;
  createdAt: Date | string;
  paymentMethod: 'pix' | 'card';
  paymentStatus: 'pending' | 'completed' | 'failed';
  pixCode?: string; // Código PIX retornado pela API
}