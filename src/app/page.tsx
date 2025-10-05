'use client';

import { useEffect, useState } from 'react';
import { AdminApp } from '@/components/AdminApp';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { RestaurantsService } from '@/services/restaurant.service';
import { toast } from 'sonner';
import { ApiError } from '@/lib/utils/api-error';
import { MenuPage } from '@/components/customer/MenuPage';
import type { MenuItem } from '@/types/entities.types';
import { CustomerApp } from '@/components/CustomerApp';

/* mock */
// import { RestaurantSelector } from '@/components/RestaurantSelector';
// import { CustomerApp } from '@/components/CustomerApp';
// import { mockRestaurants, mockRestaurantData } from '@/data/mockData';

type AppMode = 'customer' | 'admin';

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const [isLoading, setIsLoading] = useState(true);
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantStore();

  // useEffect(() => {
  //   setCurrentRestaurant(mockRestaurantData);
  // }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restaurant = await RestaurantsService.getAllProducts(true);
        if (restaurant?.store) {
          const products = Array.isArray(restaurant.products) 
            ? restaurant.products 
            : [];

          const restaurantData = {
            id: 1,
            name: restaurant.store.name || "",
            theme: {
              name: restaurant.store.name,
              logo: restaurant.store.configs.theme.logo,
              primaryColor: restaurant.store.configs.theme.primaryColor,
              secondaryColor: restaurant.store.configs.theme.secondaryColor,
              accentColor: restaurant.store.configs.theme.accentColor,
            },
            settings: {
              hours: restaurant.store.configs.settings.hours,
              useCustomHours: restaurant.store.configs.settings.useCustomHours,
              customHours: restaurant.store.configs.settings.customHours,
              deliveryFee: restaurant.store.configs.settings.deliveryFee,
              deliveryZones: restaurant.store.configs.settings.deliveryZones,
              pixKey: restaurant.store.configs.settings.pixKey,
            },
            menu: products as MenuItem[],
          };

          setCurrentRestaurant(restaurantData);
        } else {
          toast.error('Erro ao carregar dados do restaurante');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error('Erro ao carregar restaurante');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [setCurrentRestaurant]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando restaurante...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados do restaurante.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* {!currentRestaurant ? (
        <RestaurantSelector onSelectMode={setAppMode} />
      ) : ( <></> )} */}
      {/* Mode Switch Button - Fixed Position */}
      {/* <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setAppMode(appMode === 'customer' ? 'admin' : 'customer')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors text-sm"
        >
          {appMode === 'customer' ? '👤 Admin' : '🍽️ Cliente'}
        </button>
      </div> */}

      {/* App Content */}
      {appMode === 'customer' ? (
        <CustomerApp />
      ) : (
        <AdminApp />
      )}
    </div>
  );
}