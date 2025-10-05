import { CartItem } from '@/types';
import type { CreateOrderPayload, OrderItem, OrderModifier } from '@/services/api';

interface CustomerFormData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutFormData {
  deliveryType: 'delivery' | 'pickup';
  address: string;
}

/**
 * Remove formatação do telefone (XX) XXXXX-XXXX → 5567984299967
 */
export function sanitizePhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se não começa com 55 (código do Brasil), adiciona
  if (!numbers.startsWith('55')) {
    return '55' + numbers;
  }
  
  return numbers;
}

/**
 * Converte data do formato YYYY-MM-DD para o formato da API
 */
export function formatBirthDate(date: string): string | undefined {
  if (!date) return undefined;
  return date; // Já está no formato correto YYYY-MM-DD
}

/**
 * Converte item do carrinho para o formato da API
 */
export function convertCartItemToOrderItem(cartItem: CartItem): OrderItem {
  const modifiers: OrderModifier[] = [];

  // Converte os modificadores selecionados
  Object.entries(cartItem.selectedModifiers).forEach(([modifierId, optionIds]) => {
    optionIds.forEach(optionId => {
      modifiers.push({
        modifier_id: modifierId,
        option_id: optionId,
      });
    });
  });

  return {
    product_id: cartItem.menuItem.id,
    quantity: cartItem.quantity,
    modifiers: modifiers.length > 0 ? modifiers : undefined,
  };
}

/**
 * Cria o payload completo para enviar à API
 */
export function createOrderPayload(
  customerData: CustomerFormData,
  checkoutData: CheckoutFormData,
  cartItems: CartItem[]
): CreateOrderPayload {
  const payload: CreateOrderPayload = {
    customer: {
      phone: sanitizePhone(customerData.phone),
      name: customerData.name,
      birthdate: formatBirthDate(customerData.birthDate),
    },
    order: {
      items: cartItems.map(convertCartItemToOrderItem),
    },
  };

  // Adiciona endereço somente se for entrega
  if (checkoutData.deliveryType === 'delivery') {
    payload.customer.address = checkoutData.address;
  }

  return payload;
}

/**
 * Valida se o payload está correto antes de enviar
 */
export function validateOrderPayload(payload: CreateOrderPayload): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar customer
  if (!payload.customer.phone || payload.customer.phone.length < 12) {
    errors.push('Telefone inválido');
  }

  if (!payload.customer.name || payload.customer.name.trim().length < 3) {
    errors.push('Nome inválido');
  }

  // Validar order items
  if (!payload.order.items || payload.order.items.length === 0) {
    errors.push('Carrinho vazio');
  }

  payload.order.items.forEach((item, index) => {
    if (!item.product_id || item.product_id <= 0) {
      errors.push(`Item ${index + 1}: ID do produto inválido`);
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantidade inválida`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
