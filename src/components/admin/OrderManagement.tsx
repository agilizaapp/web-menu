import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStore } from '@/stores';
import { Order } from '@/types';
import { toast } from 'sonner';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus } = useOrderStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'preparing' | 'ready'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sound notification for new orders
  useEffect(() => {
    const newOrders = orders.filter(order => order.status === 'pending');
    if (newOrders.length > 0 && soundEnabled) {
      // In a real app, this would play an actual sound
      console.log('🔔 New order notification sound!');
    }
  }, [orders, soundEnabled]);

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    
    if (newStatus === 'accepted') {
      toast.success('Order accepted');
    } else if (newStatus === 'rejected') {
      toast.error('Order rejected');
    } else {
      toast.info(`Order status updated to ${newStatus}`);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 animate-pulse';
      case 'accepted': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const minutes = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Live Orders</h2>
          <p className="text-muted-foreground">
            Manage incoming orders and update their status in real-time
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell className="w-4 h-4 mr-2" />
            Sound {soundEnabled ? 'On' : 'Off'}
          </Button>
          
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? "No orders have been placed yet today."
                : `No orders with status "${filter}" found.`
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
                  <CardTitle className="text-base">#{order.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(order.createdAt)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" />
                    <span className="font-medium">{order.customerInfo.name}</span>
                    <span className="text-muted-foreground">{order.customerInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{order.customerInfo.address}</span>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="flex-1">
                        {item.quantity}x {item.menuItem.name}
                        {Object.keys(item.selectedModifiers).length > 0 && (
                          <span className="text-muted-foreground text-xs block">
                            {Object.entries(item.selectedModifiers).map(([_, options]) => 
                              options.join(', ')
                            ).join(' • ')}
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        ${(item.totalPrice * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

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
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusUpdate(order.id, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}

                  {order.status === 'accepted' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                    >
                      Mark as Ready
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    >
                      Mark as Delivered
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