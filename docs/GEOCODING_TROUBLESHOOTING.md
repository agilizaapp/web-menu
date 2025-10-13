# Troubleshooting - Geocoding de Endereços

## Problema: "Não foi possível geocodificar os endereços"

### Causas Comuns

#### 1. **Endereço Incompleto ou Mal Formatado**

❌ **Evite:**
```
"Rua X"
"123"
"Centro"
```

✅ **Use:**
```
"Rua João Silva, 123, Centro, Campo Grande, MS, 79002-000"
```

#### 2. **CEP Inválido ou Inexistente**

O Nominatim pode não encontrar CEPs muito específicos. Tente:

```javascript
// Bom
"Rua Exemplo, 123, Centro, Campo Grande, MS"

// Melhor ainda
"Rua Exemplo, 123, Centro, Campo Grande, MS, Brasil"
```

#### 3. **Rate Limit do Nominatim**

**Limite:** 1 requisição por segundo

**Solução implementada:**
```typescript
// Delay de 1.1 segundo entre geocoding de origem e destino
await delay(1100);
```

Se você tiver muitos cálculos seguidos, considere aumentar o delay ou implementar cache.

#### 4. **Nominatim API Temporariamente Indisponível**

**Verificar status:**
- Acesse: https://nominatim.openstreetmap.org/status
- Verifique console do navegador para erros HTTP

**Fallback implementado:**
- Sistema usa taxa mínima quando geocoding falha
- Toast notification informa o usuário

## Logs de Debug

### Console do Navegador

Procure por estas mensagens:

```
✅ Sucesso:
🗺️ Geocodificando: Rua Exemplo, 123, Centro...
📝 Endereço formatado: Rua Exemplo, 123, Centro, Brasil
✅ Coordenadas obtidas: { lat: "-20.123", lon: "-54.456", ... }
📍 Calculando distância entre: {...}
✅ Distância calculada: 2.5km (2500m) - Tempo estimado: 5min
💰 Taxa aplicada: R$ 5.00 (2500m na faixa 0m)

❌ Erro:
❌ Erro HTTP na geocodificação: 429 Too Many Requests
⚠️ Nenhum resultado encontrado para: ...
💡 Dica: Verifique se o endereço está completo e correto
❌ Não foi possível geocodificar o endereço de origem: "..."
❌ Não foi possível geocodificar o endereço de destino: "..."
```

## Testes Manuais

### 1. Teste Básico (Campo Grande, MS)

**Restaurante:**
```
Rua da Justiça, 2487, Jardim Imperial, Campo Grande, MS
```

**Cliente:**
```
Rua 14 de Julho, 3000, Centro, Campo Grande, MS
```

**Resultado Esperado:**
- Geocoding bem-sucedido
- Distância: ~4-5km
- Taxa: R$ 7,00 (faixa 3.001-5.000m)

### 2. Teste com CEP

**Cliente:**
```
Rua 14 de Julho, 3000, Centro, 79002-000
```

**Resultado Esperado:**
- Geocoding bem-sucedido
- CEP ajuda na precisão

### 3. Teste de Fallback

**Cliente:** (endereço inválido)
```
Rua Inexistente XYZ, 99999, Bairro Fantasma
```

**Resultado Esperado:**
- ❌ Geocoding falha
- Toast: "Não foi possível calcular a distância exata... Usando taxa mínima."
- Taxa = R$ 5,00 (menor valor da tabela)

## Melhorias para Produção

### 1. Cache de Geocoding

Evita requisições repetidas para o mesmo endereço:

```typescript
// Implementação sugerida
const geocodeCache = new Map<string, {lat: number, lon: number}>();

async function geocodeAddressWithCache(address: string) {
  const cacheKey = address.toLowerCase().trim();
  
  if (geocodeCache.has(cacheKey)) {
    console.log('💾 Usando coordenadas do cache');
    return geocodeCache.get(cacheKey);
  }
  
  const result = await geocodeAddress(address);
  
  if (result) {
    geocodeCache.set(cacheKey, {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    });
  }
  
  return result;
}
```

### 2. Geocoding pelo CEP

Usar ViaCEP ou API similar para obter coordenadas aproximadas:

```typescript
async function geocodeByCEP(cep: string) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();
  
  // Usar logradouro + bairro + cidade do ViaCEP
  const address = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
  return geocodeAddress(address);
}
```

### 3. Retry Logic

Tentar novamente em caso de falha temporária:

```typescript
async function geocodeAddressWithRetry(
  address: string, 
  retries = 2
): Promise<GeocodeResult | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await geocodeAddress(address);
      if (result) return result;
      
      // Aguardar antes de tentar novamente
      if (i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    } catch (error) {
      console.error(`Tentativa ${i + 1} falhou:`, error);
    }
  }
  return null;
}
```

### 4. API Alternativa (Photon)

Photon é outra API gratuita baseada em OpenStreetMap:

```typescript
// https://photon.komoot.io/
async function geocodeWithPhoton(address: string) {
  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`
  );
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const coords = data.features[0].geometry.coordinates;
    return {
      lat: coords[1].toString(),
      lon: coords[0].toString(),
      display_name: data.features[0].properties.name
    };
  }
  return null;
}
```

### 5. Validação de Endereço

Validar antes de enviar para geocoding:

```typescript
function validateAddress(address: AddressData): boolean {
  // Verificar campos obrigatórios
  if (!address.street || address.street.length < 3) return false;
  if (!address.number) return false;
  if (!address.neighborhood || address.neighborhood.length < 3) return false;
  
  // Verificar CEP (8 dígitos)
  if (address.postalCode) {
    const cepDigits = address.postalCode.replace(/\D/g, '');
    if (cepDigits.length !== 8) return false;
  }
  
  return true;
}
```

## Checklist de Debug

Quando o geocoding falhar, verifique:

- [ ] Endereço tem rua, número e bairro?
- [ ] CEP está correto (8 dígitos)?
- [ ] Console mostra erro HTTP (429, 503, etc.)?
- [ ] Passou mais de 1 segundo desde última requisição?
- [ ] Nominatim está online? (https://nominatim.openstreetmap.org/status)
- [ ] Endereço existe de verdade? (testar no Google Maps)
- [ ] User-Agent está configurado corretamente?
- [ ] Fetch está permitido (CORS, firewall, etc.)?

## Exemplo de Endereços Válidos (Campo Grande, MS)

```javascript
const endereçosTestados = [
  "Av. Afonso Pena, 2000, Centro, Campo Grande, MS",
  "Rua 14 de Julho, 3000, Centro, Campo Grande, MS",
  "Av. Mato Grosso, 1500, Amambaí, Campo Grande, MS",
  "Rua da Paz, 100, Jardim dos Estados, Campo Grande, MS",
];
```

## Monitoramento

### Métricas Importantes

```typescript
// Adicionar ao código de produção
const geocodingMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
};

// Incrementar conforme uso
geocodingMetrics.totalRequests++;
if (result) geocodingMetrics.successfulRequests++;
else geocodingMetrics.failedRequests++;

// Taxa de sucesso
const successRate = 
  (geocodingMetrics.successfulRequests / geocodingMetrics.totalRequests) * 100;

console.log(`Taxa de sucesso: ${successRate.toFixed(2)}%`);
```

## Referências

- **Nominatim API Docs:** https://nominatim.org/release-docs/latest/api/Search/
- **Nominatim Usage Policy:** https://operations.osmfoundation.org/policies/nominatim/
- **Photon API:** https://photon.komoot.io/
- **ViaCEP API:** https://viacep.com.br/

---

**Atualizado:** 12/10/2025
