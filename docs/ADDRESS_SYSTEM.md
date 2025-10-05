# 📍 Sistema de Endereço Detalhado

## 📋 Visão Geral

O sistema de endereço foi atualizado para coletar informações detalhadas conforme exigido pela API:
- **Rua** (street)
- **Número** (number)
- **Bairro** (neighborhood)
- **CEP** (postalCode) - formatado automaticamente como XXXXX-XXX
- **Complemento** (complement) - opcional

---

## 🏗️ Estrutura de Dados

### Tipo AddressData

```typescript
export interface AddressData {
  street: string;         // Rua
  number: string;         // Número
  neighborhood: string;   // Bairro
  postalCode: string;     // CEP (formatado: 12345-678)
  complement?: string;    // Complemento (opcional)
}
```

### Payload da API

```typescript
{
  customer: {
    phone: "5567984299967",
    name: "João Silva",
    birthdate: "1990-01-15",
    address: {
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      postalCode: "12345-678",
      complement: "Apto 101"  // opcional
    }
  },
  order: {
    items: [...]
  }
}
```

---

## 📁 Arquivos Modificados

### 1. `src/types/index.ts`
```typescript
// Novo tipo exportado
export interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  complement?: string;
}

// Order atualizado para aceitar AddressData ou string
export interface Order {
  customerInfo: {
    name: string;
    phone: string;
    address: string | AddressData; // ← Atualizado
  };
  // ...
}
```

### 2. `src/services/api.ts`
```typescript
export interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  postalCode: string;
  complement?: string;
}

interface CustomerData {
  phone: string;
  name: string;
  birthdate?: string;
  address?: AddressData; // ← Atualizado de string para AddressData
}
```

### 3. `src/components/customer/CheckoutPage.tsx`

#### Estado do Componente:
```typescript
const [addressData, setAddressData] = useState<AddressData>({
  street: "",
  number: "",
  neighborhood: "",
  postalCode: "",
  complement: "",
});

const [addressErrors, setAddressErrors] = useState<
  Partial<Record<keyof AddressData, string>>
>({});
```

#### Validação Individual por Campo:
```typescript
const validateAddressField = (
  field: keyof AddressData, 
  value: string
): string => {
  switch (field) {
    case 'street':
      if (!value.trim()) return "Rua é obrigatória";
      if (value.trim().length < 3) return "Rua muito curta";
      return "";
    case 'number':
      if (!value.trim()) return "Número é obrigatório";
      return "";
    case 'neighborhood':
      if (!value.trim()) return "Bairro é obrigatório";
      if (value.trim().length < 3) return "Bairro muito curto";
      return "";
    case 'postalCode':
      if (!value.trim()) return "CEP é obrigatório";
      const numbers = value.replace(/\D/g, '');
      if (numbers.length !== 8) return "CEP deve ter 8 dígitos";
      return "";
    case 'complement':
      return ""; // Opcional
    default:
      return "";
  }
};
```

