# Fix: Payment Method e Delivery Type no Payload da API

## 🐛 Problemas Identificados

### 1. **Payload Incompleto**
- ❌ `payment_method` não estava sendo enviado
- ❌ `delivery` (true/false) não estava sendo enviado
- ✅ **Corrigido**: Ambos os campos agora são incluídos no payload

### 2. **Requisições Duplicadas**
- ❌ Service Worker interceptava requisições de API
- ❌ Causava duplicação de requests no localhost
- ✅ **Corrigido**: Service Worker agora ignora requisições de API

## 📦 Estrutura do Payload (Após Correção)

### Exemplo Completo

```json
{
  "customer": {
    "phone": "5567984299967",
    "name": "João da Silva",
    "birthdate": "1990-01-15",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "neighborhood": "Centro",
      "postalCode": "01310-100",
      "complement": "Apto 45"
    }
  },
  "order": {
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "modifiers": [
          {
            "modifier_id": "mod-1",
            "option_id": "opt-1"
          }
        ]
      }
    ],
    "payment_method": "pix",
    "delivery": true
  }
}
```

### Campos Adicionados

| Campo | Tipo | Valores Possíveis | Descrição |
|-------|------|-------------------|-----------|
| `order.payment_method` | `string` | `"pix"` ou `"credit_card"` | Método de pagamento escolhido |
| `order.delivery` | `boolean` | `true` ou `false` | `true` = entrega, `false` = retirada |

### Mapeamento de Valores

#### Payment Method
```typescript
// Frontend → API
"pix"  → "pix"
"card" → "credit_card"
```

#### Delivery Type
```typescript
// Frontend → API
"delivery" → true
"pickup"   → false
```

## 🔧 Arquivos Modificados

### 1. **src/services/api.ts**

**Interface atualizada:**
```typescript
interface CreateOrderPayload {
  customer: CustomerData;
  order: {
    items: OrderItem[];
    payment_method: 'pix' | 'credit_card';  // ✅ NOVO
    delivery: boolean;                       // ✅ NOVO
  };
}
```

### 2. **src/utils/orderUtils.ts**

**Interface CheckoutFormData atualizada:**
```typescript
interface CheckoutFormData {
  deliveryType: 'delivery' | 'pickup';
  address: AddressData | string;
  paymentMethod: 'pix' | 'card';  // ✅ NOVO
}
```

**Função createOrderPayload atualizada:**
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
      payment_method: checkoutData.paymentMethod === 'pix' ? 'pix' : 'credit_card',  // ✅
      delivery: checkoutData.deliveryType === 'delivery',  // ✅
    },
  };
  
  // ... resto do código
}
```

### 3. **public/sw.js**

**Service Worker corrigido:**
```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ✅ Ignora requisições de API (evita duplicação)
  if (url.hostname === 'localhost' && url.port === '3001') {
    return; // Deixa o browser fazer a requisição normalmente
  }
  
  // Para outras requisições, passa adiante sem cache
  event.respondWith(fetch(event.request));
});
```

## 📊 Cenários de Uso

### Cenário 1: Entrega com PIX
```json
{
  "order": {
    "payment_method": "pix",
    "delivery": true
  }
}
```

### Cenário 2: Retirada com PIX
```json
{
  "order": {
    "payment_method": "pix",
    "delivery": false
  }
}
```
- ⚠️ **Importante**: Quando `delivery: false`, o campo `customer.address` não é enviado

### Cenário 3: Entrega com Cartão
```json
{
  "order": {
    "payment_method": "credit_card",
    "delivery": true
  }
}
```

### Cenário 4: Retirada com Cartão
```json
{
  "order": {
    "payment_method": "credit_card",
    "delivery": false
  }
}
```

## 🔍 Validação do Payload

A função `validateOrderPayload` continua funcionando normalmente e valida:

- ✅ Telefone válido (mínimo 12 dígitos com DDI)
- ✅ Nome válido (mínimo 3 caracteres)
- ✅ Endereço completo (se `delivery: true`)
- ✅ Items do carrinho (não vazio)
- ✅ Quantidade válida para cada item

## 🧪 Como Testar

### 1. **Testar Payload PIX + Entrega**

```typescript
const checkoutData = {
  deliveryType: 'delivery',
  address: {
    street: 'Rua Teste',
    number: '123',
    neighborhood: 'Centro',
    postalCode: '12345678'
  },
  paymentMethod: 'pix'
};

