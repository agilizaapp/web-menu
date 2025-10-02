'use client';

import { useState } from 'react';
import { RestaurantSelector } from '@/components/RestaurantSelector';
import { AdminApp } from '@/components/AdminApp';
import { CustomerApp } from '@/components/CustomerApp';
import { useRestaurantStore } from '@/stores';

type AppMode = 'customer' | 'admin';

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const { currentRestaurant } = useRestaurantStore();

  return (
    <div className="min-h-screen bg-background">
      {!currentRestaurant ? (
        <RestaurantSelector onSelectMode={setAppMode} />
      ) : (
        <div>
          {/* Mode Switch Button - Fixed Position */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setAppMode(appMode === 'customer' ? 'admin' : 'customer')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
            >
              {appMode === 'customer' ? 'Modo Admin' : 'Modo Cliente'}
            </button>
          </div>

          {/* App Content */}
          {appMode === 'customer' ? <CustomerApp /> : <AdminApp />}
        </div>
      )}
    </div>
  );
}
