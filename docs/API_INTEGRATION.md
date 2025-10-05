# 📡 Integração com API - Documentação

## 🎯 Visão Geral

O sistema está integrado com a API do backend para criar pedidos. Quando o cliente confirma o pagamento, os dados são enviados e a resposta é armazenada localmente.

---

## 📤 Request - POST /order

### Endpoint
```
POST {NEXT_PUBLIC_API_URL}/order
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Payload Enviado
```json
{
  "customer": {
    "phone": "5567984299967",
    "name": "Rychard Teste",
    "birthdate": "2003-03-02",
    "address": "Rua das Flores, 123 - Centro"
  },
  "order": {
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "modifiers": [
          {
            "modifier_id": "size",
            "option_id": "medium"
          },
          {
            "modifier_id": "extras",
            "option_id": "cheese"
          }
        ]
      }
    ]
  }
}
```

### Regras do Payload

1. **customer.phone**
   - Formato: Apenas números com DDI
   - Conversão automática: `(67) 98429-9967` → `5567984299967`
   - Adiciona `55` se não estiver presente

2. **customer.birthdate**
   - Formato: `YYYY-MM-DD`
   - Opcional (pode ser undefined)

3. **customer.address**
   - **Obrigatório** apenas se `deliveryType === 'delivery'`
   - **Não enviado** se `deliveryType === 'pickup'`

4. **order.items[].modifiers**
   - Array de objetos `{ modifier_id, option_id }`
   - Cada opção selecionada vira um objeto separado
   - Opcional (undefined se não houver modificadores)

---

## 📥 Response - Sucesso

### Status: 200 OK

```json
{
  "orderId": 22,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU0NjQ0NjI1fQ.2uxP0Ghpv0W8OIpqC75A2Mzxk0I1wmgS_vwNb30AMgc",
  "pix": {
    "copyAndPaste": "00020126780014BR.GOV.BCB.PIX0127rychard.souza1111@gmail.com0225Lelek's Food - Pedido #22520400005303986540521.995802BR5912Lelek's Food6013NAOINFORMAD062060502226304DA46"
  }
}
```

### Campos da Resposta

- `orderId` (number): ID único do pedido no backend
- `token` (string): JWT para autenticação/tracking do pedido
- `pix.copyAndPaste` (string): Código PIX Copia e Cola (apenas se paymentMethod === 'pix')

---

## 💾 Armazenamento Local

Após receber a resposta, o pedido é salvo no Zustand store com os seguintes dados:

```typescript
{
  id: "order-22",              // Formato: order-{apiOrderId}
  apiOrderId: 22,              // ID do backend
  apiToken: "eyJhbGci...",     // Token JWT
  pixCode: "00020126...",      // Código PIX (se aplicável)
  items: [...],                // Items do carrinho
  customerInfo: {
    name: "...",
    phone: "...",
    address: "..."
  },
  deliveryType: "delivery",
  status: "pending",
  totalAmount: 31.99,
  createdAt: new Date(),
  paymentMethod: "pix",
  paymentStatus: "pending"
}
```

---

## 🔄 Fluxo Completo

```
1. Cliente preenche dados nos modais
   ├─ Modal 1: Telefone
   └─ Modal 2: Nome + Data Nascimento

2. Cliente escolhe entrega/retirada e pagamento
   ├─ Entrega → Campo de endereço
   └─ Retirada → Sem endereço

3. Cliente confirma pedido
   ├─ Validação local dos dados
   ├─ Conversão para formato da API
   └─ POST /order

4. API processa e retorna
   ├─ orderId
   ├─ token
   └─ pix (se pagamento PIX)

5. Sistema salva resposta
   ├─ Atualiza código PIX (se aplicável)
   ├─ Salva token e orderId
   └─ Armazena no localStorage via Zustand

6. Navegação para OrderStatus
   └─ Mostra status do pedido com dados da API
