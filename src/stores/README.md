# 📦 Stores - Gerenciamento de Estado com Zustand

## ✅ Status: Migração Completa

O projeto agora usa **Zustand** para gerenciamento de estado, mantendo 100% de compatibilidade com o código existente.

---

## 🏗️ Estrutura

```
src/stores/
├── cartStore.ts          # Gerenciamento do carrinho
├── restaurantStore.ts    # Restaurante atual e menu
├── orderStore.ts         # Pedidos
└── index.ts              # Exports centralizados
```

---

## 📚 Stores Disponíveis

### 1. **cartStore** - Carrinho de Compras

```typescript
import { useCartStore } from './stores/cartStore';

// Uso direto da store
const { cart, addToCart, clearCart } = useCartStore();

// Métodos disponíveis:
- cart: CartItem[]                                    // Array de itens
- addToCart(item: CartItem): void                     // Adicionar item
- removeFromCart(itemId: string): void                // Remover item
- updateCartItem(itemId: string, quantity: number)    // Atualizar quantidade
- clearCart(): void                                   // Limpar carrinho
- getTotalCartPrice(): number                         // Total em R$
- getCartItemCount(): number                          // Quantidade de itens
```

**✨ Features:**
- ✅ Persistência no localStorage
- ✅ Agrupa itens idênticos automaticamente
- ✅ Calcula totais dinamicamente

---

### 2. **restaurantStore** - Restaurante e Menu

```typescript
import { useRestaurantStore } from './stores/restaurantStore';

// Uso direto da store
const { currentRestaurant, menu, setCurrentRestaurant } = useRestaurantStore();

// Métodos disponíveis:
- currentRestaurant: Restaurant | null                // Restaurante atual
- menu: MenuItem[]                                    // Itens do menu
- setCurrentRestaurant(restaurant: Restaurant): void  // Trocar restaurante
- updateMenuItem(itemId, updates): void               // Atualizar item (admin)
- loadRestaurantData(restaurantId: number): void      // Carregar por ID
- applyTheme(): void                                  // Aplicar tema CSS
```

**✨ Features:**
- ✅ Aplica tema automaticamente (CSS vars)
- ✅ Sincroniza menu com restaurante
- ✅ Suporta atualização de itens (admin)

---

### 3. **orderStore** - Pedidos

```typescript
import { useOrderStore } from './stores/orderStore';

// Uso direto da store
const { orders, addOrder, currentOrder } = useOrderStore();

// Métodos disponíveis:
- orders: Order[]                                     // Lista de pedidos
- currentOrder: Order | null                          // Pedido sendo visualizado
- addOrder(order: Order): void                        // Criar pedido
- updateOrderStatus(orderId, status): void            // Atualizar status
- getOrderById(orderId: string): Order | undefined    // Buscar por ID
- setCurrentOrder(order: Order | null): void          // Definir atual
- clearOrders(): void                                 // Limpar todos
```

**✨ Features:**
- ✅ Persistência no localStorage
- ✅ Rastreia pedido atual
- ✅ Histórico de pedidos

---

## 🔄 Compatibilidade com Context

O `RestaurantContext` foi atualizado para usar Zustand por baixo dos panos.

**✅ Componentes existentes funcionam sem alteração!**

```typescript
// Código antigo continua funcionando:
import { useRestaurant } from './contexts/RestaurantContext';

const Component = () => {
  const { cart, addToCart, currentRestaurant } = useRestaurant();
  // Funciona exatamente como antes!
};
```

---

## 🎯 Como Usar

### Opção 1: Via Context (Recomendado para código existente)

```typescript
import { useRestaurant } from '../contexts/RestaurantContext';

const MenuPage = () => {
  const { menu, addToCart, cart } = useRestaurant();
  
  return (
    // ... seu código
  );
};
```

### Opção 2: Via Stores Diretamente (Recomendado para código novo)

