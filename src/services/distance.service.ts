/**
 * Serviço para calcular distância entre dois endereços e taxa de entrega
 * Usa a API Nominatim (OpenStreetMap) - 100% gratuita
 */

import type { DeliverySettings } from "@/types/entities.types";

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface DistanceResult {
  distanceInKm: number; // distância em km (para exibição)
  distanceInMeters: number; // distância em metros (para cálculo de taxa e envio ao backend)
  duration?: number; // estimativa em minutos
}

/**
 * Formata endereço para melhor resultado de geocoding
 */
function formatAddressForGeocoding(address: string, city: string = "Campo Grande", state: string = "MS"): string {
  // Normalizar formato: trocar " - " por ", "
  let formatted = address.replace(/\s*-\s*/g, ', ');
  
  // Remove vírgulas extras e espaços duplicados
  formatted = formatted.replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
  
  // Remove vírgula no final se existir
  formatted = formatted.replace(/,\s*$/, '');
  
  // Adiciona cidade e estado se não estiver presente
  const lowerFormatted = formatted.toLowerCase();
  
  if (!lowerFormatted.includes('campo grande') && !lowerFormatted.includes(city.toLowerCase())) {
    formatted += `, ${city}`;
  }
  
  if (!lowerFormatted.includes(state.toLowerCase()) && !lowerFormatted.includes('ms')) {
    formatted += `, ${state}`;
  }
  
  // Garante que tem Brasil no final se não tiver
  if (!lowerFormatted.includes('brasil') && !lowerFormatted.includes('brazil')) {
    formatted += ', Brasil';
  }
  
  return formatted;
}

/**
 * Verifica se o endereço está mascarado (contém asteriscos ou está incompleto)
 */
function isAddressMasked(address: string): boolean {
  return address.includes('*') || address.includes('...');
}

/**
 * Geocodifica um endereço usando a API Nominatim (OpenStreetMap)
 * API gratuita, sem necessidade de chave
 */
async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodeResult | null> {
  try {
    // Verificar se o endereço está mascarado
    if (isAddressMasked(address)) {
      console.warn('⚠️ Endereço mascarado detectado:', address);
      console.warn('💡 Não é possível geocodificar endereços com asteriscos (*) ou dados incompletos');
      return null;
    }

    console.log('🗺️ Geocodificando:', address);
    
    // Formatar endereço para melhor resultado
    const formattedAddress = formatAddressForGeocoding(address, city, state);
    console.log('📝 Endereço formatado:', formattedAddress);

    // TENTATIVA 1: Busca completa com limit=5 para ter mais opções
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        formattedAddress
      )}&format=json&limit=5&countrycodes=br&addressdetails=1`,
      {
        headers: {
          "User-Agent": "DeliveryApp/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error('❌ Erro HTTP na geocodificação:', response.status, response.statusText);
      return null;
    }

    let data = await response.json();
    
    // Se encontrou resultados, usar o primeiro
    if (data && data.length > 0) {
      console.log('✅ Coordenadas obtidas:', { 
        lat: data[0].lat, 
        lon: data[0].lon, 
        display_name: data[0].display_name,
        importance: data[0].importance 
      });
      return data[0];
    }

    // TENTATIVA 2: Busca apenas com cidade e estado (mais genérica)
    console.warn('⚠️ Nenhum resultado na busca completa. Tentando busca genérica...');
    const genericAddress = `${city}, ${state}, Brasil`;
    console.log('🔍 Tentativa 2 - Endereço genérico:', genericAddress);
    
    await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limit
    
    response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        genericAddress
      )}&format=json&limit=1&countrycodes=br&addressdetails=1`,
      {
        headers: {
          "User-Agent": "DeliveryApp/1.0",
        },
      }
    );

    if (response.ok) {
      data = await response.json();
      if (data && data.length > 0) {
        console.warn('⚠️ Usando coordenadas genéricas da cidade:', data[0].display_name);
        console.warn('💡 Distância pode ser menos precisa');
        return data[0];
      }
    }

    console.error('❌ Não foi possível geocodificar:', address);
    console.error('💡 Dica: Verifique se o endereço está completo e correto');
    return null;
  } catch (error) {
    console.error("❌ Erro ao geocodificar endereço:", error);
    return null;
  }
}

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * Retorna a distância em metros
 */
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

  return Math.round(distanceInMeters); // Arredonda para número inteiro de metros
}

