# 🔍 Integração com ViaCEP

## 📋 Visão Geral

Sistema de busca automática de endereço a partir do CEP usando a API pública do ViaCEP.

**Funcionalidades:**
- ✅ Busca automática ao digitar 8 dígitos no CEP
- ✅ Loading indicator durante a busca
- ✅ Preenchimento automático de Rua e Bairro
- ✅ Debounce de 500ms para evitar requisições desnecessárias
- ✅ Permite preenchimento manual se CEP não for encontrado
- ✅ Feedback visual com toasts

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│   CheckoutPage Component                │
│                                         │
│   1. Usuário digita CEP                 │
│   2. useEffect com debounce (500ms)     │
│   3. Valida se tem 8 dígitos            │
│   4. isLoadingCEP = true                │
│   5. fetchAddressByCEP()                │
│                                         │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│   viaCEP Service                        │
│                                         │
│   → Limpa CEP (remove não-numéricos)    │
│   → fetch('viacep.com.br/ws/CEP/json')  │
│   → Valida resposta                     │
│   → Retorna { logradouro, bairro, ...} │
│                                         │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│   CheckoutPage (atualização)            │
│                                         │
│   → Preenche street e neighborhood      │
│   → isLoadingCEP = false                │
│   → toast.success("CEP encontrado")     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📁 Arquivos

### 1. `src/services/viaCEP.ts`

```typescript
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;      // Rua
  complemento: string;
  bairro: string;          // Bairro
  localidade: string;      // Cidade
  uf: string;              // Estado (sigla)
  estado: string;          // Estado (nome completo)
  erro?: boolean;          // true se CEP não encontrado
}

export async function fetchAddressByCEP(
  cep: string
): Promise<ViaCEPResponse | null> {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');

  // Valida 8 dígitos
  if (cleanCEP.length !== 8) {
    return null;
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${cleanCEP}/json/`
  );

  const data = await response.json();

  // ViaCEP retorna {erro: true} se não encontrar
  if (data.erro) {
    return null;
  }

  return data;
}

export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length > 5) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
  return numbers;
}

export function isValidCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}
```

### 2. `src/components/customer/CheckoutPage.tsx`

#### Estado:
```typescript
const [addressData, setAddressData] = useState<AddressData>({
  street: "",
  number: "",
  neighborhood: "",
  postalCode: "",
  complement: "",
});

const [isLoadingCEP, setIsLoadingCEP] = useState(false);
```

#### Hook de Busca:
```typescript
useEffect(() => {
  const searchCEP = async () => {
    const cleanCEP = addressData.postalCode.replace(/\D/g, '');
    
    // Só busca se tiver 8 dígitos
    if (!isValidCEP(cleanCEP)) {
      return;
    }

    setIsLoadingCEP(true);

    try {
      const address = await fetchAddressByCEP(cleanCEP);

      if (address) {
        // Preenche apenas se campos vazios
        setAddressData(prev => ({
          ...prev,
          street: prev.street || address.logradouro || '',
          neighborhood: prev.neighborhood || address.bairro || '',
        }));

        toast.success('✅ CEP encontrado!');
      } else {
        toast.warning('⚠️ CEP não encontrado. Preencha manualmente.');
      }
    } catch (error) {
      toast.error('❌ Erro ao buscar CEP');
    } finally {
      setIsLoadingCEP(false);
    }
  };

  // Debounce: aguarda 500ms após parar de digitar
  const timeoutId = setTimeout(() => {
    searchCEP();
  }, 500);

  return () => clearTimeout(timeoutId);
}, [addressData.postalCode]);
```

#### UI com Loading:
```tsx
<div className="space-y-2 md:col-span-2">
  <Label htmlFor="postalCode">
    CEP <span className="text-destructive">*</span>
  </Label>
  <div className="relative">
    <Input
      id="postalCode"
      placeholder="12345-678"
      value={addressData.postalCode}
      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
      maxLength={9}
      disabled={isLoadingCEP}
    />
    {isLoadingCEP && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )}
  </div>
  <p className="text-xs text-muted-foreground">
    Digite o CEP para preencher automaticamente
  </p>
