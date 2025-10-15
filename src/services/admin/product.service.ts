import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/utils/api-error';
import type {
  IProductPayload,
  IProductApiResponse
} from '@/types/admin/product.types';

export class ProductService {
  /**
   * Criar novo produto
   */
  static async createProduct(
    payload: IProductPayload
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
   * @returns Resposta específica com estrutura { product: {...} }
   */
  static async updateProduct(
    id: number,
    payload: Partial<IProductPayload>
  ): Promise<IProductPayload> {
    try {
      const response = await apiClient.put<IProductPayload>(
        `/product/${id}`,
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
  static async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/product/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao deletar produto', 500);
    }
  }

  /**
   * Buscar produto por ID
   */
  static async getProductById(id: number): Promise<IProductApiResponse> {
    try {
      const response = await apiClient.get<IProductApiResponse>(
        `/product/${id}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao buscar produto', 500);
    }
  }
}