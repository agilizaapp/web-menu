import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/restaurant/config-restaurant';
import type { Restaurant, Menu, MenuItem } from '@/types/entities.types';
import type { ApiResponse, IGetProductByIdStoreApiResponse, IGetAllProductsApiResponse } from '@/types/restaurant/api.types';
import { isDemoMode } from '@/lib/utils/demo-mode';
import { DemoService } from '@/services/demo/demo.service';

export class RestaurantsService {
  static async getAllProducts(config?: boolean): Promise<IGetAllProductsApiResponse> {
    // Se estiver em modo demo, usar dados mockados
    if (isDemoMode()) {
      await DemoService.delay(800); // Simular delay da API
      return DemoService.getMockRestaurantData();
    }

    const { data } = await apiClient.get<IGetAllProductsApiResponse>(
      API_ENDPOINTS.product.list(config)
    );
    return data;
  }

  static async getById(id: number, config?: boolean): Promise<IGetProductByIdStoreApiResponse | MenuItem> {
    // Se estiver em modo demo, usar dados mockados
    if (isDemoMode()) {
      await DemoService.delay(500);
      const mockData = DemoService.getMockRestaurantData();
      const product = mockData.products.find(p => p.id === id);
      return product || mockData.products[0];
    }

    const { data } = await apiClient.get<IGetProductByIdStoreApiResponse | MenuItem>(
      API_ENDPOINTS.product.byId(id, config)
    );
    return data;
  }

  static async getMenu(restaurantId: number): Promise<Menu> {
    const { data } = await apiClient.get<ApiResponse<Menu>>(
      API_ENDPOINTS.product.menu(restaurantId)
    );
    return data.data;
  }

  static async updateSettings(
    id: number,
    settings: Partial<Restaurant['settings']>
  ): Promise<Restaurant> {
    const { data } = await apiClient.patch<ApiResponse<Restaurant>>(
      API_ENDPOINTS.product.byId(id),
      { settings }
    );
    return data.data;
  }
}