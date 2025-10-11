// src/components/admin/OrderManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Phone, MapPin, Clock, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStore, useRestaurantStore } from '@/stores';
import { IOrderApi, IOrderAddress, OrderStatus } from '@/types/admin/api.types';
import { MenuItem } from '@/types/entities.types';
import { toast } from 'sonner';
import { AdminService } from '@/services/admin/admin.service';
import { ApiError } from '@/lib/utils/api-error';

// Helper function to format address for display
const formatAddress = (address: IOrderAddress | undefined): string => {
  if (!address) return 'Retirada no local';
  
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

// Helper para encontrar produto no menu
const findMenuItem = (productId: number, menu: MenuItem[]): MenuItem | null => {
  return menu.find(item => item.id === productId) || null;
};

// Helper para formatar modificadores
const formatModifiers = (modifiers: IOrderApi['detail']['items'][0]['modifiers'], menuItem: MenuItem | null): string => {
  if (!modifiers || modifiers.length === 0 || !menuItem?.modifiers) return '';
  
  const modifierNames: string[] = [];
  
  modifiers.forEach(mod => {
    const modifierGroup = menuItem.modifiers?.find(g => g.id === mod.modifier_id);
    if (modifierGroup) {
      const option = modifierGroup.options.find(o => o.id === mod.option_id);
      if (option) {
        modifierNames.push(option.name);
      }
    }
  });
  
  return modifierNames.join(', ');
};

// Helper para calcular preço do item com modificadores
const calculateItemPrice = (
  productId: number,
  quantity: number,
  modifiers: IOrderApi['detail']['items'][0]['modifiers'],
  menu: MenuItem[]
): number => {
  const menuItem = findMenuItem(productId, menu);
  if (!menuItem) return 0;
  
  let basePrice = menuItem.price;
  let modifiersPrice = 0;
  
  if (modifiers && menuItem.modifiers) {
    modifiers.forEach(mod => {
      const modifierGroup = menuItem.modifiers?.find(g => g.id === mod.modifier_id);
      if (modifierGroup) {
        const option = modifierGroup.options.find(o => o.id === mod.option_id);
        if (option) {
          modifiersPrice += option.price;
        }
      }
    });
  }
  
  return (basePrice + modifiersPrice) * quantity;
};

export const OrderManagement: React.FC = () => {
  // Stores
  const { menu } = useRestaurantStore();
  const { updateOrderStatus: updateLocalOrderStatus } = useOrderStore();
  
  // Local state
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiOrders, setApiOrders] = useState<IOrderApi[]>([]);

  // ✅ Buscar pedidos da API ao montar componente
  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true); // silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sound notification for new orders
  useEffect(() => {
    const newOrders = apiOrders.filter(order => order.status === 'pending');
    if (newOrders.length > 0 && soundEnabled) {
      console.log('🔔 Novo pedido pendente!');
    }
  }, [apiOrders, soundEnabled]);

  /**
   * Buscar pedidos da API
   */
  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await AdminService.getAllOrders();

      setApiOrders(response?.orders || []);

      if (!silent && response?.orders) {
        toast.success(`${response.orders.length} pedidos carregados`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao carregar pedidos da API');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Filtrar pedidos
   */
  const filteredOrders = filter === 'all' 
    ? apiOrders 
    : apiOrders.filter(order => order.status === filter);

  /**
   * Atualizar status do pedido
   */
  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    try {
      // ✅ Atualizar na API
      await AdminService.updateOrderStatus(orderId.toString(), newStatus);

      // ✅ Atualizar localmente
      setApiOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );

      // ✅ Atualizar store (fallback)
      updateLocalOrderStatus(`order-${orderId}`, newStatus);

      // Feedbacks específicos
      const messages: Record<OrderStatus, string> = {
        pending: 'Pedido marcado como pendente',
        accepted: '✅ Pedido aceito!',
        rejected: '❌ Pedido recusado',
        preparing: '👨‍🍳 Pedido em preparo',
        ready: '🎉 Pedido pronto para entrega!',
        delivered: '✅ Pedido entregue!',
        cancelled: '❌ Pedido cancelado',
      };

      toast.success(messages[newStatus] || 'Status atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar status do pedido');
      }
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 animate-pulse';
      case 'accepted': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Pendente',
      accepted: 'Aceito',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
      rejected: 'Recusado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min atrás`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Pedidos em Tempo Real</h2>
          <p className="text-muted-foreground">
            Gerencie pedidos recebidos e atualize seus status
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Botão de Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {/* Botão de Som */}
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell className="w-4 h-4 mr-2" />
            Som {soundEnabled ? 'Ligado' : 'Desligado'}
          </Button>
          
          {/* Filtro */}
          <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="accepted">Aceitos</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Prontos</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="rejected">Recusados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Nenhum Pedido Encontrado</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "Nenhum pedido foi realizado ainda hoje."
                : `Nenhum pedido com status "${getStatusLabel(filter)}" encontrado.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className={`
              ${order.status === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}
              transition-all duration-300
            `}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                    <Badge variant="secondary" className="capitalize">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(order.created_at)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" />
                    <span className="font-medium">{order.customer.name}</span>
                    {order.customer.phone && (
                      <span className="text-muted-foreground">{order.customer.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {order.detail.delivery 
                        ? formatAddress(order.detail.address)
                        : 'Retirada no local'
                      }
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-2">
                  {order.detail.items.map((item, index) => {
                    const menuItem = findMenuItem(item.product_id, menu);
                    const modifiersText = formatModifiers(item.modifiers, menuItem);
                    const itemTotal = calculateItemPrice(item.product_id, item.quantity, item.modifiers, menu);
                    
                    return (
                      <div key={`${item.product_id}-${index}`} className="flex justify-between text-sm">
                        <span className="flex-1">
                          {item.quantity}x {menuItem?.name || `Produto #${item.product_id}`}
                          {modifiersText && (
                            <span className="text-muted-foreground text-xs block">
                              {modifiersText}
                            </span>
                          )}
                        </span>
                        <span className="font-medium">
                          R$ {itemTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pagamento</span>
                  <span className="capitalize">{order.payment_method.replace('_', ' ')}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>R$ {order.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* WhatsApp Button */}
                {order.whatsapp_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(order.whatsapp_url, '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contatar Cliente
                  </Button>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleStatusUpdate(order.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusUpdate(order.id, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </Button>
                    </div>
                  )}

                  {order.status === 'accepted' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    >
                      Iniciar Preparo
                    </Button>
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                    >
                      Marcar como Pronto
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};