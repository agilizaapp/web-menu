'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Previne o mini-infobar do Chrome no mobile
      e.preventDefault();
      // Guarda o evento para disparar depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostra nosso UI customizado
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Download className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            Instalar Web Menu
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Adicione à tela inicial para acesso rápido e experiência de app nativo
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1"
            >
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
            >
              Agora não
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
