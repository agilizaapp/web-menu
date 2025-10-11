'use client';

import React, { useState } from 'react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { OrderManagement } from './admin/OrderManagement';
import { MenuManagement } from './admin/MenuManagement';
import { SettingsPanel } from './admin/SettingsPanel';
import { Analytics } from './admin/Analytics';
import { useRestaurantStore } from '@/stores';
import { ClipboardList, UtensilsCrossed, Settings, BarChart3, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';

export const AdminApp: React.FC = () => {
  const { currentRestaurant } = useRestaurantStore();
  const { isDemoMode, showDemoButton, toggleDemo } = useDemoMode();
  const [activeTab, setActiveTab] = useState('orders');

  const handleToggleDemo = () => {
    toggleDemo();
    if (isDemoMode) {
      setActiveTab('orders');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentRestaurant?.theme?.logo}</span>
              <div>
                <h1 className="text-xl font-semibold">
                  Admin {currentRestaurant?.theme?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Painel de Gerenciamento do Restaurante
                </p>
              </div>
            </div>

            {showDemoButton && (
              <Button
                onClick={handleToggleDemo}
                variant={isDemoMode ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                {isDemoMode ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Ocultar Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver Versão Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {isDemoMode ? (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Cardápio</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurações</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>Pedidos</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Cardápio</span>
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          {isDemoMode && (
            <>
              <TabsContent value="menu" className="space-y-6">
                <MenuManagement />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SettingsPanel />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Analytics />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};