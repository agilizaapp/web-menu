// ==================== RESTAURANT ====================
import { WeeklySchedule } from '@/types/index';
export interface Restaurant {
  id: number;
  name: string;
  theme: RestaurantTheme;
  settings: {
    hours: string;
    customHours?: WeeklySchedule;
    useCustomHours?: boolean;
    deliveryFee: number;
    deliveryZones: string[];
    pixKey: string;
  };
  menu: MenuItem[];
}

export interface RestaurantTheme {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface RestaurantSettings {
  hours: string;
  phone: string;
  address: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  acceptingOrders: boolean;
}

export type PaymentMethod = 'pix' | 'credit-card' | 'debit-card' | 'cash';

// ==================== MENU ====================

export interface Menu {
  id: string;
  restaurantId: number;
  categories: MenuCategory[];
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
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  preparationTime?: number; // em minutos
  modifiers?: MenuModifierGroup[];
  tags?: string[];
  calories?: number;
  allergens?: string[];
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  options: MenuModifierOption[];
}

export interface MenuModifierOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

// ==================== CART ====================

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  subtotal: number;
  notes?: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  option: MenuModifierOption;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// ==================== ORDER ====================

export interface Order {
  id: string;
  restaurantId: number;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  deliveryAddress?: DeliveryAddress;
  notes?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type DeliveryType = 'delivery' | 'pickup';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  selectedModifiers: SelectedModifier[];
  subtotal: number;
  notes?: string;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
}

// ==================== PAYMENT ====================

export interface PixPayment {
  id: string;
  orderId: string;
  amount: number;
  qrCode: string;
  qrCodeBase64: string;
  pixKey: string;
  expiresAt: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PaymentConfirmation {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  paidAt?: string;
}

// ==================== DTOs (Data Transfer Objects) ====================

export interface CreateOrderDTO {
  restaurantId: number;
  customerInfo: CustomerInfo;
  items: CreateOrderItemDTO[];
  deliveryType: DeliveryType;
  deliveryAddress?: DeliveryAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CreateOrderItemDTO {
  menuItemId: string;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  notes?: string;
}

export interface CreateMenuItemDTO {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  preparationTime?: number;
  modifiers?: MenuModifierGroup[];
  tags?: string[];
  calories?: number;
  allergens?: string[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  estimatedDeliveryTime?: string;
}

export interface CreatePixPaymentDTO {
  orderId: string;
  amount: number;
}

// ==================== ANALYTICS ====================

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  topItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ==================== USER/ADMIN ====================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'manager' | 'staff';

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'new-order'
  | 'order-updated'
  | 'payment-received'
  | 'order-cancelled';