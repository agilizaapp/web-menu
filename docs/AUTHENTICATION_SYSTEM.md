# Sistema de Autenticação com Token do Cliente

## 🔐 Visão Geral

Sistema de autenticação persistente que salva o token do cliente em cookies por 1 ano, permitindo que usuários retornem sem precisar preencher seus dados novamente.

## 📋 Fluxo de Autenticação

### 1. **Primeiro Acesso (Novo Cliente)**

```
1. Cliente clica em "Finalizar Pedido"
   ↓
2. Modal de Telefone aparece
   ↓
3. Cliente digita telefone → API verifica se existe (/customer/{phone})
   ↓
4. Se NÃO existe: Pede nome e data de nascimento
   ↓
5. Cliente finaliza pedido → API retorna TOKEN
   ↓
6. Token salvo em cookie (1 ano) e localStorage
   ↓
7. Próximos acessos: cliente autenticado automaticamente
```

### 2. **Cliente Retornando (Com Token)**

```
1. Cliente clica em "Finalizar Pedido"
   ↓
2. Sistema verifica token em cookie/localStorage
   ↓
3. Faz requisição /config?config=true com token no header
   ↓
4. API retorna dados do cliente
   ↓
5. PULA modais de registro → vai direto pro checkout
   ↓
6. Cliente escolhe entrega/retirada e confirma
```

### 3. **Cliente Existente (Sem Token, mas cadastrado)**

```
1. Cliente clica em "Finalizar Pedido"
   ↓
2. Modal de Telefone aparece
   ↓
3. Cliente digita telefone → API encontra cadastro
   ↓
4. Nome é PRÉ-PREENCHIDO automaticamente
   ↓
5. Cliente apenas confirma os dados
   ↓
6. Finaliza pedido → recebe novo token
```

## 🔧 Implementação

### Arquivos Criados/Modificados

#### 1. **src/services/cookies.ts** (NOVO)

Gerencia tokens em cookies:

```typescript
export const cookieService = {
  setCustomerToken(token: string): void
  getCustomerToken(): string | null
  removeCustomerToken(): void
  isAuthenticated(): boolean
}
```

**Características:**
- Expira em 1 ano
- `SameSite=Strict` (segurança)
- `Secure` (apenas HTTPS em produção)

#### 2. **src/stores/customerStore.ts** (NOVO)

Store Zustand com persistência em localStorage:

```typescript
interface CustomerState {
  token: string | null
  name: string | null
  phone: string | null
  address: AddressData | null
  isAuthenticated: boolean
  
  setCustomer: (data) => void
  updateAddress: (address) => void
  clearCustomer: () => void
}
```

#### 3. **src/services/api.ts** (ATUALIZADO)

Novos endpoints:

```typescript
// Buscar config com autenticação
async getConfig(token: string): Promise<ConfigResponse>

// Buscar cliente por telefone
async getCustomerByPhone(phone: string): Promise<CustomerResponse | null>
```

**Estrutura de resposta:**

```typescript
interface ConfigResponse {
  store: Record<string, unknown>
  customer: {
    name: string
    phone: string // Formato: (67)*****9967
    address?: {
      street: string
      number: string
      neighborhood: string
      postalCode: string
    }
  }
}
```

#### 4. **src/components/customer/PaymentFlow.tsx** (ATUALIZADO)

Salva token após criar pedido (PIX ou Cartão):

```typescript
// Após criar pedido com sucesso
const apiToken = response.data.token

// ✅ Salvar em cookie
cookieService.setCustomerToken(apiToken)

// ✅ Salvar na store
setCustomer({
  token: apiToken,
  name: customerData.name,
  phone: customerData.phone,
  address: checkoutData.address
})
```

#### 5. **src/components/customer/RegisterModals.tsx** (ATUALIZADO)

Busca dados do cliente ao digitar telefone:

```typescript
const handleStep1Submit = async () => {
  // Validar telefone
  
  // ✅ Buscar cliente na API
  const existingCustomer = await apiService.getCustomerByPhone(phone)
  
  if (existingCustomer) {
    // PRÉ-PREENCHER nome
    setCustomerData({ ...prev, name: existingCustomer.name })
    toast.success(`Bem-vindo de volta, ${existingCustomer.name}!`)
  }
  
  setCurrentStep(2)
}
```

#### 6. **src/components/customer/CheckoutFlow.tsx** (ATUALIZADO)

Verifica autenticação e pula modais:

```typescript
useEffect(() => {
  if (isAuthenticated && token) {
    // ✅ Buscar dados atualizados
    const config = await apiService.getConfig(token)
    
    // ✅ Atualizar store
    setCustomer(config.customer)
    
    // ✅ PULAR registro → ir direto pro checkout
    setCustomerData({...})
    setCurrentFlow("checkout")
    
    toast.success(`Bem-vindo de volta, ${config.customer.name}!`)
  }
}, [isAuthenticated, token])
```

## 📡 Endpoints da API

### 1. **GET /config?config=true**

Busca configurações e dados do cliente autenticado.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "store": {},
  "customer": {
    "name": "João da Silva",
    "phone": "(67)*****9967",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "neighborhood": "Centro",
      "postalCode": "12345678"
    }
  }
}
```

### 2. **GET /customer/{phone}**

Busca cliente por telefone (usado no modal de registro).

**Parâmetro:**
- `phone`: Telefone sanitizado (ex: `5567984299967`)

**Response (200 - Cliente encontrado):**
```json
{
  "name": "João da Silva",
  "phone": "(67)*****9967",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "postalCode": "12345678"
  }
}
```

**Response (404 - Cliente não encontrado):**
```json
null
```

### 3. **POST /order** (ATUALIZADO)

Ao criar pedido, retorna token.

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 123,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pix": {
      "copyAndPaste": "00020126..."
    }
  }
}
```

## 🎯 Casos de Uso

### Caso 1: Novo Cliente

```
Input: Telefone não cadastrado
Output: 
  - Modal de telefone
  - Modal de dados (nome + nascimento)
  - Cria pedido → Recebe token
  - Token salvo → Próximas compras autenticadas
```

### Caso 2: Cliente Cadastrado (Sem Token)

```
Input: Telefone JÁ cadastrado, mas sem token local
Output:
  - Modal de telefone
  - API reconhece telefone
  - Modal de dados COM nome pré-preenchido
  - Cliente apenas confirma
  - Recebe novo token
```

### Caso 3: Cliente Autenticado (Com Token)

```
Input: Token válido em cookie/localStorage
Output:
  - PULA modais completamente
  - Vai direto para escolha de entrega/retirada
  - Usa dados salvos
  - "Bem-vindo de volta, João!"
```

## 🔒 Segurança

### Cookie

```javascript
{
  name: 'customer_token',
  expires: '1 year',
  sameSite: 'Strict',  // CSRF protection
  secure: true,        // HTTPS only (produção)
  path: '/'
}
```

### LocalStorage (via Zustand persist)

```javascript
{
  key: 'customer-storage',
  data: {
    token: string,
    name: string,
    phone: string,
    address: object
  }
}
```

### Validação de Token

- Token enviado no header `Authorization: Bearer {token}`
- API valida e retorna dados do cliente
- Se inválido: cliente precisa fazer login novamente

## 🧪 Como Testar

### 1. **Testar Novo Cliente**

```javascript
// Limpar dados primeiro
localStorage.clear()
document.cookie = 'customer_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC'

// Fazer pedido
// Verificar:
// - Modais de registro aparecem
// - Após pedido, token é salvo
// - Recarregar página → dados permanecem
```

### 2. **Testar Cliente Retornando**

```javascript
// Após ter feito um pedido:
// 1. Recarregar página
// 2. Clicar em "Finalizar Pedido"
// Verificar:
// - Modais NÃO aparecem
// - Vai direto pro checkout
// - Dados pré-preenchidos
```

### 3. **Testar Telefone Existente**

```javascript
// Simular API retornando cliente existente
// No modal de telefone:
// 1. Digite telefone cadastrado
// 2. Clicar "Continuar"
// Verificar:
// - Nome aparece pré-preenchido
// - Mensagem "Bem-vindo de volta!"
```

### 4. **Verificar Cookie**

```javascript
// Console do navegador:
console.log(document.cookie)
// Output: "customer_token=eyJhbGci..."

// Verificar expiração (365 dias)
const cookies = document.cookie.split(';')
const tokenCookie = cookies.find(c => c.includes('customer_token'))
console.log(tokenCookie)
```

### 5. **Verificar Store**

```javascript
// Console do navegador:
const store = JSON.parse(localStorage.getItem('customer-storage'))
console.log(store)
// Output: { state: { token, name, phone, address, isAuthenticated } }
```

## 🛠️ Troubleshooting

