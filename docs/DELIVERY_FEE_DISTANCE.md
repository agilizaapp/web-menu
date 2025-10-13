# Sistema de Taxa de Entrega por Distância

## Resumo

Sistema implementado para calcular a taxa de entrega automaticamente com base na distância entre o endereço do cliente e o local de retirada do restaurante.

## Estrutura da API

### Endpoint `/products?config=true`

A API agora retorna `deliverySettings` ao invés de `deliveryFee`:

```json
{
  "store": {
    "configs": {
      "settings": {
        "deliverySettings": [
          {
            "distance": 0,      // metros
            "value": 5          // reais
          },
          {
            "distance": 3001,   // 3.001km
            "value": 7
          },
          {
            "distance": 5001,   // 5.001km
            "value": 10
          }
        ]
      }
    }
  }
}
```

### Interpretação das Faixas

A tabela é ordenada por `distance` (metros) e cada tier define o **início** da faixa:

- **0m a 3000m** = R$ 5,00 (distance: 0, value: 5)
- **3001m a 5000m** = R$ 7,00 (distance: 3001, value: 7)
- **5001m ou mais** = R$ 10,00 (distance: 5001, value: 10)

**Exemplo:** Cliente a 2.500m = R$ 5,00 (cai na faixa 0-3000m)

## Payload de Criação de Pedido

### Endpoint `/order` (POST)

Quando o `deliveryType` for `"delivery"`, o campo `distance` (em **metros**) deve ser enviado no payload:

```json
{
  "customer": {
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "postalCode": "79002-000",
      "complement": ""
    }
  },
  "order": {
    "items": [...],
    "payment_method": "pix",
    "delivery": true,
    "distance": 2500  // ← Distância em METROS
  }
}
```

### Fluxo de Cálculo

1. **Cliente preenche endereço completo** (rua, número, bairro, CEP)
2. **Sistema geocodifica** ambos endereços usando **Nominatim API** (OpenStreetMap - gratuita)
3. **Calcula distância** com fórmula de **Haversine** (resultado em metros)
4. **Determina taxa** baseado na tabela `deliverySettings`
5. **Exibe para o cliente:**
   - "Distância: 2.5km - Taxa: R$ 5,00" (toast notification)
   - Componente visual com todas as faixas disponíveis
6. **Envia ao backend:**
   - `distance: 2500` (em metros) no payload da order
   - `deliveryFee: 5` salvo no objeto Order local

## Tipos TypeScript Atualizados

### `DeliverySettings`

```typescript
export interface DeliverySettings {
  distance: number; // em metros
  value: number;    // em reais
}
```

### `RestaurantSettings`

```typescript
export interface RestaurantSettings {
  deliverySettings?: DeliverySettings[];
  // ... outros campos
}
```

### `Order`

```typescript
export interface Order {
  deliveryFee?: number;  // Taxa calculada (R$)
  distance?: number;     // Distância em metros
  // ... outros campos
}
```

### `CreateOrderPayload`

```typescript
interface CreateOrderPayload {
  order: {
    items: OrderItem[];
    payment_method: 'pix' | 'credit_card';
    delivery: boolean;
    distance?: number; // em metros - NOVO
  };
}
```

## Arquivos Modificados

### 1. **src/types/entities.types.ts**
- Removido `DeliveryTaxByDistance` (antiga estrutura com `km` e `valor`)
- Adicionado `DeliverySettings` (nova estrutura com `distance` e `value`)
- Atualizado `RestaurantSettings.deliverySettings`

### 2. **src/types/restaurant/api.types.ts**
- Atualizado `IStoreConfigs.settings.deliverySettings`
- Importa `DeliverySettings` de `entities.types`

### 3. **src/types/index.ts**
- Adicionado `deliveryFee?: number` ao tipo `Order`
- Adicionado `distance?: number` ao tipo `Order`

### 4. **src/services/distance.service.ts**
- **Função `geocodeAddress()`**: Converte endereço em coordenadas (Nominatim API)
- **Função `calculateHaversineDistance()`**: Calcula distância em metros entre coordenadas
- **Função `calculateDistance()`**: Retorna `{distanceInKm, distanceInMeters, duration}`
- **Função `calculateDeliveryFee()`**: Determina taxa baseado em `distanceInMeters` e `deliverySettings[]`
- **Função `formatDeliveryTaxRanges()`**: Formata ranges para exibição ("De 0.0km a 3.0km - R$ 5.00")

