# Modo Demo

O sistema agora suporta um modo demo que permite testar todas as funcionalidades usando dados mockados, mesmo em produção.

## Como Ativar o Modo Demo

### 1. Via URL
Adicione `?demo=true` à URL:
```
https://seu-dominio.com?demo=true
```

### 2. Via Código
```typescript
import { toggleDemoMode } from '@/lib/utils/demo-mode';

// Ativar modo demo
toggleDemoMode(true);

// Desativar modo demo
toggleDemoMode(false);
```

## Funcionalidades do Modo Demo

### ✅ Dados Mockados Incluídos
- **Restaurante**: Master Marmitaria com tema personalizado
- **Produtos**: 3 itens em destaque com badges
  - Pizza Margherita (⭐ Recomendação do Chefe)
  - Roll de Salmão (🔥 Mais Pedido)
  - Cheeseburger Clássico (🏷️ Promoção)
- **Cliente**: Dados de exemplo com endereço e distância
- **Configurações**: DeliverySettings, pickUpLocation, etc.

### ✅ APIs Simuladas
- **Produtos**: Retorna dados mock com delay de 800ms
- **Pedidos**: Simula criação com ID aleatório
- **Cliente**: Dados de exemplo pré-definidos

### ✅ Indicador Visual
- Badge laranja no canto superior direito
- Botão X para desativar o modo demo
- Aparece apenas quando `?demo=true` está na URL

## Estrutura dos Dados Mock

### Restaurante
```typescript
{
  store: {
    name: "Master Marmitaria",
    type: "restaurant",
    configs: {
      theme: { /* cores e logo */ },
      settings: {
        deliverySettings: [
          { distance: 5001, value: 10 },
          { distance: 3001, value: 7 },
          { distance: 0, value: 5 }
        ],
        pickUpLocation: { /* endereço completo */ }
      }
    }
  },
  customer: {
    name: "Cliente Demo",
    phone: "(67) 99999-9999",
    address: { /* endereço com distância */ }
  },
  products: [ /* produtos com destaques */ ]
}
```

### Produtos em Destaque
- **Pizza Margherita**: `highlightType: 'chef-recommendation'`
- **Roll de Salmão**: `highlightType: 'popular'`
- **Cheeseburger**: `highlightType: 'promotion'`

## Como Testar

1. **Acesse**: `https://seu-dominio.com?demo=true`
2. **Verifique**: Badge "Modo Demo" no canto superior direito
3. **Navegue**: Menu com seção "Recomendações do Chefe"
4. **Teste**: Adicione itens ao carrinho
5. **Finalize**: Processo de checkout completo
6. **Observe**: Taxa de entrega calculada (R$ 7,00 para 3142m)

## Desenvolvimento

### Adicionar Novos Dados Mock
1. Edite `src/data/mockData.ts`
2. Adicione campos de destaque:
   ```typescript
   {
     // ... campos existentes
     isHighlighted: true,
     highlightType: 'popular' | 'chef-recommendation' | 'promotion' | 'new',
     highlightLabel: 'Mais Pedido',
     orderCount: 150
   }
   ```

### Modificar Serviços Demo
1. Edite `src/services/demo/demo.service.ts`
2. Atualize `getMockRestaurantData()` com novos dados
3. Adicione delays realistas com `DemoService.delay()`

## Vantagens

- ✅ **Teste em Produção**: Sem necessidade de ambiente local
- ✅ **Dados Consistentes**: Sempre os mesmos dados para testes
- ✅ **Funcionalidades Completas**: Todas as features funcionam
- ✅ **Fácil Ativação**: Apenas `?demo=true` na URL
- ✅ **Indicador Visual**: Claro quando está em modo demo
