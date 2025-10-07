import { CartItem } from '@/types';
import type { CreateOrderPayload, OrderItem, OrderModifier, AddressData } from '@/services/api';

interface CustomerFormData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutFormData {
  deliveryType: 'delivery' | 'pickup';
  address: AddressData | string;
  paymentMethod: 'pix' | 'card';
}

/**
 * Remove formatação do telefone (XX) XXXXX-XXXX → 5567984299967
 */
export function sanitizePhone(phone: string): string {
  // Se o telefone contém asteriscos (mascarado), retorna como está
  // A API saberá lidar com telefones mascarados
  if (phone.includes('*')) {
    return phone;
  }
  
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
      payment_method: checkoutData.paymentMethod === 'pix' ? 'pix' : 'credit_card',
      delivery: checkoutData.deliveryType === 'delivery',
    },
  };

  // Adiciona endereço somente se for entrega
  if (checkoutData.deliveryType === 'delivery') {
    // Se for AddressData (objeto), usa diretamente
    // Se for string (restaurantAddress), converte para objeto simples (não envia para API)
    if (typeof checkoutData.address === 'object') {
      payload.customer.address = checkoutData.address;
    }
    // Se for string, não adiciona ao payload (caso de retirada com endereço do restaurante)
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
  // Se o telefone tem asteriscos (mascarado), aceita - a API vai processar
  if (!payload.customer.phone) {
    errors.push('Telefone é obrigatório');
  } else if (!payload.customer.phone.includes('*') && payload.customer.phone.length < 12) {
    // Só valida comprimento se NÃO for mascarado
    errors.push('Telefone inválido');
  }

  if (!payload.customer.name || payload.customer.name.trim().length < 3) {
    errors.push('Nome inválido');
  }

  // Validar endereço se fornecido
  if (payload.customer.address) {
    const addr = payload.customer.address;
    if (!addr.street || addr.street.trim().length < 3) {
      errors.push('Endereço: Rua inválida');
    }
    if (!addr.number || addr.number.trim().length === 0) {
      errors.push('Endereço: Número inválido');
    }
    if (!addr.neighborhood || addr.neighborhood.trim().length < 3) {
      errors.push('Endereço: Bairro inválido');
    }
    if (!addr.postalCode || addr.postalCode.replace(/\D/g, '').length !== 8) {
      errors.push('Endereço: CEP inválido');
    }
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
