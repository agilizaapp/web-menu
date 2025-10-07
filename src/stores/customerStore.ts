import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AddressData } from '@/services/api';

interface CustomerState {
  token: string | null;
  name: string | null;
  phone: string | null;
  address: AddressData | null;
  isAuthenticated: boolean;
  
  // Actions
  setCustomer: (data: {
    token: string;
    name: string;
    phone: string;
    address?: AddressData;
  }) => void;
  updateAddress: (address: AddressData) => void;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      token: null,
      name: null,
      phone: null,
      address: null,
      isAuthenticated: false,

      setCustomer: (data) => {
        set({
          token: data.token,
          name: data.name,
          phone: data.phone,
          address: data.address || null,
          isAuthenticated: true,
        });
      },

      updateAddress: (address) => {
        set({ address });
      },

      clearCustomer: () => {
        set({
          token: null,
          name: null,
          phone: null,
          address: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'customer-storage',
    }
  )
);