```typescript
import { useCartStore } from '../stores/cartStore';
import { useRestaurantStore } from '../stores/restaurantStore';

const MenuPage = () => {
  const { cart, addToCart } = useCartStore();
  const { menu } = useRestaurantStore();
  
  return (
    // ... seu código
  );
};
```

### Opção 3: Via Hook Customizado

```typescript
import { useRestaurantWithStores } from '../hooks/useRestaurantWithStores';

const MenuPage = () => {
  const { menu, cart, addToCart } = useRestaurantWithStores();
  
  return (
    // ... seu código
  );
};
```

---

## 💡 Vantagens do Zustand

### ✅ Performance
- Apenas componentes que usam dados específicos re-renderizam
- Sem props drilling
- Atualizações otimizadas

### ✅ DevTools
```typescript
// Instalar Redux DevTools Extension no navegador
// Zustand se integra automaticamente!
```

### ✅ Persistência
```typescript
// Carrinho e pedidos são salvos no localStorage
// Dados persistem entre reloads da página
```

### ✅ Simplicidade
```typescript
// Sem boilerplate
// Sem actions/reducers/dispatchers
// Apenas hooks e funções
```

---

## 🧪 Testando as Stores

### Teste Manual:

1. **Carrinho:**
```typescript
// No console do navegador:
const { getState, setState } = window.useCartStore;
console.log(getState()); // Ver estado atual
```

2. **LocalStorage:**
```typescript
// Verificar persistência:
localStorage.getItem('restaurant-cart-storage');
localStorage.getItem('restaurant-orders-storage');
```

3. **React DevTools:**
- Instale Redux DevTools Extension
- Veja ações em tempo real

---

## 🔧 Migrando Componentes

### Antes (Context):
```typescript
import { useRestaurant } from '../contexts/RestaurantContext';

const Component = () => {
  const { cart, addToCart } = useRestaurant();
  // ...
};
```

### Depois (Zustand - Opcional):
```typescript
import { useCartStore } from '../stores/cartStore';

const Component = () => {
  const { cart, addToCart } = useCartStore();
  // ...
};
```

**⚠️ Nota:** Não é necessário migrar! O Context já usa Zustand internamente.

---

## 📊 Fluxo de Dados

```
Componente
    ↓
useRestaurant() ou useCartStore()
    ↓
Zustand Store
    ↓
[Estado Global + LocalStorage]
    ↓
Componente re-renderiza
```

---

## 🎨 Tematização

O tema é aplicado automaticamente quando você troca de restaurante:

```typescript
const { setCurrentRestaurant } = useRestaurantStore();

setCurrentRestaurant(novoRestaurante);
// CSS variables são atualizadas automaticamente:
// --restaurant-primary
// --restaurant-secondary
// --restaurant-accent
```

---

## 🚀 Próximos Passos

- [ ] Adicionar React Query para cache de API
- [ ] Implementar undo/redo no carrinho
- [ ] Adicionar analytics de uso
- [ ] Sincronizar carrinho entre abas
- [ ] Migrar componentes para usar stores diretamente (opcional)

---

## 📝 Checklist de Migração

✅ Zustand instalado
✅ Stores criadas (cart, restaurant, order)
✅ Context atualizado para usar stores
✅ Persistência implementada (localStorage)
✅ Tematização funcionando
✅ Compatibilidade 100% mantida
✅ Documentação criada

---

## ❓ FAQ

**P: Preciso mudar meu código existente?**
R: Não! Tudo continua funcionando via `useRestaurant()`.

**P: Posso usar stores e Context juntos?**
R: Sim! O Context usa as stores internamente, então são a mesma coisa.

**P: Como limpar o localStorage?**
R: `localStorage.clear()` ou use as funções `clearCart()` e `clearOrders()`.

**P: Como debugar?**
R: Instale Redux DevTools Extension no navegador.

**P: Performance melhorou?**
R: Sim! Zustand é mais eficiente que Context API para estado global.

---

**✅ Migração Completa! Todas as stores funcionando 100% com o código atual.**