#### Formatação Automática de CEP:
```typescript
const handleAddressChange = (field: keyof AddressData, value: string) => {
  let sanitized = value.replace(/[<>"'`]/g, "");
  
  // Formatação especial para CEP
  if (field === 'postalCode') {
    sanitized = sanitized.replace(/\D/g, ''); // Remove não-numéricos
    if (sanitized.length > 8) sanitized = sanitized.slice(0, 8); // Max 8 dígitos
    
    // Formata como XXXXX-XXX
    if (sanitized.length > 5) {
      sanitized = `${sanitized.slice(0, 5)}-${sanitized.slice(5)}`;
    }
  }
  
  setAddressData(prev => ({ ...prev, [field]: sanitized }));
  
  // Limpa erro ao digitar
  if (addressErrors[field]) {
    setAddressErrors(prev => ({ ...prev, [field]: "" }));
  }
};
```

#### Formulário HTML:
```tsx
{deliveryType === "delivery" ? (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Rua - Ocupa 2 colunas em desktop */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="street">
          Rua <span className="text-destructive">*</span>
        </Label>
        <Input
          id="street"
          placeholder="Nome da rua"
          value={addressData.street}
          onChange={(e) => handleAddressChange('street', e.target.value)}
          onBlur={() => {
            if (addressData.street) {
              const error = validateAddressField('street', addressData.street);
              if (error) setAddressErrors(prev => ({ ...prev, street: error }));
            }
          }}
          className={addressErrors.street ? "border-destructive" : ""}
        />
        {addressErrors.street && (
          <p className="text-sm text-destructive">{addressErrors.street}</p>
        )}
      </div>

      {/* Número */}
      <div className="space-y-2">
        <Label htmlFor="number">Número *</Label>
        <Input id="number" placeholder="123" ... />
      </div>

      {/* Bairro */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input id="neighborhood" placeholder="Centro" ... />
      </div>

      {/* CEP */}
      <div className="space-y-2">
        <Label htmlFor="postalCode">CEP *</Label>
        <Input 
          id="postalCode" 
          placeholder="12345-678"
          maxLength={9} 
          ... 
        />
      </div>

      {/* Complemento - Opcional */}
      <div className="space-y-2">
        <Label htmlFor="complement">Complemento (Opcional)</Label>
        <Input id="complement" placeholder="Apto 101, Bloco B..." ... />
      </div>
    </div>
  </div>
) : (
  // Endereço do restaurante para retirada
  <div className="p-4 bg-muted/50 rounded-lg">
    <p className="font-medium text-sm">Local de Retirada:</p>
    <p className="text-sm text-muted-foreground">
      {restaurantAddress}
    </p>
  </div>
)}
```

### 4. `src/utils/orderUtils.ts`

#### Interface Atualizada:
```typescript
interface CheckoutFormData {
  deliveryType: 'delivery' | 'pickup';
  address: AddressData | string; // ← Pode ser objeto ou string
}
```

#### Criação do Payload:
```typescript
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

  // Adiciona endereço somente se for entrega E for objeto AddressData
  if (checkoutData.deliveryType === 'delivery') {
    if (typeof checkoutData.address === 'object') {
      payload.customer.address = checkoutData.address;
    }
    // Se for string (restaurantAddress), não adiciona ao payload
  }

  return payload;
}
```

#### Validação do Endereço:
```typescript
export function validateOrderPayload(payload: CreateOrderPayload): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // ... validações anteriores

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

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 5. `src/components/customer/PaymentFlow.tsx`

#### Interface Atualizada:
```typescript
import type { AddressData } from "@/types";

interface CheckoutData {
  deliveryType: "delivery" | "pickup";
  address: AddressData | string; // ← Atualizado
  paymentMethod: "pix" | "card";
}
```

#### Salvamento no Store:
```typescript
const localOrder = {
  id: finalOrderData.orderId,
  apiOrderId: finalOrderData.apiOrderId,
  apiToken: finalOrderData.apiToken,
  items: cart,
  customerInfo: {
    name: customerData.name,
    phone: customerData.phone,
    address: checkoutData.address, // ← Pode ser AddressData ou string
  },
  deliveryType: checkoutData.deliveryType,
  status: "pending" as const,
  totalAmount: finalTotal,
  createdAt: new Date(),
  paymentMethod: checkoutData.paymentMethod,
  paymentStatus: "pending" as const,
  pixCode: pixCode || undefined,
};

addOrder(localOrder);
```

---

## 🎯 Fluxo de Dados

### Cenário 1: Entrega (Delivery)
```
1. Usuário preenche formulário de endereço detalhado
   → Rua, Número, Bairro, CEP, Complemento
   
2. CheckoutPage valida cada campo individualmente
   → validateAddressField() por campo
   → Formatação automática do CEP
   
3. Ao clicar "Continuar para Pagamento"
   → validateAllAddressFields()
   → Se inválido: mostra erros
   → Se válido: onProceedToPayment({ address: AddressData })
   
4. PaymentFlow recebe checkoutData.address (AddressData)
   → createOrderPayload() converte para payload da API
   → Envia para API com address: { street, number, neighborhood, postalCode }
   
5. Pedido salvo no store com address completo
   → Order.customerInfo.address = AddressData
```

### Cenário 2: Retirada (Pickup)
```
1. Usuário seleciona "Retirada no Local"
   → Campos de endereço não aparecem
   → Mostra endereço do restaurante
   
2. Ao clicar "Continuar para Pagamento"
   → onProceedToPayment({ address: restaurantAddress (string) })
   
3. PaymentFlow recebe checkoutData.address (string)
   → createOrderPayload() detecta que é string
   → NÃO adiciona address ao payload da API
   
4. Pedido salvo no store com endereço do restaurante
   → Order.customerInfo.address = string
```

---

## 🧪 Validações

### Frontend (CheckoutPage):

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| Rua | ✅ Sim | Min 3 caracteres |
| Número | ✅ Sim | Não pode estar vazio |
| Bairro | ✅ Sim | Min 3 caracteres |
| CEP | ✅ Sim | Exatamente 8 dígitos (formatado XXXXX-XXX) |
| Complemento | ❌ Opcional | Sem validação |

