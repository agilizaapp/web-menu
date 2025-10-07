/**
 * Serviço de gerenciamento de cookies
 */

const CUSTOMER_TOKEN_KEY = 'customer_token';
const TOKEN_EXPIRY_DAYS = 365; // 1 ano

export const cookieService = {
  /**
   * Salva o token do cliente
   */
  setCustomerToken(token: string): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    
    document.cookie = `${CUSTOMER_TOKEN_KEY}=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
  },

  /**
   * Recupera o token do cliente
   */
  getCustomerToken(): string | null {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CUSTOMER_TOKEN_KEY) {
        return value;
      }
    }
    
    return null;
  },

  /**
   * Remove o token do cliente
   */
  removeCustomerToken(): void {
    document.cookie = `${CUSTOMER_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  /**
   * Verifica se o cliente está autenticado
   */
  isAuthenticated(): boolean {
    return this.getCustomerToken() !== null;
  }
};
