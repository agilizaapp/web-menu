import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/utils/api-error';
import type {
  ICreateProductPayload,
  IUpdateProductPayload,
  IProductApiResponse,
} from '@/types/admin/product.types';

export class ProductService {
  /**
   * Criar novo produto
   */
  static async createProduct(
    payload: ICreateProductPayload
  ): Promise<IProductApiResponse> {
    try {
      const response = await apiClient.post<IProductApiResponse>(
        '/product',
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao criar produto', 500);
    }
  }

  /**
   * Atualizar produto existente
   */
  static async updateProduct(
    productId: number,
    payload: Partial<IUpdateProductPayload>
  ): Promise<IProductApiResponse> {
    try {
      const response = await apiClient.put<IProductApiResponse>(
        `/product/${productId}`,
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao atualizar produto', 500);
    }
  }

  /**
   * Deletar produto
   */
  static async deleteProduct(productId: number): Promise<void> {
    try {
      await apiClient.delete(`/product/${productId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao deletar produto', 500);
    }
  }
}