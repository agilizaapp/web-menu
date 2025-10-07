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
 * Se tiver token (cliente autenticado), envia token ao invés dos dados do customer
 * Só envia address se foi modificado pelo usuário
 */
export function createOrderPayload(
  customerData: CustomerFormData,
  checkoutData: CheckoutFormData,
  cartItems: CartItem[],
  options?: {
    customerToken?: string | null;
    originalAddress?: AddressData | null;
    currentAddress?: AddressData;
  }
): CreateOrderPayload {
  const { customerToken, originalAddress, currentAddress } = options || {};

  // Se tem token, usa autenticação por token
  if (customerToken) {
    const payload: CreateOrderPayload = {
      token: customerToken, // ✅ Incluir o token!
      order: {
        items: cartItems.map(convertCartItemToOrderItem),
        payment_method: checkoutData.paymentMethod === 'pix' ? 'pix' : 'credit_card',
        delivery: checkoutData.deliveryType === 'delivery',
      },
    };

    // Só envia customer.address se for entrega E o endereço foi modificado
    if (checkoutData.deliveryType === 'delivery' && currentAddress) {
      const addressWasModified = !originalAddress || 
        originalAddress.street !== currentAddress.street ||
        originalAddress.number !== currentAddress.number ||
        originalAddress.neighborhood !== currentAddress.neighborhood ||
        originalAddress.postalCode !== currentAddress.postalCode ||
        originalAddress.complement !== currentAddress.complement;

      if (addressWasModified) {
        payload.customer = {
          address: currentAddress,
        };
      }
    }

    return payload;
  }

  // Cliente novo - envia dados completos
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
    if (typeof checkoutData.address === 'object') {
      payload.customer!.address = checkoutData.address;
    }
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

  // Se tem token, validação simplificada
  if (payload.token) {
    // Validar apenas se tem customer.address (caso tenha sido modificado)
    if (payload.customer?.address) {
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
      // Se o CEP tem asterisco (mascarado), não valida
      if (!addr.postalCode) {
        errors.push('Endereço: CEP é obrigatório');
      } else if (!addr.postalCode.includes('*') && addr.postalCode.replace(/\D/g, '').length !== 8) {
        errors.push('Endereço: CEP inválido');
      }
    }
  } else {
    // Cliente novo - validação completa
    if (!payload.customer) {
      errors.push('Dados do cliente são obrigatórios');
    } else {
      // Validar telefone
      if (!payload.customer.phone) {
        errors.push('Telefone é obrigatório');
      } else if (!payload.customer.phone.includes('*') && payload.customer.phone.length < 12) {
        // Só valida comprimento se NÃO for mascarado
        errors.push('Telefone inválido');
      }

      // Validar nome
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