### 5. **src/services/api.ts**
- Adicionado `distance?: number` ao tipo `CreateOrderPayload.order`

### 6. **src/components/customer/DeliveryFeeInfo.tsx**
- Props alterado de `deliveryTax` para `deliverySettings`
- Exibe tabela de faixas: "De 0.0km a 3.0km - R$ 5.00"
- Convertendo `distance` (metros) para km na exibição

### 7. **src/components/customer/CheckoutPage.tsx**
- Adicionado states:
  - `calculatedDeliveryFee` (R$)
  - `isCalculatingDistance` (loading)
  - `deliveryDistance` (km - para exibição)
  - `deliveryDistanceInMeters` (metros - para payload)
- Adicionado useEffect que:
  - Detecta endereço completo
  - Calcula distância automaticamente
  - Calcula taxa baseado na distância
  - Mostra toast: "Distância: 2.5km - Taxa: R$ 5,00"
- Passa `deliveryFee` e `distance` para `onProceedToPayment()`

### 8. **src/components/customer/CheckoutFlow.tsx**
- Atualizado `CheckoutData` interface para incluir `deliveryFee` e `distance`

### 9. **src/components/customer/PaymentFlow.tsx**
- Atualizado `CheckoutData` interface
- Usa `checkoutData.deliveryFee` ao invés de `currentRestaurant.settings.deliveryFee`
- Inclui `deliveryFee` e `distance` no objeto `localOrder`

### 10. **src/components/customer/CartSheet.tsx**
- Removida lógica de deliveryFee fixo
- Define `deliveryFee = 0` (cálculo real no CheckoutPage)

### 11. **src/components/customer/OrderStatus.tsx**
- Usa `order.deliveryFee` ao invés de `currentRestaurant.settings.deliveryFee`

### 12. **src/utils/orderUtils.ts**
- Atualizado `CheckoutFormData` para incluir `deliveryFee` e `distance`
- Adiciona `distance` ao payload em `createOrderPayload()` quando `deliveryType === "delivery"`

### 13. **src/app/page.tsx**
- Mapeia `deliverySettings` do response da API
- Removido mapeamento de `deliveryFee`

## API Gratuita - Nominatim (OpenStreetMap)

### Características

- **100% Gratuita** (sem API key necessária)
- **Fair Use Policy**: 1 requisição por segundo
- **User-Agent obrigatório**: `DeliveryApp/1.0`
- **Geocoding preciso** para endereços brasileiros

### Exemplo de Requisição

```javascript
fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
  {
    headers: {
      "User-Agent": "DeliveryApp/1.0",
    },
  }
);
```

### Resposta

```json
[
  {
    "lat": "-20.3155",
    "lon": "-54.7926",
    "display_name": "Rua Exemplo, 123, Centro, Campo Grande, MS, Brasil"
  }
]
```

## Fórmula de Haversine

Calcula a distância em metros entre dois pontos (lat/lng) considerando a curvatura da Terra:

```typescript
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInMeters = R * c;

  return Math.round(distanceInMeters);
}
```

## Exemplo de Fluxo Completo

### 1. Cliente Entra no Checkout
```
- Seleciona "Entrega"
- Sistema mostra componente DeliveryFeeInfo com faixas disponíveis
```

### 2. Cliente Preenche Endereço
```
Rua: "Rua João Silva"
Número: "123"
Bairro: "Centro"
CEP: "79002-000"
```

### 3. Sistema Calcula Automaticamente
```javascript
// useEffect detecta endereço completo
const result = await calculateDistance(
  "Rua da Justiça, 2487 - Jardim Imperial", // pickUpLocation
  "Rua João Silva, 123, Centro, 79002-000"   // customer address
);

// result = {
//   distanceInKm: 2.5,
//   distanceInMeters: 2500,
//   duration: 5 (minutos)
// }

const fee = calculateDeliveryFee(2500, deliverySettings);
// fee = 5.00 (porque 2500m está na faixa 0-3000m)

toast.success("Distância: 2.5km - Taxa: R$ 5,00");
```

### 4. Cliente Finaliza Pedido
```json
// Payload enviado para /order
{
  "order": {
    "items": [...],
    "payment_method": "pix",
    "delivery": true,
    "distance": 2500  // ← em metros
  }
}
```

### 5. Backend Valida
```
Backend recebe distance: 2500
Consulta tabela deliverySettings
Confirma: 2500m = faixa 0-3000m = R$ 5,00
Aprova pedido
```

