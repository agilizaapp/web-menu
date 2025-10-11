'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Phone, MapPin, Clock, RefreshCcw, Loader2 } from 'lucide-react';
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

// ==================== HELPER FUNCTIONS ====================

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
    parts.push(`(${address.complement})`);
  }
  
  return parts.join(', ') || 'Endereço não informado';
};

// Helper para encontrar produto no menu (para buscar modificadores)
const findMenuItem = (productId: number, menu: MenuItem[]): MenuItem | null => {
  return menu.find(item => item.id === productId) || null;
};

// ✅ ATUALIZADO: Helper para formatar modificadores
const formatModifiers = (
  modifiers: IOrderApi['detail']['items'][0]['modifiers'], 
  menuItem: MenuItem | null
): string => {
  if (!modifiers || modifiers.length === 0) return '';
  
  // Se não temos o menuItem, retorna vazio (não podemos buscar nomes)
  if (!menuItem?.modifiers) return '';
  
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
  
  return modifierNames.length > 0 ? modifierNames.join(', ') : '';
};

// ✅ ATUALIZADO: Helper para calcular preço total do item (price já vem da API)
const calculateItemTotal = (
  price: number,
  quantity: number,
  modifiers: IOrderApi['detail']['items'][0]['modifiers'],
  menuItem: MenuItem | null
): number => {
  // O preço base já vem da API
  let itemPrice = price;
  
  // Adicionar preço dos modificadores (se disponível no menu)
  if (modifiers && menuItem?.modifiers) {
    modifiers.forEach(mod => {
      const modifierGroup = menuItem.modifiers?.find(g => g.id === mod.modifier_id);
      if (modifierGroup) {
        const option = modifierGroup.options.find(o => o.id === mod.option_id);
        if (option) {
          itemPrice += option.price;
        }
      }
    });
  }
  
  return itemPrice * quantity;
};

// Helper para formatar método de pagamento
const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    'pix': 'PIX',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'cash': 'Dinheiro',
  };
  return methods[method] || method;
};

// ==================== COMPONENT ====================

export const OrderManagement: React.FC = () => {
  const { menu } = useRestaurantStore();
  const { updateOrderStatus: updateLocalOrderStatus } = useOrderStore();
  
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiOrders, setApiOrders] = useState<IOrderApi[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newOrders = apiOrders.filter(order => order.status === 'pending');
    if (newOrders.length > 0 && soundEnabled) {
      console.log('🔔 Novo pedido pendente!');
    }
  }, [apiOrders, soundEnabled]);

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

  const filteredOrders = filter === 'all' 
    ? apiOrders 
    : apiOrders.filter(order => order.status === filter);

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    try {
      setLoadingOrders(prev => new Set(prev).add(orderId));

      await AdminService.updateOrderStatus(orderId, newStatus);

      setApiOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );

      updateLocalOrderStatus(`order-${orderId}`, newStatus);

      const messages: Record<OrderStatus, string> = {
        pending: 'Pedido marcado como pendente',
        confirmed: '✅ Pedido confirmado!',
        in_progress: '👨‍🍳 Pedido em preparo',
        prepared: '🎉 Pedido preparado!',
        finished: '✅ Pedido finalizado!',
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
    } finally {
      setLoadingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const isOrderLoading = (orderId: number) => loadingOrders.has(orderId);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 animate-pulse';
      case 'confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'prepared': return 'bg-green-500';
      case 'finished': return 'bg-green-600';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Progresso',
      prepared: 'Preparado',
      finished: 'Finalizado',
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell className="w-4 h-4 mr-2" />
            Som {soundEnabled ? 'Ligado' : 'Desligado'}
          </Button>
          
          <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="prepared">Preparados</SelectItem>
              <SelectItem value="finished">Finalizados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
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
          {filteredOrders.map(order => {
            const orderLoading = isOrderLoading(order.id);
            
            return (
              <Card 
                key={order.id} 
                className={`
                  ${order.status === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}
                  ${orderLoading ? 'opacity-60 pointer-events-none' : ''}
                  transition-all duration-300
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      Pedido #{order.id}
                      {orderLoading && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                    </CardTitle>
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
                  {/* ✅ Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{order.customer.name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {order.detail.delivery 
                          ? formatAddress(order.detail.address)
                          : 'Retirada no local'
                        }
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* ✅ ATUALIZADO: Order Items */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Itens do Pedido</h4>
                    {order.detail.items.map((item, index) => {
                      // Buscar menuItem apenas para pegar informações de modificadores
                      const menuItem = findMenuItem(item.product_id, menu);
                      const modifiersText = formatModifiers(item.modifiers, menuItem);
                      // Usar price e quantity da API
                      const itemTotal = calculateItemTotal(item.price, item.quantity, item.modifiers, menuItem);
                      
                      return (
                        <div key={`${item.product_id}-${index}`} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="flex-1">
                              <span className="font-medium">{item.quantity}x</span>{' '}
                              {/* ✅ USAR item.name da API */}
                              {item.name}
                            </span>
                            <span className="font-medium ml-2">
                              R$ {itemTotal.toLocaleString("pt-BR", { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </span>
                          </div>
                          {modifiersText && (
                            <div className="text-xs text-muted-foreground pl-6">
                              + {modifiersText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* ✅ Payment Method */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Forma de Pagamento</span>
                    <span className="font-medium">{formatPaymentMethod(order.payment_method)}</span>
                  </div>

                  {/* ✅ Delivery Type */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo de Entrega</span>
                    <span className="font-medium">
                      {order.detail.delivery ? 'Delivery' : 'Retirada'}
                    </span>
                  </div>

                  <Separator />

                  {/* ✅ Total */}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg">
                      R$ {order.amount.toLocaleString("pt-BR", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* WhatsApp Button */}
                  {order.whatsapp_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(order.whatsapp_url, '_blank')}
                      disabled={orderLoading}
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
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          disabled={orderLoading}
                        >
                          {orderLoading ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-1" />
                          )}
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          disabled={orderLoading}
                        >
                          {orderLoading ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Confirmar
                        </Button>
                      </div>
                    )}

                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                        disabled={orderLoading}
                      >
                        {orderLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Iniciar Preparo
                      </Button>
                    )}

                    {order.status === 'in_progress' && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStatusUpdate(order.id, 'prepared')}
                        disabled={orderLoading}
                      >
                        {orderLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Marcar como Preparado
                      </Button>
                    )}

                    {order.status === 'prepared' && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStatusUpdate(order.id, 'finished')}
                        disabled={orderLoading}
                      >
                        {orderLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Finalizar Pedido
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};