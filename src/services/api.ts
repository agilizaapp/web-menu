// API Base URL - configurar no .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  complement?: string;
}

interface CustomerData {
  phone?: string;
  name?: string;
  birthdate?: string;
  address?: AddressData;
}

export interface CustomerResponse {
  id?: number;
  name: string;
  phone: string;
  address?: AddressData | null;
}

export interface ConfigResponse {
  store: Record<string, unknown>;
  customer: CustomerResponse;
  categories?: unknown[];
  [key: string]: unknown; // Permite outros campos dinâmicos
}

export interface ReorderResponse {
  token: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    address: AddressData;
  };
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
  customer?: CustomerData | { address: AddressData }; // CustomerData completo (novo cliente) ou apenas {address} (token)
  order: {
    items: OrderItem[];
    payment_method: 'pix' | 'credit_card';
    delivery: boolean;
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
   * Busca configuração com dados do cliente autenticado
   * Requisição inicial que traz produtos/cardápio e, se autenticado, dados do cliente
   */
  async getConfig(token?: string): Promise<ConfigResponse> {
    try {
      const url = `${API_BASE_URL}/product?config=true`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error!`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  /**
   * Busca dados do cliente por telefone
   */
  async getCustomerByPhone(phone: string): Promise<CustomerResponse | null> {
    try {
      const url = `${API_BASE_URL}/customer/${phone}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null; // Cliente não encontrado
      }

      if (!response.ok) {
        throw new Error(`HTTP error!`);
      }

      const data = await response.json();
      
      // A API pode retornar {customer: {...}} ou {...} diretamente
      if (data.customer) {
        return data.customer;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  /**
   * Cria um novo pedido
   */
  async createOrder(payload: CreateOrderPayload, customerToken?: string): Promise<CreateOrderResponse> {
    try {
      const url = `${API_BASE_URL}/order`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (customerToken) {
        headers['Authorization'] = `${customerToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Se a API retornar direto sem wrapper {success: true, data: {...}}
      // Normalizar para o formato esperado
      if (!data.success && data.orderId) {
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
   * Busca dados do pedido para recompra
   */
  async getReorderData(orderId: number): Promise<ReorderResponse> {
    try {
      const url = `${API_BASE_URL}/order/${orderId}/reorder`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reorder data:', error);
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