</div>
```

---

## 🎯 Fluxo de Uso

### Cenário 1: CEP Válido Encontrado ✅

```
1. Usuário digita: 01001000
   ↓
2. Campo formata: 01001-000
   ↓
3. useEffect detecta mudança
   ↓
4. Aguarda 500ms (debounce)
   ↓
5. Mostra loading (spinner ao lado direito)
   ↓
6. Chama ViaCEP: https://viacep.com.br/ws/01001000/json/
   ↓
7. Recebe resposta:
   {
     "cep": "01001-000",
     "logradouro": "Praça da Sé",
     "bairro": "Sé",
     "localidade": "São Paulo",
     "uf": "SP",
     ...
   }
   ↓
8. Preenche campos automaticamente:
   - Rua: "Praça da Sé"
   - Bairro: "Sé"
   ↓
9. Remove loading
   ↓
10. Mostra toast: "✅ CEP encontrado!"
   ↓
11. Usuário preenche Número e Complemento
```

### Cenário 2: CEP Não Encontrado ⚠️

```
1. Usuário digita: 99999999
   ↓
2. Campo formata: 99999-999
   ↓
3. Aguarda 500ms
   ↓
4. Mostra loading
   ↓
5. Chama ViaCEP
   ↓
6. Recebe: { "erro": true }
   ↓
7. Remove loading
   ↓
8. Mostra toast: "⚠️ CEP não encontrado. Preencha manualmente."
   ↓
9. Campos Rua e Bairro permanecem vazios
   ↓
10. Usuário preenche manualmente
```

### Cenário 3: Erro de Rede ❌

```
1. Usuário digita CEP válido
   ↓
2. Aguarda 500ms
   ↓
3. Mostra loading
   ↓
4. Chama ViaCEP
   ↓
5. Erro de rede (timeout, offline, etc)
   ↓
6. catch (error)
   ↓
7. Remove loading
   ↓
8. Mostra toast: "❌ Erro ao buscar CEP"
   ↓
9. Usuário preenche manualmente
```

### Cenário 4: Usuário Digita e Apaga ⏱️

```
1. Usuário digita: 12345
   ↓
2. Aguarda 500ms
   ↓
3. Usuário apaga antes de 500ms
   ↓
4. Timeout é cancelado (clearTimeout)
   ↓
5. Nenhuma requisição é feita
```

---

## ⚙️ Configurações

### Debounce Time
```typescript
const DEBOUNCE_TIME = 500; // ms

const timeoutId = setTimeout(() => {
  searchCEP();
}, DEBOUNCE_TIME);
```

**Por que 500ms?**
- Evita requisições a cada tecla digitada
- Usuário tem tempo de colar CEP completo
- Não é lento demais (não frustra usuário)

### CEP Formatação
```typescript
// Entrada: 12345678
// Saída: 12345-678

if (sanitized.length > 5) {
  sanitized = `${sanitized.slice(0, 5)}-${sanitized.slice(5)}`;
}
```

### Validação
```typescript
export function isValidCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}
```

---

## 🎨 UI/UX

### Loading State
```tsx
{isLoadingCEP && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2">
    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  </div>
)}
```

**Posição:** Lado direito do input de CEP
**Ícone:** Spinner animado (Loader2 do lucide-react)
**Cor:** `text-muted-foreground` (cinza claro)

### Disabled Inputs Durante Loading
```tsx
<Input
  disabled={isLoadingCEP}
  // Desabilita CEP, Rua e Bairro durante busca
/>
```

**Por quê?**
- Evita usuário digitar enquanto busca
- Indica visualmente que algo está acontecendo
- Previne conflitos de dados

### Ordem dos Campos
```
1. CEP (primeiro - triggers busca)
2. Rua (preenchido automaticamente)
3. Número (usuário preenche)
4. Bairro (preenchido automaticamente)
5. Complemento (usuário preenche - opcional)
```

### Feedback com Toasts
```typescript
// Sucesso
toast.success('✅ CEP encontrado!');

// Não encontrado (não é erro fatal)
toast.warning('⚠️ CEP não encontrado. Preencha manualmente.');

