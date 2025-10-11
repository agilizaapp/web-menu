import { MenuCategory, MenuItem } from '../entities.types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

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

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, string | boolean | number | undefined>;
  };
  timestamp: string;
}

// ==================== API RESTAURANT RESPONSES ====================

export interface IGetProductByIdStoreApiResponse {
  product: MenuItem;
  store?: IStoreConfigs;
}

export interface IGetAllProductsApiResponse {
  products: MenuItem[];
  store?: IStoreConfigs;
  categories?: MenuCategory[] | string[];
  customer?: {
    name: string;
    phone: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      postalCode: string;
      complement?: string;
    } | null;
  };
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
      deliveryFee: number;
      deliveryZones: string[];
      pixKey: string;
      address?: string;
      pickUpLocation?: {
        label: string;
        mapsUrl: string;
      };
    };
  };
};

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