/**
 * Calcula a distância entre dois endereços
 * @param originAddress Endereço de origem (pickup location)
 * @param destinationAddress Endereço de destino (customer address)
 * @param city Cidade (default: Campo Grande)
 * @param state Estado (default: MS)
 */
export async function calculateDistance(
  originAddress: string,
  destinationAddress: string,
  city: string = "Campo Grande",
  state: string = "MS"
): Promise<DistanceResult> {
  console.log('📍 Calculando distância entre:', { originAddress, destinationAddress });

  // Verificar se algum endereço está mascarado
  if (isAddressMasked(originAddress) || isAddressMasked(destinationAddress)) {
    const errorMsg = "Não é possível calcular distância com endereços mascarados. Por favor, forneça endereços completos.";
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  // Delay para respeitar rate limit do Nominatim (1 req/seg)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const origin = await geocodeAddress(originAddress, city, state);
  
  // Aguardar 1 segundo entre requisições (rate limit Nominatim)
  await delay(1100);
  
  const destination = await geocodeAddress(destinationAddress, city, state);

  if (!origin || !destination) {
    const errorMsg = !origin && !destination 
      ? "Não foi possível geocodificar nenhum dos endereços"
      : !origin 
        ? `Não foi possível geocodificar o endereço de origem: "${originAddress}"`
        : `Não foi possível geocodificar o endereço de destino: "${destinationAddress}"`;
    
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  const distanceInMeters = calculateHaversineDistance(
    parseFloat(origin.lat),
    parseFloat(origin.lon),
    parseFloat(destination.lat),
    parseFloat(destination.lon)
  );

  const distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100; // km com 2 casas decimais

  // Estimativa simples: 30 km/h de velocidade média
  const duration = Math.round((distanceInKm / 30) * 60);

  console.log(`✅ Distância calculada: ${distanceInKm}km (${distanceInMeters}m) - Tempo estimado: ${duration}min`);

  return { distanceInKm, distanceInMeters, duration };
}

/**
 * Calcula a taxa de entrega baseado na distância e tabela de preços
 * @param distanceInMeters Distância em metros
 * @param deliverySettings Array de configurações de entrega da API
 */
export function calculateDeliveryFee(
  distanceInMeters: number,
  deliverySettings: DeliverySettings[]
): number {
  if (!deliverySettings || deliverySettings.length === 0) return 0;

  // Ordena a tabela por distance (crescente)
  const sortedSettings = [...deliverySettings].sort((a, b) => a.distance - b.distance);

  // Encontra a taxa apropriada
  for (let i = 0; i < sortedSettings.length; i++) {
    const currentTier = sortedSettings[i];
    const nextTier = sortedSettings[i + 1];

    // Se a distância está dentro desta faixa
    if (distanceInMeters >= currentTier.distance && (!nextTier || distanceInMeters < nextTier.distance)) {
      console.log(`💰 Taxa aplicada: R$ ${currentTier.value.toFixed(2)} (${distanceInMeters}m na faixa ${currentTier.distance}m)`);
      return currentTier.value;
    }
  }

  // Fallback: retorna a última taxa (maior distância)
  const lastTier = sortedSettings[sortedSettings.length - 1];
  console.log(`💰 Taxa aplicada (fallback): R$ ${lastTier.value.toFixed(2)}`);
  return lastTier.value;
}

/**
 * Formata as faixas de taxa para exibição
 */
export function formatDeliveryTaxRanges(
  deliverySettings: DeliverySettings[]
): string[] {
  if (!deliverySettings || deliverySettings.length === 0) return [];

  const sortedSettings = [...deliverySettings].sort((a, b) => a.distance - b.distance);
  const ranges: string[] = [];

  for (let i = 0; i < sortedSettings.length; i++) {
    const current = sortedSettings[i];
    const next = sortedSettings[i + 1];

    const currentKm = (current.distance / 1000).toFixed(1);

    if (next) {
      const nextKm = (next.distance / 1000).toFixed(1);
      ranges.push(
        `De ${currentKm}km a ${nextKm}km - R$ ${current.value.toFixed(2)}`
      );
    } else {
      ranges.push(`Acima de ${currentKm}km - R$ ${current.value.toFixed(2)}`);
    }
  }

  return ranges;
}