## Fallbacks e Tratamento de Erros

### Geocoding Falha
```typescript
try {
  const result = await calculateDistance(...);
} catch (error) {
  toast.error("Não foi possível calcular a distância");
  // Usa a menor taxa como fallback
  const minFee = Math.min(...deliverySettings.map(t => t.value));
  setCalculatedDeliveryFee(minFee);
}
```

### Endereço Incompleto
```typescript
// Não calcula se faltar algum campo
const hasCompleteAddress = 
  addressData.street && 
  addressData.number && 
  addressData.neighborhood;

if (!hasCompleteAddress) return;
```

### Loading States
```tsx
{isCalculatingDistance ? (
  <Loader2 className="animate-spin" /> Calculando...
) : deliveryDistance !== null ? (
  {deliveryDistance.toFixed(2)}km - R$ {calculatedDeliveryFee.toFixed(2)}
) : (
  Taxa será calculada após preencher o endereço
)}
```

## Compatibilidade com Versões Antigas

### Backend Antigo (deliveryFee fixo)
```
Se o backend ainda retornar deliveryFee como número:
- Frontend ignora (campo não mais mapeado)
- deliverySettings será undefined
- Componente DeliveryFeeInfo não renderiza
- Taxa não é calculada automaticamente
```

### Migração Suave
```
1. Backend atualiza para retornar deliverySettings
2. Frontend já está preparado (atualização simultânea)
3. Fallback para 0 se deliverySettings não existir
```

## Testes Recomendados

### 1. Endereços Próximos (0-3km)
```
Cliente: Rua X, 100, Centro, 79002-000
Restaurante: Rua Y, 200, Centro, 79002-000
Esperado: distance ~500m, taxa R$ 5,00
```

### 2. Endereços Médios (3-5km)
```
Cliente: Bairro A
Restaurante: Bairro B
Esperado: distance ~4km, taxa R$ 7,00
```

### 3. Endereços Distantes (>5km)
```
Cliente: Cidade vizinha
Esperado: distance >5km, taxa R$ 10,00
```

### 4. Endereços Inválidos
```
CEP inexistente → Erro de geocoding → Fallback para taxa mínima
```

### 5. Nominatim API Down
```
Timeout ou erro de rede → Fallback para taxa mínima
```

## Performance

### Geocoding
- **Tempo médio**: 200-500ms por endereço
- **Cache**: Considerar implementar cache de coordenadas por CEP

### Cálculo de Distância
- **Haversine**: <1ms (cálculo local)
- **Total**: ~500-1000ms para cálculo completo

### Otimizações Futuras
```typescript
// 1. Cache de geocoding por CEP
const geocodeCache = new Map<string, {lat: number, lng: number}>();

// 2. Debounce no input de endereço
const debouncedCalculate = debounce(calculateDistance, 500);

// 3. Retry logic para Nominatim
const retryGeocode = async (address, retries = 3) => { ... }
```

## Observações Importantes

1. **Unidade de Medida**: API trabalha com **METROS**, UI mostra em **KM**
2. **Arredondamento**: Distância em metros é arredondada para inteiro
3. **Fair Use Nominatim**: Máximo 1 requisição/segundo (respeitar limite)
4. **User-Agent**: Obrigatório para Nominatim (`DeliveryApp/1.0`)
5. **Precisão**: Haversine dá distância em linha reta (não considera ruas)

## Recursos Visuais

### DeliveryFeeInfo Component
```
┌────────────────────────────────────────┐
│ 🚛 Taxas de Entrega por Distância    │
│                                        │
│ De 0.0km a 3.0km      R$ 5.00         │
│ De 3.0km a 5.0km      R$ 7.00         │
│ Acima de 5.0km        R$ 10.00        │
│                                        │
│ 💡 A taxa será calculada              │
│    automaticamente com base na         │
│    distância do seu endereço.          │
└────────────────────────────────────────┘
```

### Toast Notification
```
✓ Distância: 2.5km - Taxa: R$ 5,00
```

### Loading State
```
[⟳] Calculando distância...
```

## Documentação de Referência

- **Nominatim API**: https://nominatim.org/release-docs/latest/api/Search/
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula
- **OpenStreetMap Fair Use**: https://operations.osmfoundation.org/policies/nominatim/

---

**Data de Implementação:** 12/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção
