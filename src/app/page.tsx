'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminApp } from '@/components/AdminApp';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { RestaurantsService } from '@/services/restaurant.service';
import { toast } from 'sonner';
import { ApiError } from '@/lib/utils/api-error';
import { MenuPage } from '@/components/customer/MenuPage';
import type { MenuItem } from '@/types/entities.types';
import { CustomerApp } from '@/components/CustomerApp';

/* mock */
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { mockRestaurants, mockRestaurantData } from '@/data/mockData';
import { LoaderCircle } from 'lucide-react';

type AppMode = 'customer' | 'admin';

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const [isLoading, setIsLoading] = useState(true);
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantStore();

  const videoRef = useRef<HTMLVideoElement>(null);

  // useEffect(() => {
  //   setIsLoading(true);
  //   if (videoRef.current) {
  //     videoRef.current.play().catch(err => {
  //       console.warn('Autoplay bloqueado:', err);
  //     });
  //   }
  //   setCurrentRestaurant(mockRestaurantData);
  //   setIsLoading(false);
  // }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('Autoplay bloqueado:', err);
      });
    }
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
          setIsLoading(false);
        } else {
          toast.error('Erro ao carregar dados do restaurante');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error('Erro ao carregar restaurante');
        }
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
          <div className="relative w-48 h-48 mx-auto">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
          >
            <source src="/videos/delivery-app-loading.mp4" type="video/mp4" />
            {/* Fallback para navegadores antigos */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </video>
        </div>
          <LoaderCircle className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Buscando os melhores pratos para você...</p>
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
      {!currentRestaurant ? (
        <RestaurantSelector onSelectMode={setAppMode} />
      ) : ( <></> )}
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
        // <AdminApp />
        <></>
      )}
    </div>
  );
}