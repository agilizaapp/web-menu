/**
 * Serviço para dados mockados em modo demo
 */

import { mockRestaurants, mockMenuItems } from '@/data/mockData';
import type { Restaurant, MenuItem } from '@/types/entities.types';
import type { IGetAllProductsApiResponse } from '@/types/restaurant/api.types';

export class DemoService {
  /**
   * Retorna dados mockados do restaurante
   */
  static getMockRestaurantData(): IGetAllProductsApiResponse {
    const mockRestaurant = mockRestaurants[0]; // Usar o primeiro restaurante mock
    
    const defaultCustomHours = {
      monday: { open: '00:00', close: '00:00', closed: true },
      tuesday: { open: '00:00', close: '00:00', closed: true },
      wednesday: { open: '00:00', close: '00:00', closed: true },
      thursday: { open: '00:00', close: '00:00', closed: true },
      friday: { open: '00:00', close: '00:00', closed: true },
      saturday: { open: '00:00', close: '00:00', closed: true },
      sunday: { open: '00:00', close: '00:00', closed: true },
    };

    return {
      store: {
        name: mockRestaurant.theme.name || mockRestaurant.name || 'Demo',
        type: "restaurant",
        configs: {
          theme: {
            logo: mockRestaurant.theme.logo || '',
            primaryColor: mockRestaurant.theme.primaryColor || '#000000',
            secondaryColor: mockRestaurant.theme.secondaryColor || '#FFFFFF',
            accentColor: mockRestaurant.theme.accentColor || '#888888',
          },
          settings: {
            hours: mockRestaurant.settings.hours || '00:00 - 00:00',
            useCustomHours: Boolean(mockRestaurant.settings.useCustomHours),
            customHours: mockRestaurant.settings.customHours || defaultCustomHours,
            deliverySettings: mockRestaurant.settings.deliverySettings || [
              { distance: 5001, value: 10 },
              { distance: 3001, value: 7 },
              { distance: 0, value: 5 }
            ],
            deliveryZones: mockRestaurant.settings.deliveryZones || ["Centro", "Zona Sul"],
            pixKey: mockRestaurant.settings.pixKey || "demo@restaurant.com",
            address: mockRestaurant.settings.address || "Rua Demo, 123",
            pickUpLocation: mockRestaurant.settings.pickUpLocation || {
              street: "Rua da Justiça",
              number: "2487",
              neigborhood: "Jardim Imperial",
              postalCode: "79630802",
              mapsUrl: "https://maps.app.goo.gl/demo"
            },
          }
        }
      },
      customer: {
        name: "Cliente Demo",
        phone: "(67) 99999-9999",
        address: {
          street: "Rua Demo",
          number: "1431",
          neighborhood: "Jardim Demo",
          postalCode: "79603070",
          complement: ""
        }
      },
      categories: Array.from(new Set(mockMenuItems.map(item => item.category))),
      products: mockMenuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        category: item.category,
        price: item.price,
        available: item.available,
        modifiers: item.modifiers,
        // Campos de destaque
        isHighlighted: item.isHighlighted,
        highlightType: item.highlightType,
        highlightLabel: item.highlightLabel,
        orderCount: item.orderCount,
      }))
    };
  }

  /**
   * Retorna dados mockados de um cliente específico
   */
  static getMockCustomerData(phone: string) {
    return {
      id: 1,
      name: "Cliente Demo",
      phone: phone,
      address: {
        street: "Rua Demo",
        number: "1431",
        neighborhood: "Jardim Demo",
        postalCode: "79603070",
        complement: "",
        distance: 3142
      }
    };
  }

  /**
   * Simula delay de API
   */
  static async delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