```

---

## 🎨 Uso do Código PIX

### Antes (Mock)
```typescript
const [pixCode, setPixCode] = useState("00020126360014BR...");
```

### Depois (API)
```typescript
// Ao receber resposta da API
if (checkoutData.paymentMethod === 'pix' && response.data.pix) {
  setPixCode(response.data.pix.copyAndPaste);
  console.log('✅ Código PIX atualizado da API');
}
```

O código PIX é atualizado automaticamente e exibido no QR Code:

```tsx
<QRCodeSVG value={pixCode} size={200} />
```

---

## 🛡️ Tratamento de Erros

### Erro na API
```typescript
try {
  const response = await apiService.createOrder(payload);
} catch (error) {
  // 1. Loga o erro
  console.error('❌ Erro ao criar pedido:', error);
  
  // 2. Mostra toast de erro
  toast.error(`❌ Falha: ${errorMessage}`);
  
  // 3. Salva pedido localmente (modo offline)
  const fallbackOrderId = `order-local-${Date.now()}`;
  addOrder(localOrder);
  
  // 4. Navega para OrderStatus mesmo assim
  onOrderComplete(fallbackOrderId);
  
  // 5. Notifica que será sincronizado
  toast.info("ℹ️ Pedido salvo localmente...");
}
```

### Validação Antes de Enviar
```typescript
const validation = validateOrderPayload(apiPayload);
if (!validation.isValid) {
  toast.error(`❌ Erro: ${validation.errors.join(', ')}`);
  return; // Não envia
}
```

---

## 🔧 Configuração

### 1. Criar arquivo `.env`
```bash
cp .env.example .env
```

### 2. Configurar URL da API
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# ou
NEXT_PUBLIC_API_URL=https://api.seurestaurante.com
```

### 3. Reiniciar servidor
```bash
pnpm run dev
```

---

## 📊 Logs de Debug

Console ao enviar pedido:
```
📤 Enviando pedido: {
  "customer": { ... },
  "order": { ... }
}

📥 Resposta da API: {
  "orderId": 22,
  "token": "...",
  "pix": { ... }
}

✅ Código PIX atualizado da API
✅ Pedido realizado com sucesso!
```

---

## 🚀 Exemplos de Uso

### Pedido de Entrega com PIX
```json
{
  "customer": {
    "phone": "5511987654321",
    "name": "João Silva",
    "birthdate": "1990-05-15",
    "address": "Rua das Flores, 123 - Centro"
  },
  "order": {
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "modifiers": [
          { "modifier_id": "size", "option_id": "large" }
        ]
      }
    ]
  }
}
```

### Pedido de Retirada com Cartão
```json
{
  "customer": {
    "phone": "5511987654321",
    "name": "Maria Santos",
    "birthdate": "1985-10-20"
    // Sem address - é retirada
  },
  "order": {
    "items": [
      {
        "product_id": 2,
        "quantity": 2
        // Sem modifiers - produto simples
      }
    ]
  }
}
```

---

## ✅ Checklist de Integração

- [x] Service layer criado (`api.ts`)
- [x] Utilitários de conversão (`orderUtils.ts`)
- [x] Tipos TypeScript atualizados
- [x] Validação de payload
- [x] Sanitização de telefone
- [x] Código PIX dinâmico
- [x] Token JWT salvo
- [x] Modo offline (fallback)
- [x] Loading states
- [x] Tratamento de erros
- [x] Logs de debug
- [x] Variável de ambiente
- [x] Build sem erros

---

## 🔐 Segurança

1. **Token JWT**: Salvo localmente para futuras consultas
2. **Sanitização**: Remove caracteres perigosos antes de enviar
3. **Validação**: Verifica dados antes da requisição
4. **HTTPS**: Use sempre em produção

---

## 📝 Notas

- O `apiOrderId` é usado para rastreamento no backend
- O `token` pode ser usado para consultar status do pedido
- O código PIX é válido por 5 minutos (300s)
- Em caso de erro de rede, o pedido é salvo localmente e pode ser sincronizado depois

---

**Última atualização**: 05/10/2025
