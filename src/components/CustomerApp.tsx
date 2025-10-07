import React, { useState } from 'react';
import { MenuPage } from './customer/MenuPage';
import { CartSheet } from './customer/CartSheet';
import { CheckoutFlow } from './customer/CheckoutFlow';
import { OrderStatus } from './customer/OrderStatus';
import { useRestaurantStore } from '@/stores';

type CustomerView = 'menu' | 'checkout' | 'order-status';

export const CustomerApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<CustomerView>('menu');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const { currentRestaurant } = useRestaurantStore();

  if (!currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2>Nenhum Restaurante Selecionado</h2>
          <p className="text-muted-foreground">Por favor, selecione um restaurante para continuar.</p>
        </div>
      </div>
    );
  }

  const handleOrderComplete = (orderId: string) => {
    setCurrentOrderId(orderId);
    setCurrentView('order-status');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
    setCurrentOrderId(null);
  };

  return (
    <div className="min-h-dvh bg-background">
      {currentView === 'menu' && (
        <>
          <MenuPage onStartCheckout={() => setCurrentView('checkout')} />
          <CartSheet onCheckout={() => setCurrentView('checkout')} />
        </>
      )}

      {currentView === 'checkout' && (
        <CheckoutFlow 
          onOrderComplete={handleOrderComplete}
          onBack={() => setCurrentView('menu')}
        />
      )}

      {currentView === 'order-status' && currentOrderId && (
        <OrderStatus 
          orderId={currentOrderId}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};