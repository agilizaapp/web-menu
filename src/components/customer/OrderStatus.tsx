import React from 'react';
import { ArrowLeft, Phone, CheckCircle, Clock, Truck, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrderStore, useRestaurantStore } from '@/stores';
import { AddressData } from '@/types';

// Helper function to format address for display
const formatAddress = (address: string | AddressData | undefined): string => {
  if (!address) return 'Endereço não informado';
  
  if (typeof address === 'string') {
    return address;
  }
  
  // Format AddressData object
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.postalCode
  ].filter(Boolean);
  
  if (address.complement) {
    parts.push(address.complement);
  }
  
  return parts.join(', ') || 'Endereço não informado';
};

interface OrderStatusProps {
  orderId: string;
  onBackToMenu: () => void;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({ orderId, onBackToMenu }) => {
  const { orders } = useOrderStore();
  const { currentRestaurant } = useRestaurantStore();
  
  const order = orders.find(o => o.id === orderId);

  if (!order || !currentRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2>Pedido Não Encontrado</h2>
          <Button onClick={onBackToMenu} className="mt-4">
            Voltar ao Cardápio
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Pedido Recebido', icon: CheckCircle },
    { key: 'confirmed', label: 'Pedido Confirmado', icon: CheckCircle },
    { key: 'in_progress', label: 'Na Cozinha', icon: ChefHat },
    { 
      key: 'prepared', 
      label: order.deliveryType === 'delivery' ? 'Saiu para Entrega' : 'Pronto para Retirada', 
      icon: order.deliveryType === 'delivery' ? Truck : Clock 
    },
    { 
      key: 'finished', 
      label: order.deliveryType === 'delivery' ? 'Entregue' : 'Retirado', 
      icon: CheckCircle 
    }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'prepared': return 'bg-green-500';
      case 'finished': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleContactRestaurant = () => {
    // In a real app, this would initiate a phone call
    window.open(`tel:+1234567890`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBackToMenu}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Status do Pedido</h1>
            <p className="text-sm text-muted-foreground">#{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div 
                className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}
              />
              <span className="capitalize">
                {order.status === 'pending' ? 'Pedido Recebido' :
                 order.status === 'confirmed' ? 'Pedido Confirmado' :
                 order.status === 'in_progress' ? 'Na Cozinha' :
                 order.status === 'prepared' ? (order.deliveryType === 'delivery' ? 'Saiu para Entrega' : 'Pronto para Retirada') :
                 order.status === 'finished' ? (order.deliveryType === 'delivery' ? 'Entregue' : 'Retirado') :
                 order.status === 'cancelled' ? 'Pedido Cancelado' :
                 order.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === 'pending' && (
              <p>Recebemos seu pedido e estamos processando.</p>
            )}
            {order.status === 'confirmed' && (
              <p>Seu pedido foi confirmado e estamos começando a prepará-lo.</p>
            )}
            {order.status === 'in_progress' && (
              <p>Nossos chefs estão preparando sua deliciosa refeição!</p>
            )}
            {order.status === 'prepared' && order.deliveryType === 'delivery' && (
              <p>Seu pedido saiu para entrega e chegará em breve!</p>
            )}
            {order.status === 'prepared' && order.deliveryType === 'pickup' && (
              <p>Seu pedido está pronto! Você pode vir buscar a qualquer momento.</p>
            )}
            {order.status === 'finished' && order.deliveryType === 'delivery' && (
              <p>Seu pedido foi entregue. Bom apetite!</p>
            )}
            {order.status === 'finished' && order.deliveryType === 'pickup' && (
              <p>Pedido retirado. Bom apetite!</p>
            )}
            {order.status === 'cancelled' && (
              <p>Desculpe, tivemos que cancelar seu pedido. Você será reembolsado em breve.</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Steps
        {order.status !== 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${isCompleted 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }
                        ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`
                        ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}
                      `}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="default" className="ml-auto">Current</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between gap-1">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span>R$ {(item.totalPrice * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {order.items.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {order.deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span>R$ {currentRestaurant.settings.deliveryFee.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>R$ {order.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery/Pickup Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {order.deliveryType === 'delivery' ? (
                <>
                  <Truck className="w-5 h-5" />
                  Informações de Entrega
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  Informações de Retirada
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Nome:</span> {order.customerInfo.name}
              </div>
              <div>
                <span className="font-medium">Telefone:</span> {order.customerInfo.phone}
              </div>
              <div>
                <span className="font-medium">
                  {order.deliveryType === 'delivery' ? 'Endereço de Entrega:' : 'Local de Retirada:'}
                </span> {formatAddress(order.customerInfo.address)}
              </div>
              <div>
                <span className="font-medium">Horário do Pedido:</span> {new Date(order.createdAt).toLocaleString("pt-BR", { 
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div>
                <span className="font-medium">Método de Pagamento:</span> {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleContactRestaurant}
          >
            <Phone className="w-4 h-4 mr-2" />
            Contatar Restaurante
          </Button>
          <Button 
            onClick={onBackToMenu}
            className="flex-1"
            style={{ backgroundColor: 'var(--restaurant-primary)' }}
          >
            Pedir Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};