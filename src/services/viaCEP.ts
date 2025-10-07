/**
 * Serviço de integração com ViaCEP
 * Busca informações de endereço a partir do CEP
 */

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean; // ViaCEP retorna {erro: true} quando não encontra
}

/**
 * Busca endereço pelo CEP usando ViaCEP
 * @param cep - CEP com ou sem formatação (12345-678 ou 12345678)
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');

    // Valida se tem 8 dígitos
    if (cleanCEP.length !== 8) {
      return null;
    }


    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      console.error('❌ Erro na requisição ViaCEP:', response.status);
      return null;
    }

    const data: ViaCEPResponse = await response.json();

    // ViaCEP retorna {erro: true} quando não encontra o CEP
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('💥 Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Formata CEP para exibição: 12345678 → 12345-678
 */
export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length > 5) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
  return numbers;
}

/**
 * Valida se o CEP está completo (8 dígitos)
 */
export function isValidCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}
