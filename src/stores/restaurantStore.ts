import { create } from 'zustand';
import { Restaurant, MenuItem } from '@/types';
import { mockRestaurants, mockMenuItems } from '@/data/mockData';

interface RestaurantStore {
  currentRestaurant: Restaurant | null;
  menu: MenuItem[];
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  loadRestaurantData: (restaurantId: string) => void;
  applyTheme: () => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  currentRestaurant: mockRestaurants[0],
  menu: mockMenuItems,

  setCurrentRestaurant: (restaurant: Restaurant) => {
    set({ currentRestaurant: restaurant });
  },

  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => {
    set((state) => ({
      menu: state.menu.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  },

  loadRestaurantData: (restaurantId: string) => {
    // Encontra restaurante nos dados mock
    const restaurant = mockRestaurants.find((r) => r.id === restaurantId);
    
    if (restaurant) {
      set({
        currentRestaurant: restaurant,
        menu: mockMenuItems, // Em produção, filtrar por restaurante
      });
    }
  },

  applyTheme: () => {
    const { currentRestaurant } = get();
    
    if (currentRestaurant && typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--restaurant-primary', currentRestaurant.theme.primaryColor);
      root.style.setProperty('--restaurant-secondary', currentRestaurant.theme.secondaryColor);
      root.style.setProperty('--restaurant-accent', currentRestaurant.theme.accentColor);
    }
  },
}));

