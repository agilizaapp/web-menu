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
    orderId: number;
    token: string;
    pix?: {
      copyAndPaste: string;
    };
    status?: string;
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
      const url = `${API_BASE_URL}/order`;
      console.log('🌐 API_BASE_URL:', API_BASE_URL);
      console.log('🔗 Request URL:', url);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      // Se a API retornar direto sem wrapper {success: true, data: {...}}
      // Normalizar para o formato esperado
      if (!data.success && data.orderId) {
        console.log('⚠️ API retornou sem wrapper, normalizando...');
        return {
          success: true,
          data: data
        };
      }
      
      return data;
    } catch (error) {
      console.error('💥 Error creating order:', error);
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
