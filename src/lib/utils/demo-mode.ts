/**
 * Utilitários para modo demo
 */

import { useState, useEffect } from 'react';

/**
 * Verifica se a aplicação está em modo demo
 * @returns true se ?demo=true estiver na URL
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('demo') === 'true';
}

/**
 * Obtém o parâmetro demo da URL
 * @returns 'true' | 'false' | null
 */
export function getDemoParam(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('demo');
}

/**
 * Adiciona ou remove o parâmetro demo da URL
 * @param enabled - se deve ativar o modo demo
 */
export function toggleDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  
  if (enabled) {
    url.searchParams.set('demo', 'true');
  } else {
    url.searchParams.delete('demo');
  }
  
  window.history.replaceState({}, '', url.toString());
}

/**
 * Hook para usar o modo demo
 */
export function useDemoMode() {
  const [isDemo, setIsDemo] = useState(false);
  
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);
  
  const toggleDemo = (enabled: boolean) => {
    toggleDemoMode(enabled);
    setIsDemo(enabled);
  };
  
  return { isDemo, toggleDemo };
}
