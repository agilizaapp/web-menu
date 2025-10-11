import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/admin/config';
import type { IGetAllOrdersApiResponse, OrderStatus } from '@/types/admin/api.types';

export class AdminService {
  static async getAllOrders(config?: boolean): Promise<IGetAllOrdersApiResponse> {
    const { data } = await apiClient.get<IGetAllOrdersApiResponse>(
      API_ENDPOINTS.orders.listAll(config)
    );
    return data;
  }

  static async updateOrderStatus(orderId: number, newStatus: OrderStatus): Promise<any> {
    const { data } = await apiClient.put<IGetAllOrdersApiResponse>(
      API_ENDPOINTS.orders.updateStatus(orderId),
      { status: newStatus }
    );
    return data;
  }

  // static async getById(id: number, config?: boolean): Promise<IGetProductByIdStoreApiResponse | MenuItem> {
  //   const { data } = await apiClient.get<IGetProductByIdStoreApiResponse | MenuItem>(
  //     API_ENDPOINTS.product.byId(id, config)
  //   );
  //   return data;
  // }

  // static async getMenu(restaurantId: number): Promise<Menu> {
  //   const { data } = await apiClient.get<ApiResponse<Menu>>(
  //     API_ENDPOINTS.product.menu(restaurantId)
  //   );
  //   return data.data;
  // }

  // static async updateSettings(
  //   id: number,
  //   settings: Partial<Restaurant['settings']>
  // ): Promise<Restaurant> {
  //   const { data } = await apiClient.patch<ApiResponse<Restaurant>>(
  //     API_ENDPOINTS.product.byId(id),
  //     { settings }
  //   );
  //   return data.data;
  // }
}