// Erro de rede
toast.error('❌ Erro ao buscar CEP');
```

---

## 🔒 Tratamento de Erros

### 1. CEP Incompleto
```typescript
if (!isValidCEP(cleanCEP)) {
  return; // Não faz requisição
}
```

### 2. CEP Não Encontrado
```typescript
if (data.erro) {
  toast.warning('⚠️ CEP não encontrado. Preencha manualmente.');
  return null;
}
```

### 3. Erro de Rede
```typescript
catch (error) {
  console.error('Erro ao buscar CEP:', error);
  toast.error('❌ Erro ao buscar CEP');
}
finally {
  setIsLoadingCEP(false); // Sempre remove loading
}
```

### 4. Resposta HTTP != 200
```typescript
if (!response.ok) {
  console.error('❌ Erro na requisição ViaCEP:', response.status);
  return null;
}
```

---

## 📊 Exemplo de Resposta ViaCEP

### Sucesso:
```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "unidade": "",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "estado": "São Paulo",
  "regiao": "Sudeste",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7107"
}
```

### CEP Não Encontrado:
```json
{
  "erro": true
}
```

---

## 🧪 Como Testar

### 1. Teste de CEP Válido:
```
1. Digite CEP: 01001000
2. Aguarde 500ms
3. Verifique:
   - Spinner aparece
   - Rua: "Praça da Sé"
   - Bairro: "Sé"
   - Toast: "✅ CEP encontrado!"
```

### 2. Teste de CEP Inválido:
```
1. Digite CEP: 99999999
2. Aguarde 500ms
3. Verifique:
   - Spinner aparece e desaparece
   - Campos vazios
   - Toast: "⚠️ CEP não encontrado"
```

### 3. Teste de Debounce:
```
1. Digite lentamente: 0-1-0-0-1
2. Verifique: Nenhuma requisição feita
3. Digite rápido: 000
4. Aguarde 500ms
5. Verifique: 1 requisição após 500ms
```

### 4. Teste de Colar CEP:
```
1. Copie: 01001-000
2. Cole no campo
3. Verifique:
   - Aguarda 500ms
   - Faz 1 requisição
   - Preenche campos
```

### 5. Teste de Preenchimento Manual:
```
1. Digite CEP inválido
2. Preencha Rua e Bairro manualmente
3. Digite CEP válido diferente
4. Verifique:
   - Campos NÃO são sobrescritos
   - Lógica: prev.street || address.logradouro
```

---

## 🚀 Melhorias Futuras

1. **Cache de CEPs**
   - Salvar CEPs buscados no localStorage
   - Evitar requisições repetidas

2. **Autocomplete de Endereços**
   - Sugerir endereços enquanto digita
   - Integrar com Google Places

3. **Validação de CEP por Estado**
   - Verificar se CEP é válido para o estado
   - Validar intervalos de CEP por região

4. **Mostrar Cidade e Estado**
   - Exibir informação adicional
   - Útil para validação visual

5. **Retry Logic**
   - Tentar novamente se falhar
   - Exponential backoff

6. **Offline Mode**
   - Detectar se está offline
   - Não mostrar erro, apenas avisar

---

## 📝 Checklist de Implementação

- [x] Criar serviço `viaCEP.ts`
- [x] Interface `ViaCEPResponse`
- [x] Função `fetchAddressByCEP`
- [x] Função `formatCEP`
- [x] Função `isValidCEP`
- [x] Adicionar estado `isLoadingCEP`
- [x] Criar `useEffect` com debounce
- [x] Adicionar loading indicator (Loader2)
- [x] Desabilitar inputs durante busca
- [x] Preencher rua e bairro automaticamente
- [x] Toasts de feedback (sucesso, warning, erro)
- [x] Reordenar campos (CEP primeiro)
- [x] Tratamento de erros
- [x] Cleanup de timeout
- [x] Documentação completa

---

## 🔗 Recursos

- [ViaCEP - Documentação](https://viacep.com.br/)
- [ViaCEP - GitHub](https://github.com/viacep/viacep)
- API Gratuita e sem necessidade de autenticação
