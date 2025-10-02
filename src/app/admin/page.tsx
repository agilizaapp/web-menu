'use client';

import { AdminApp } from '@/components/AdminApp';
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { useRestaurantStore } from '@/stores';

export default function AdminPage() {
  const { currentRestaurant } = useRestaurantStore();

  if (!currentRestaurant) {
    return <RestaurantSelector onSelectMode={() => {}} />;
  }

  return <AdminApp />;
}