// Resultado esperado:
// payment_method: "pix"
// delivery: true
// customer.address: { ... }
```

### 2. **Testar Payload Cartão + Retirada**

```typescript
const checkoutData = {
  deliveryType: 'pickup',
  address: 'Endereço do Restaurante',
  paymentMethod: 'card'
};

// Resultado esperado:
// payment_method: "credit_card"
// delivery: false
// customer.address: undefined (não enviado)
```

### 3. **Verificar no DevTools**

1. Abra o DevTools (F12)
2. Vá em **Network** → **Fetch/XHR**
3. Faça um pedido
4. Clique na requisição `POST /order`
5. Vá em **Payload** → Verifique:
   ```json
   {
     "order": {
       "payment_method": "pix" ou "credit_card",
       "delivery": true ou false
     }
   }
   ```

### 4. **Verificar Duplicação (Service Worker)**

**Antes da correção:**
```
Network Tab:
POST /order (service worker)
POST /order (fetch)
```

**Depois da correção:**
```
Network Tab:
POST /order (fetch) ✅ Apenas uma requisição
```

## 🚨 Troubleshooting

### Problema: Service Worker ainda intercepta requisições

**Solução:** Limpar o Service Worker

1. DevTools → Application → Service Workers
2. Click "Unregister"
3. Recarregue a página (Ctrl+F5)
4. O novo Service Worker será registrado

Ou via console:
```javascript
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
```

### Problema: payment_method ou delivery ainda não aparecem

**Verificar:**

1. ✅ Arquivo `orderUtils.ts` foi atualizado?
2. ✅ Arquivo `api.ts` foi atualizado?
3. ✅ Projeto foi recompilado? (Reinicie o `pnpm dev`)
4. ✅ Browser cache foi limpo? (Ctrl+Shift+R)

## 📝 Notas Importantes

### Endereço (address)
- ✅ Enviado apenas quando `delivery: true`
- ❌ NÃO enviado quando `delivery: false` (retirada)
- 💡 Economiza dados e evita confusão na API

### Telefone
- ✅ Sempre sanitizado: `(67) 98429-9967` → `5567984299967`
- ✅ DDI do Brasil (`55`) adicionado automaticamente se não presente

### Data de Nascimento
- ✅ Formato: `YYYY-MM-DD` (ex: `1990-01-15`)
- ✅ Campo opcional

## 🎯 Checklist de Integração

Ao integrar com a API, verificar:

- [ ] API aceita `payment_method` como `"pix"` ou `"credit_card"`
- [ ] API aceita `delivery` como `true` ou `false`
- [ ] API processa corretamente quando `address` está ausente (`delivery: false`)
- [ ] API retorna `orderId`, `token` e `pix.copyAndPaste` (se PIX)
- [ ] Endpoint: `POST /order`
- [ ] Content-Type: `application/json`

## 🔄 Fluxo Completo

```
1. Cliente preenche dados (RegisterModals)
   ↓
2. Cliente escolhe entrega/retirada + pagamento (CheckoutPage)
   ↓
3. PaymentFlow cria payload com:
   - customer (phone, name, birthdate, address?)
   - order.items
   - order.payment_method ✅
   - order.delivery ✅
   ↓
4. Envia para API (POST /order)
   ↓
5. API retorna orderId + token + pix (se PIX)
   ↓
6. Exibe tela de pagamento/confirmação
```

---

**Versão**: 1.1.0  
**Data**: Outubro 2025  
**Status**: ✅ Corrigido e Testado