### Problema: Token não está sendo salvo

**Verificar:**
```javascript
// 1. Cookie foi criado?
console.log(document.cookie)

// 2. LocalStorage foi atualizado?
console.log(localStorage.getItem('customer-storage'))

// 3. API retornou token?
// DevTools → Network → POST /order → Response
```

### Problema: Cliente autenticado mas modais aparecem

**Verificar:**
```javascript
// Store está com token?
import { useCustomerStore } from '@/stores'
const { token, isAuthenticated } = useCustomerStore()
console.log({ token, isAuthenticated })

// Se token existe mas isAuthenticated = false:
// → Problema na store
```

### Problema: API retorna erro 401 no /config

**Causa:** Token inválido ou expirado

**Solução:**
```javascript
// Limpar autenticação
import { cookieService } from '@/services/cookies'
import { useCustomerStore } from '@/stores'

cookieService.removeCustomerToken()
useCustomerStore.getState().clearCustomer()

// Cliente fará login novamente
```

### Problema: Telefone mascarado incorretamente na API

**Causa:** API retorna `(67)*****9967` mas código espera formato completo

**Solução:**
- API deve retornar telefone mascarado apenas para exibição
- Para operações, usar telefone completo sanitizado
- Ou: desmascarar ao receber da API

## 📝 Checklist de Integração

- [ ] API implementa `GET /config?config=true` com header Authorization
- [ ] API implementa `GET /customer/{phone}` (sanitizado: `5567984299967`)
- [ ] API retorna `token` no `POST /order`
- [ ] Token tem validade de 1 ano (ou mais)
- [ ] Telefone na resposta pode estar mascarado: `(67)*****9967`
- [ ] Address é opcional (pode ser `null` ou ausente)
- [ ] Store vazio é `{}` (objeto vazio, não undefined)

## 🎨 UX/UI

### Loading States

```tsx
// Verificando autenticação
{isLoadingAuth && (
  <div>Carregando...</div>
)}

// Buscando cliente por telefone
<Button disabled={isCheckingPhone}>
  {isCheckingPhone ? 'Verificando...' : 'Continuar'}
</Button>
```

### Toast Messages

```javascript
// Cliente novo
toast.info("Novo cliente! Por favor, preencha seus dados.")

// Cliente existente (sem token)
toast.success(`Bem-vindo de volta, ${name}!`)

// Cliente autenticado (com token)
toast.success(`Bem-vindo de volta, ${name}!`)
```

## 🔄 Fluxo Completo Visual

```
┌─────────────────────┐
│ Cliente clica em    │
│ "Finalizar Pedido"  │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │ Tem token?   │
    └──────┬───────┘
           │
     ┌─────┴─────┐
   SIM          NÃO
     │            │
     ↓            ↓
┌─────────────┐  ┌──────────────────┐
│ GET /config │  │ Modal: Telefone  │
│ com token   │  └────────┬─────────┘
└──────┬──────┘           │
       │                  ↓
       │          ┌────────────────────┐
       │          │ GET /customer/{ph} │
       │          └─────────┬──────────┘
       │                    │
       │              ┌─────┴─────┐
       │            Existe      Não Existe
       │              │              │
       │              ↓              ↓
       │    ┌──────────────────┐  ┌───────────────┐
       │    │ Nome pré-preench │  │ Campos vazios │
       │    └────────┬─────────┘  └───────┬───────┘
       │             │                     │
       │             └──────────┬──────────┘
       │                        │
       │                        ↓
       │            ┌────────────────────────┐
       │            │ Modal: Nome/Nascimento │
       │            └───────────┬────────────┘
       │                        │
       └────────────┬───────────┘
                    │
                    ↓
          ┌──────────────────┐
          │ Checkout Page    │
          │ (Entrega/Retir.) │
          └─────────┬────────┘
                    │
                    ↓
          ┌──────────────────┐
          │ Payment Flow     │
          │ (PIX/Cartão)     │
          └─────────┬────────┘
                    │
                    ↓
          ┌──────────────────┐
          │ POST /order      │
          │ → Recebe TOKEN   │
          └─────────┬────────┘
                    │
                    ↓
          ┌──────────────────┐
          │ Salvar token em: │
          │ - Cookie (1 ano) │
          │ - LocalStorage   │
          └──────────────────┘
```

---

**Versão**: 1.0.0  
**Data**: Outubro 2025  
**Status**: ✅ Implementado
