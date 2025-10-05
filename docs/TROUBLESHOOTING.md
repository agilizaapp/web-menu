# 🔍 Troubleshooting - Requisição /order

## Como Verificar se a Requisição Está Sendo Feita

### 1. Abra o Console do Navegador (F12)

Procure pelos seguintes logs:

```
🔵 handleConfirmPayment chamado!
🔵 isSubmitting: false
🔵 isSubmitting definido como true
🔵 Criando payload...
🔵 Validando payload...
🔍 Validando payload: {...}
🔍 Validando phone: 5567984299967 length: 13
🔍 Validando name: João Silva length: 10
🔍 Validando items: [...] length: 1
🔍 Validando item 0: {...}
🔍 Erros encontrados: []
🔍 Validação: ✅ OK
📤 Enviando pedido: {...}
🔵 Chamando apiService.createOrder...
🌐 API_BASE_URL: https://cardapio-api-zeta.vercel.app
🔗 Request URL: https://cardapio-api-zeta.vercel.app/order
📦 Payload: {...}
📡 Response status: 200
📡 Response ok: true
✅ Response data: {...}
🔵 apiService.createOrder retornou!
📥 Resposta da API: {...}
```

### 2. Abra a Aba Network (Rede)

1. Abra DevTools (F12)
2. Vá na aba **Network** / **Rede**
3. Confirme o pedido no app
4. Procure por uma requisição para `/order`

**Se aparecer:**
- ✅ Status 200 → Sucesso
- ❌ Status 400/500 → Erro no servidor
- ❌ Status (failed) → Erro de CORS ou rede

### 3. Problemas Comuns

#### A) Função não é chamada
**Sintoma:** Não aparece `🔵 handleConfirmPayment chamado!`

**Causa:** Botão não está conectado à função

**Solução:** Verificar se o botão tem `onClick={handleConfirmPayment}`

---

#### B) Validação falha
**Sintoma:** Aparece `❌ Validação falhou: [...]`

**Possíveis erros:**
- `Telefone inválido` → Phone tem menos de 12 caracteres
- `Nome inválido` → Nome tem menos de 3 caracteres
- `Carrinho vazio` → Cart está vazio

**Solução:** Verificar os dados no console e corrigir

---

#### C) CORS Error
**Sintoma:** 
```
Access to fetch at 'https://api...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Causa:** Backend não permite requisições do frontend

**Solução:** Adicionar headers CORS no backend:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

---

#### D) API URL incorreta
**Sintoma:** `🌐 API_BASE_URL: undefined` ou URL errada

**Causa:** `.env` não está configurado ou não tem `NEXT_PUBLIC_`

**Solução:**
1. Verificar `.env`:
```env
NEXT_PUBLIC_API_URL=https://cardapio-api-zeta.vercel.app
```

2. **Reiniciar servidor** após alterar `.env`:
```bash
# Parar (Ctrl+C)
pnpm run dev
```

---

#### E) Response sem campo `success`
**Sintoma:** `❌ API retornou success = false`

**Causa:** API retorna direto `{orderId, token, pix}` sem wrapper

**Solução:** Já implementada! O código normaliza automaticamente

---

#### F) Erro de rede
**Sintoma:** `💥 Error creating order: TypeError: Failed to fetch`

**Causas possíveis:**
1. API está offline
2. URL incorreta
3. Problema de rede/VPN
4. Certificado SSL inválido

**Solução:**
1. Testar API manualmente:
```bash
curl -X POST https://cardapio-api-zeta.vercel.app/order \
  -H "Content-Type: application/json" \
  -d '{"customer":{"phone":"5567984299967","name":"Test"},"order":{"items":[{"product_id":1,"quantity":1}]}}'
```

2. Verificar se a URL está correta
3. Verificar se a API está rodando

---

## 🧪 Teste Manual da API

### Via cURL (Terminal)
```bash
curl -X POST https://cardapio-api-zeta.vercel.app/order \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "phone": "5567984299967",
      "name": "Teste Manual",
      "birthdate": "2000-01-01",
      "address": "Rua Teste, 123"
    },
    "order": {
      "items": [
        {
          "product_id": 1,
          "quantity": 1,
          "modifiers": [
            {
              "modifier_id": "size",
              "option_id": "medium"
            }
          ]
        }
      ]
    }
  }'
```

### Via Postman/Insomnia
1. Método: **POST**
2. URL: `https://cardapio-api-zeta.vercel.app/order`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "customer": {
    "phone": "5567984299967",
    "name": "Teste Postman",
    "address": "Rua Teste, 123"
  },
  "order": {
    "items": [
      {
        "product_id": 1,
        "quantity": 1
      }
    ]
  }
}
```

### Via Browser Console
```javascript
fetch('https://cardapio-api-zeta.vercel.app/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer: {
      phone: '5567984299967',
      name: 'Teste Browser'
    },
    order: {
      items: [{
        product_id: 1,
        quantity: 1
      }]
    }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📋 Checklist de Verificação

- [ ] `.env` existe e tem `NEXT_PUBLIC_API_URL`
- [ ] Servidor Next.js foi **reiniciado** após criar/editar `.env`
- [ ] Console mostra `🔵 handleConfirmPayment chamado!`
- [ ] Console mostra `🔍 Validação: ✅ OK`
- [ ] Console mostra `🌐 API_BASE_URL: https://...`
- [ ] Console mostra `🔗 Request URL: https://.../order`
- [ ] Aba Network mostra requisição para `/order`
- [ ] API retorna Status 200
- [ ] API backend está rodando/online

---

## 🆘 Se Ainda Não Funcionar

1. **Copie TODOS os logs do console** (Ctrl+A no console)
2. **Tire screenshot da aba Network** mostrando a requisição
3. **Teste a API manualmente** com cURL
4. **Verifique se o backend está online**

---

## ✅ Quando Funciona

Você verá:

```
🔵 handleConfirmPayment chamado!
🔵 Criando payload...
🔵 Validando payload...
🔍 Validação: ✅ OK
📤 Enviando pedido: {...}
🔵 Chamando apiService.createOrder...
🌐 API_BASE_URL: https://cardapio-api-zeta.vercel.app
📡 Response status: 200
✅ Response data: { orderId: 22, token: "...", pix: {...} }
📥 Resposta da API: { orderId: 22, token: "...", pix: {...} }
✅ Código PIX atualizado da API
✅ Pedido realizado com sucesso!
```

E na aba Network:
- Nome: `order`
- Status: `200 OK`
- Type: `xhr` ou `fetch`
- Response tem `orderId`, `token`, `pix`
