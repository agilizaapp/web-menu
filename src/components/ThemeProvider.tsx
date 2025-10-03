'use client';

import { useEffect } from 'react';
import { useRestaurantStore } from '@/stores';

/**
 * ThemeProvider component that applies restaurant theme CSS custom properties
 * Runs only on the client side to prevent hydration mismatches
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRestaurant, applyTheme } = useRestaurantStore();

  useEffect(() => {
    // Apply theme on mount and whenever restaurant changes
    applyTheme();
  }, [currentRestaurant, applyTheme]);

  return <>{children}</>;
};
