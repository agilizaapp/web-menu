import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useRestaurantStore } from '@/stores';
import { mockRestaurants } from '@/data/mockData';

interface RestaurantSelectorProps {
  onSelectMode: (mode: 'customer' | 'admin') => void;
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({ onSelectMode }) => {
  const { setCurrentRestaurant } = useRestaurantStore();

  const handleSelectRestaurant = (restaurant: typeof mockRestaurants[0], viewType: 'customer' | 'admin') => {
    setCurrentRestaurant(restaurant);
    onSelectMode(viewType);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Plataforma de Restaurantes White-Label</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Sistema de Pedidos Multi-Tenant Mobile-First
          </p>
          <p className="text-muted-foreground">
            Escolha um tema de restaurante para explorar a experiência do cliente ou o painel administrativo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRestaurants.map(restaurant => (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader 
                className="pb-4"
                style={{ 
                  backgroundColor: restaurant.theme.secondaryColor,
                  borderBottom: `2px solid ${restaurant.theme.primaryColor}`
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{restaurant.theme.logo}</span>
                  <div>
                    <CardTitle 
                      className="text-xl"
                      style={{ color: restaurant.theme.primaryColor }}
                    >
                      {restaurant.theme.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.settings.hours}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Theme Colors Preview */}
                  <div className="flex gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: restaurant.theme.primaryColor }}
                      title="Cor Primária"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: restaurant.theme.accentColor }}
                      title="Cor de Destaque"
                    />
                    <Badge variant="outline" className="ml-auto">
                      Entrega: R$ {restaurant.settings.deliveryFee.toFixed(2)}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSelectRestaurant(restaurant, 'customer')}
                      className="w-full"
                      style={{ backgroundColor: restaurant.theme.primaryColor }}
                    >
                      Ver Experiência do Cliente
                    </Button>
                    <Button
                      onClick={() => handleSelectRestaurant(restaurant, 'admin')}
                      variant="outline"
                      className="w-full"
                      style={{ 
                        borderColor: restaurant.theme.primaryColor,
                        color: restaurant.theme.primaryColor
                      }}
                    >
                      Painel Administrativo
                    </Button>
                  </div>

                  {/* Features List */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>✓ Design mobile-first</div>
                    <div>✓ Integração com PIX</div>
                    <div>✓ Rastreamento em tempo real</div>
                    <div>✓ Temas dinâmicos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 Recursos do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Design responsivo mobile-first</div>
              <div>• Cardápio visual com imagens de alta qualidade</div>
              <div>• Carrinho inteligente com modificadores</div>
              <div>• Pagamento PIX com QR code</div>
              <div>• Rastreamento de pedido em tempo real</div>
              <div>• Checkout sem cadastro e contas de usuário</div>
              <div>• Funcionalidade de re-pedido</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Recursos Administrativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Gestão de pedidos ao vivo com notificações</div>
              <div>• Construtor visual de cardápio com upload de fotos</div>
              <div>• Sistema dinâmico de marca e temas</div>
              <div>• Analytics e relatórios de vendas</div>
              <div>• Gerenciamento de configurações operacionais</div>
              <div>• Gerenciamento de usuários da equipe</div>
              <div>• Atualizações de status em tempo real</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};