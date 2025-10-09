// src/lib/mappers/order.mapper.ts
import type { IOrderApi, IOrderAddress, IOrderItem } from '@/types/admin/api.types';
import type { Order, CartItem, AddressData } from '@/types';
import type { MenuItem } from '@/types/entities.types';

export class OrderMapper {
  /**
   * Converte pedido da API para formato da aplicação
   */
  static fromApi(apiOrder: IOrderApi, menuItems: MenuItem[]): Order {
    return {
      id: `order-${apiOrder.id}`,
      apiOrderId: apiOrder.id,
      items: this.mapOrderItems(apiOrder.detail.items, menuItems),
      customerInfo: {
        name: apiOrder.customer.name,
        phone: apiOrder.customer.phone || '',
        address: apiOrder.detail.address
          ? this.mapAddress(apiOrder.detail.address)
          : undefined,
      },
      deliveryType: apiOrder.detail.delivery ? 'delivery' : 'pickup',
      status: this.mapStatus(apiOrder.status),
      totalAmount: apiOrder.amount,
      createdAt: new Date(apiOrder.created_at),
      paymentMethod: this.mapPaymentMethod(apiOrder.payment_method),
      paymentStatus: this.getPaymentStatus(apiOrder.status),
      whatsappUrl: apiOrder.whatsapp_url,
    };
  }

  /**
   * Mapeia itens do pedido
   */
  private static mapOrderItems(
    apiItems: IOrderItem[],
    menuItems: MenuItem[]
  ): CartItem[] {
    return apiItems.map((apiItem) => {
      const menuItem = menuItems.find(item => item.id === apiItem.product_id);

      if (!menuItem) {
        console.warn(`⚠️ Produto ${apiItem.product_id} não encontrado no menu`);
        // Retornar item placeholder se não encontrar
        return this.createPlaceholderCartItem(apiItem);
      }

      // Mapear modificadores
      const selectedModifiers: Record<string, string[]> = {};
      if (apiItem.modifiers && menuItem.modifiers) {
        apiItem.modifiers.forEach(mod => {
          if (!selectedModifiers[mod.modifier_id]) {
            selectedModifiers[mod.modifier_id] = [];
          }
          selectedModifiers[mod.modifier_id].push(mod.option_id);
        });
      }

      // Calcular preço do item com modificadores
      const modifiersPrice = this.calculateModifiersPrice(
        apiItem.modifiers || [],
        menuItem
      );

      return {
        id: `${apiItem.product_id}-${Date.now()}`,
        menuItem,
        quantity: apiItem.quantity,
        selectedModifiers,
        totalPrice: menuItem.price + modifiersPrice,
      };
    });
  }

  /**
   * Calcula preço dos modificadores
   */
  private static calculateModifiersPrice(
    modifiers: IOrderItem['modifiers'],
    menuItem: MenuItem
  ): number {
    if (!modifiers || !menuItem.modifiers) return 0;

    let total = 0;
    modifiers.forEach(mod => {
      const modifierGroup = menuItem.modifiers?.find(g => g.id === mod.modifier_id);
      if (modifierGroup) {
        const option = modifierGroup.options.find(o => o.id === mod.option_id);
        if (option) {
          total += option.price;
        }
      }
    });

    return total;
  }

  /**
   * Cria item placeholder quando produto não é encontrado
   */
  private static createPlaceholderCartItem(apiItem: IOrderItem): CartItem {
    return {
      id: `unknown-${apiItem.product_id}`,
      menuItem: {
        id: apiItem.product_id,
        name: `Produto #${apiItem.product_id}`,
        description: 'Produto não encontrado no menu',
        price: 0,
        category: 'Outros',
        available: false,
      },
      quantity: apiItem.quantity,
      selectedModifiers: {},
      totalPrice: 0,
    };
  }

  /**
   * Mapeia endereço da API
   */
  private static mapAddress(apiAddress: IOrderAddress): AddressData {
    return {
      street: apiAddress.street,
      number: apiAddress.number,
      neighborhood: apiAddress.neighborhood,
      postalCode: apiAddress.postalCode,
      complement: apiAddress.complement,
    };
  }

  /**
   * Mapeia status do pedido
   */
  private static mapStatus(apiStatus: string): Order['status'] {
    const statusMap: Record<string, Order['status']> = {
      'pending': 'pending',
      'accepted': 'accepted',
      'preparing': 'preparing',
      'ready': 'ready',
      'delivered': 'delivered',
      'rejected': 'rejected',
      'cancelled': 'rejected',
    };

    return statusMap[apiStatus] || 'pending';
  }

  /**
   * Mapeia método de pagamento
   */
  private static mapPaymentMethod(apiMethod: string): Order['paymentMethod'] {
    const methodMap: Record<string, Order['paymentMethod']> = {
      'pix': 'pix',
      'credit_card': 'card',
      'debit_card': 'card',
      'cash': 'cash',
    };

    return methodMap[apiMethod] || 'pix';
  }

  /**
   * Determina status do pagamento baseado no status do pedido
   */
  private static getPaymentStatus(orderStatus: string): Order['paymentStatus'] {
    if (orderStatus === 'delivered') return 'completed';
    if (orderStatus === 'rejected' || orderStatus === 'cancelled') return 'failed';
    return 'pending';
  }

  /**
   * Converte múltiplos pedidos
   */
  static fromApiArray(apiOrders: IOrderApi[], menuItems: MenuItem[]): Order[] {
    return apiOrders.map(order => this.fromApi(order, menuItems));
  }
}