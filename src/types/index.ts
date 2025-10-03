export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  modifiers?: MenuModifier[];
  available: boolean;
}

export interface MenuModifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
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

export interface RestaurantTheme {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

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

export interface Restaurant {
  id: string;
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