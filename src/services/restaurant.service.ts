import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Restaurant, Menu } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export class RestaurantsService {
  static async getAll(): Promise<Restaurant[]> {
    const { data } = await apiClient.get<ApiResponse<Restaurant[]>>(
      API_ENDPOINTS.restaurants.list
    );
    return data.data;
  }

  static async getById(id: number): Promise<Restaurant> {
    const { data } = await apiClient.get<ApiResponse<Restaurant>>(
      API_ENDPOINTS.restaurants.byId(id)
    );
    return data.data;
  }

  static async getMenu(restaurantId: number): Promise<Menu> {
    const { data } = await apiClient.get<ApiResponse<Menu>>(
      API_ENDPOINTS.restaurants.menu(restaurantId)
    );
    return data.data;
  }

  static async updateSettings(
    id: string,
    settings: Partial<Restaurant['settings']>
  ): Promise<Restaurant> {
    const { data } = await apiClient.patch<ApiResponse<Restaurant>>(
      API_ENDPOINTS.restaurants.byId(id),
      { settings }
    );
    return data.data;
  }
}