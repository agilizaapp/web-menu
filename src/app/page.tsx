'use client';

import { useEffect, useRef, useState } from 'react';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { useCustomerStore } from '@/stores';
import { cookieService } from '@/services/cookies';
import { RestaurantsService } from '@/services/restaurant/restaurant.service';
import { toast } from 'sonner';
import { ApiError } from '@/lib/utils/api-error';
import type { MenuItem } from '@/types/entities.types';
import type { AddressData } from '@/types';
import { CustomerApp } from '@/components/CustomerApp';

/* mock */
import { RestaurantSelector } from '@/components/RestaurantSelector';
// import { mockRestaurants, mockRestaurantData } from '@/data/mockData';
import { LoaderCircle } from 'lucide-react';

type AppMode = 'customer' | 'admin';

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const [isLoading, setIsLoading] = useState(true);
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantStore();
  const { setCustomer } = useCustomerStore();

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
              deliverySettings: restaurant.store.configs.settings.deliverySettings,
              deliveryZones: restaurant.store.configs.settings.deliveryZones,
              pixKey: restaurant.store.configs.settings.pixKey,
              address: restaurant.store.configs.settings.address,
              pickUpLocation: restaurant.store.configs.settings.pickUpLocation,
            },
            menu: products as MenuItem[],
          };

          setCurrentRestaurant(restaurantData);

          // Se a API retornou dados do customer, salvar no store
          if (restaurant.customer) {
            const token = cookieService.getCustomerToken();
            if (token) {
              // NÃO atualizar o telefone - API retorna mascarado (67)*****1768
              // O telefone completo já está salvo no localStorage
              const currentPhone = useCustomerStore.getState().phone;

              setCustomer({
                token,
                name: restaurant.customer.name,
                phone: currentPhone || restaurant.customer.phone, // Usa o que já estava salvo
                address: restaurant.customer.address || undefined,
              });

              // Mensagem de boas-vindas
              toast.success(`Bem-vindo de volta, ${restaurant.customer.name}!`);

              // Se tivermos distância do cliente e regras de entrega, calcular e mostrar a taxa
              try {
                // Tratar address usando o tipo conhecido quando possível
                const customerAddr = restaurant.customer.address as unknown as Partial<AddressData> | undefined;
                const deliverySettings = restaurant.store?.configs?.settings?.deliverySettings ?? [];

                // O campo de distância pode não existir no tipo, fazer parsing seguro
                const rawDist = customerAddr
                  ? ((customerAddr as Partial<AddressData>).distance ?? (customerAddr as Record<string, unknown>)['dist'])
                  : null;
                const custDist = rawDist != null ? Number(String(rawDist)) : NaN;

                if (!isNaN(custDist) && Array.isArray(deliverySettings) && deliverySettings.length > 0) {
                  // Ordenar por distance desc para achar o primeiro threshold que o cliente alcance
                  const sorted = [...deliverySettings].sort((a, b) => Number(b.distance) - Number(a.distance));
                  const matched = sorted.find(s => custDist >= Number(s.distance)) ?? sorted[sorted.length - 1];
                  const fee = matched?.value;
                  if (fee != null) {
                    // Formatar como moeda simples (BRL)
                    const feeLabel = typeof Intl !== 'undefined' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(fee)) : `R$${fee}`;
                    toast(`Taxa de entrega: ${feeLabel} — distância: ${custDist}m`, { icon: '🛵' });
                  }

                  // Se houver pickUpLocation no settings, mostrar também informações de retirada
                  type PickupLocation = {
                    street?: string;
                    address?: string;
                    number?: string | number;
                    neigborhood?: string;
                    neighborhood?: string;
                    postalCode?: string;
                    postalcode?: string;
                    zip?: string;
                    mapsUrl?: string;
                    mapUrl?: string;
                  };

                  const pickup = restaurant.store?.configs?.settings?.pickUpLocation as Partial<PickupLocation> | undefined;
                  if (pickup) {
                    const street = pickup.street ?? pickup.address ?? '';
                    const number = pickup.number ? String(pickup.number) : '';
                    const neighborhood = pickup.neigborhood ?? pickup.neighborhood ?? '';
                    const postal = pickup.postalCode ?? pickup.postalcode ?? pickup.zip ?? '';
                    const parts: string[] = [];
                    if (street) parts.push(number ? `${street}, ${number}` : street);
                    if (neighborhood) parts.push(neighborhood);
                    const pickupLabel = parts.join(' - ');
                    const mapUrl = pickup.mapsUrl ?? pickup.mapUrl ?? '';

                    const pickupMsg = `${pickupLabel}${postal ? ` • CEP ${postal}` : ''}${mapUrl ? ` — mapa: ${mapUrl}` : ''}`;
                    toast.info(`Local de retirada: ${pickupMsg}`, { icon: '📍' });
                  }
                }
              } catch (err) {
                // Não bloquear fluxo principal se cálculo falhar
                console.warn('Erro ao calcular taxa de entrega:', err);
              }
            }
          }

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
  }, [setCurrentRestaurant, setCustomer]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex-1 flex items-center justify-center">
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
        
        {/* Versão no rodapé */}
        <div className="pb-8">
          <p className="text-xs text-muted-foreground/50">v0.1.1</p>
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
    <div className="min-h-dvh bg-background">
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
        <></>
      )}
    </div>
  );
}