import { create } from 'zustand';
import { Restaurant, MenuItem } from '@/types/entities.types';
// import { mockRestaurants } from '@/data/mockData';

interface RestaurantStore {
  currentRestaurant: Restaurant | null;
  menu: MenuItem[];
  categories: string[];
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem | string[]>) => void;
  loadRestaurantData: (restaurantId: number) => void;
  applyTheme: () => void;
  // setMenu: (menu: MenuItem[]) => void;
  setMenu: (menu: MenuItem[]) => void;
  setCategories: (categories: string[]) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  currentRestaurant: null,
  menu: [],
  categories: [],
  // currentRestaurant: mockRestaurants[0],
  // menu: mockMenuItems,

  setCurrentRestaurant: (restaurant: Restaurant) => {
    const menuItems = Array.isArray(restaurant.menu) ? restaurant.menu : [];
    const categories = Array.from(
      new Set(
        menuItems
          .filter((item): item is MenuItem => typeof item !== 'string')
          .map(item => item.category)
      )
    );

    set({
      currentRestaurant: restaurant,
      menu: menuItems as MenuItem[],
      categories,
    });
    // Aplica tema automaticamente ao trocar restaurante
    setTimeout(() => {
      get().applyTheme();
    }, 0);
  },

  setMenu: (menu: MenuItem[]) => {
    set({ menu });
  },

  setCategories: (categories: string[]) => {
    set({ categories });
  },

  updateMenuItem: (itemId: string, updates: Partial<MenuItem | string>) => {
    set((state) => ({
      menu: state.menu.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  },

  loadRestaurantData: (restaurantId: number) => {
    // Encontra restaurante nos dados mock
    const restaurant = mockRestaurants.find((r) => r.id === restaurantId);

    if (restaurant) {
      set({
        currentRestaurant: restaurant,
        // menu: mockMenuItems, // Em produção, filtrar por restaurante
      });

      get().applyTheme();
    }
  },

  applyTheme: () => {
    const { currentRestaurant } = get();
    if (currentRestaurant && typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--restaurant-primary', currentRestaurant?.theme?.primaryColor);
      root.style.setProperty('--restaurant-secondary', currentRestaurant?.theme?.secondaryColor);
      root.style.setProperty('--restaurant-accent', currentRestaurant?.theme?.accentColor);
      if (currentRestaurant.theme.backgroundColor) {
        root.style.setProperty('--restaurant-bg', currentRestaurant.theme.backgroundColor);
      }
      if (currentRestaurant.theme.textColor) {
        root.style.setProperty('--restaurant-text', currentRestaurant.theme.textColor);
      }
    }
  },
}));

