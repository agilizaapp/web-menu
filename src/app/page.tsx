'use client';

import { useEffect, useState } from 'react';
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { AdminApp } from '@/components/AdminApp';
import { CustomerApp } from '@/components/CustomerApp';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { RestaurantsService } from '@/services/restaurant.service';
import { toast } from 'sonner';
import { mockRestaurants } from '@/data/mockData';
import { Restaurant } from '@/types/entities.types';
import { ApiError } from '@/lib/utils/api-error';

type AppMode = 'customer' | 'admin';

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantStore();

  const fetchRestaurant = async () => {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'development') {
      setCurrentRestaurant(mockRestaurants[0]);
    } else {
      try {
        const clientId = process.env?.CLIENT_ID ? Number(process.env.CLIENT_ID) as number : 1;
        const restaurant = await RestaurantsService.getById(clientId);
        setCurrentRestaurant(restaurant as Restaurant);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        }
      }
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!currentRestaurant ? (
        <RestaurantSelector onSelectMode={setAppMode} />
      ) : (
        <div>
          {/* Mode Switch Button - Fixed Position */}
          {/* <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setAppMode(appMode === 'customer' ? 'admin' : 'customer')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
            >
              {appMode === 'customer' ? 'Modo Admin' : 'Modo Cliente'}
            </button>
          </div> */}

          {/* App Content */}
          {appMode === 'customer' ? <CustomerApp /> : <AdminApp />}
        </div>
      )}
    </div>
  );
}
