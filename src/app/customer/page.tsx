'use client';

import { CustomerApp } from '@/components/CustomerApp';
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { useRestaurantStore } from '@/stores';

export default function CustomerPage() {
  const { currentRestaurant } = useRestaurantStore();

  if (!currentRestaurant) {
    return <RestaurantSelector onSelectMode={() => {}} />;
  }

  return <CustomerApp />;
}