import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { OrderManagement } from './admin/OrderManagement';
import { MenuManagement } from './admin/MenuManagement';
import { SettingsPanel } from './admin/SettingsPanel';
import { Analytics } from './admin/Analytics';
import { useRestaurantStore } from '@/stores';
import { ClipboardList, UtensilsCrossed, Settings, BarChart3 } from 'lucide-react';

export const AdminApp: React.FC = () => {
  const { currentRestaurant } = useRestaurantStore();
  const [activeTab, setActiveTab] = useState('orders');

  if (!currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2>Acesso Administrativo Necessário</h2>
          <p className="text-muted-foreground">Por favor, selecione um restaurante para gerenciar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentRestaurant.theme.logo}</span>
            <div>
              <h1 className="text-xl font-semibold">Admin {currentRestaurant.theme.name}</h1>
              <p className="text-sm text-muted-foreground">Painel de Gerenciamento do Restaurante</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};