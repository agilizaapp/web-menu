import { MenuItem } from '../entities.types';
import { IProductModifierGroup } from './product.types';

// ApiResponse já está exportado em restaurant/api.types
// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
//   timestamp: string;
// }

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// ApiErrorResponse já está exportado em restaurant/api.types
// interface ApiErrorResponse {
//   success: false;
//   error: {
//     message: string;
//     code: string;
//     details?: Record<string, string | boolean | number | undefined>;
//   };
//   timestamp: string;
// }

// ==================== API ORDER TYPES ====================

export interface IOrderItem {
  name: string;
  description: string;
  category: string;
  price: number;
  product_id: number;
  quantity: number;
  modifiers?: IProductModifierGroup[];
}

export interface IOrderAddress {
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  complement?: string;
}

export interface IOrderDetail {
  delivery: boolean;
  items: IOrderItem[];
  address?: IOrderAddress;
}

export interface IOrderCustomer {
  name: string;
  phone?: string;
  email?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'prepared'
  | 'finished'
  | 'cancelled';

export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash';

export interface IOrderApi {
  id: number;
  created_at: string;
  updated_at: string;
  customer_id: number;
  store_id: number;
  amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer: IOrderCustomer;
  detail: IOrderDetail;
  whatsapp_url: string;
}

// ==================== API RESPONSES ====================

export interface IGetAllOrdersApiResponse {
  orders: IOrderApi[];
}

export interface IGetProductByIdStoreApiResponse {
  product: MenuItem;
  store?: IStoreConfigs;
}

export interface IStoreConfigs {
  name: string;
  type: string;
  configs: {
    theme: {
      logo: string;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
    settings: {
      hours: string;
      useCustomHours: boolean;
      customHours: {
        monday: DayScheduleApi;
        tuesday: DayScheduleApi;
        wednesday: DayScheduleApi;
        thursday: DayScheduleApi;
        friday: DayScheduleApi;
        saturday: DayScheduleApi;
        sunday: DayScheduleApi;
      };
      deliveryFee?: number; // Legacy field, pode não existir mais
      deliverySettings?: Array<{ distance: number; value: number }>; // Novo formato
      deliveryZones: string[];
      pixKey: string;
    };
  };
}

export interface DayScheduleApi {
  open: string;
  close: string;
  closed: boolean;
}

// Query params comuns
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  [key: string]: string | boolean | number | undefined;
}