### Validação no Payload (orderUtils):

```typescript
✅ Rua: mínimo 3 caracteres
✅ Número: não vazio
✅ Bairro: mínimo 3 caracteres
✅ CEP: exatamente 8 dígitos (sem formatação)
```

---

## 🎨 UX/UI

### Layout Responsivo:
```
Desktop (md e acima):
┌────────────────────────────────────┐
│ Rua: [...........................]  │ ← 2 colunas
├──────────────────┬─────────────────┤
│ Número: [......] │ Bairro: [.....] │
├──────────────────┼─────────────────┤
│ CEP: [........]  │ Complemento:    │
│                  │ [.............] │
└──────────────────┴─────────────────┘

Mobile (< md):
┌────────────────────────────────────┐
│ Rua: [...........................]  │
├────────────────────────────────────┤
│ Número: [........................] │
├────────────────────────────────────┤
│ Bairro: [........................] │
├────────────────────────────────────┤
│ CEP: [...........................] │
├────────────────────────────────────┤
│ Complemento: [..................]  │
└────────────────────────────────────┘
```

### Feedback Visual:
- **Campo inválido**: Borda vermelha + mensagem de erro abaixo
- **CEP**: Formatação automática ao digitar (12345678 → 12345-678)
- **Validação**: Ao perder foco (onBlur) ou ao submeter
- **Sanitização**: Remove caracteres perigosos (<>"'`)

---

## 📊 Exemplo de Dados

### Entrada do Usuário:
```
Rua: Rua das Flores
Número: 123
Bairro: Centro
CEP: 12345678 (usuário digita sem formatação)
Complemento: Apto 101, Bloco B
```

### Estado Interno (addressData):
```typescript
{
  street: "Rua das Flores",
  number: "123",
  neighborhood: "Centro",
  postalCode: "12345-678", // ← Formatado automaticamente
  complement: "Apto 101, Bloco B"
}
```

### Payload Enviado para API:
```json
{
  "customer": {
    "phone": "5567984299967",
    "name": "João Silva",
    "birthdate": "1990-01-15",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "neighborhood": "Centro",
      "postalCode": "12345-678",
      "complement": "Apto 101, Bloco B"
    }
  },
  "order": {
    "items": [...]
  }
}
```

---

## ✅ Checklist de Implementação

- [x] Criar tipo `AddressData` em `types/index.ts`
- [x] Exportar `AddressData` de `services/api.ts`
- [x] Atualizar `CustomerData.address` para `AddressData | undefined`
- [x] Atualizar `Order.customerInfo.address` para `string | AddressData`
- [x] Adicionar estado `addressData` no `CheckoutPage`
- [x] Criar função `validateAddressField` para validação individual
- [x] Criar função `handleAddressChange` com formatação de CEP
- [x] Criar formulário com 5 campos (rua, número, bairro, CEP, complemento)
- [x] Adicionar layout responsivo (grid 2 colunas em desktop)
- [x] Implementar feedback visual de erros por campo
- [x] Atualizar `createOrderPayload` para lidar com `AddressData | string`
- [x] Atualizar `validateOrderPayload` para validar campos do endereço
- [x] Atualizar `PaymentFlow` para aceitar `AddressData | string`
- [x] Testar fluxo completo (entrega + retirada)

---

## 🚀 Próximos Passos Sugeridos

1. **Integração com API de CEP**
   - Buscar endereço automaticamente ao digitar CEP
   - ViaCEP, BrasilAPI, etc.

2. **Autocomplete de Endereço**
   - Google Places API
   - Mapbox Geocoding

3. **Validação de CEP Real**
   - Verificar se CEP existe
   - Validar formato por estado

4. **Salvar Endereços Favoritos**
   - Permitir usuário salvar múltiplos endereços
   - Selecionar endereço salvo em próximo pedido

5. **Cálculo de Frete Dinâmico**
   - Calcular taxa de entrega baseado no CEP
   - Mostrar tempo estimado de entrega

---

## 📝 Notas Importantes

- O campo **Complemento** é opcional
- O **CEP** é automaticamente formatado como XXXXX-XXX
- Para **retirada**, o endereço do restaurante é usado (string)
- Para **entrega**, o endereço detalhado é coletado (AddressData)
- Todos os campos são sanitizados (remove <>"'`)
- A validação acontece ao perder foco (onBlur) e ao submeter
