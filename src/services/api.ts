// API Base URL - configurar no .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CustomerData {
  phone: string;
  name: string;
  birthdate?: string;
  address?: string;
}

interface OrderModifier {
  modifier_id: string;
  option_id: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  modifiers?: OrderModifier[];
}

interface CreateOrderPayload {
  customer: CustomerData;
  order: {
    items: OrderItem[];
  };
}

interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    status: string;
    message?: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export const apiService = {
  /**
   * Cria um novo pedido
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Busca informações de um produto
   */
  async getProduct(productId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Busca todos os produtos
   */
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
};

// Export types
export type {
  CustomerData,
  OrderModifier,
  OrderItem,
  CreateOrderPayload,
  CreateOrderResponse,
};
