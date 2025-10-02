import React from 'react';
import { ArrowLeft, Phone, CheckCircle, Clock, Truck, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrderStore, useRestaurantStore } from '@/stores';

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
          <h2>Order Not Found</h2>
          <Button onClick={onBackToMenu} className="mt-4">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: CheckCircle },
    { key: 'accepted', label: 'Order Confirmed', icon: CheckCircle },
    { key: 'preparing', label: 'In the Kitchen', icon: ChefHat },
    { key: 'ready', label: 'Ready for Pickup', icon: Clock },
    { key: 'delivered', label: 'Delivered', icon: Truck }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
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
            <h1 className="text-xl font-semibold">Order Status</h1>
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
                {order.status === 'pending' ? 'Order Received' :
                 order.status === 'accepted' ? 'Order Confirmed' :
                 order.status === 'preparing' ? 'In the Kitchen' :
                 order.status === 'ready' ? 'Ready for Pickup' :
                 order.status === 'delivered' ? 'Delivered' :
                 order.status === 'rejected' ? 'Order Cancelled' :
                 order.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === 'pending' && (
              <p>We've received your order and are processing it.</p>
            )}
            {order.status === 'accepted' && (
              <p>Your order has been confirmed and we're starting to prepare it.</p>
            )}
            {order.status === 'preparing' && (
              <p>Our chefs are preparing your delicious meal!</p>
            )}
            {order.status === 'ready' && (
              <p>Your order is ready for pickup or will be delivered soon.</p>
            )}
            {order.status === 'delivered' && (
              <p>Your order has been delivered. Enjoy your meal!</p>
            )}
            {order.status === 'rejected' && (
              <p>Sorry, we had to cancel your order. You will be refunded shortly.</p>
            )}
          </CardContent>
        </Card>

        {/* Progress Steps */}
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
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span>${(item.totalPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(order.totalAmount - (currentRestaurant.settings.deliveryFee + order.totalAmount * 0.1)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${currentRestaurant.settings.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(order.totalAmount * 0.1).toFixed(2)}</span>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {order.customerInfo.name}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {order.customerInfo.phone}
              </div>
              <div>
                <span className="font-medium">Address:</span> {order.customerInfo.address}
              </div>
              <div>
                <span className="font-medium">Order Time:</span> {order.createdAt.toLocaleTimeString()}
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
            Contact Restaurant
          </Button>
          <Button 
            onClick={onBackToMenu}
            className="flex-1"
            style={{ backgroundColor: 'var(--restaurant-primary)' }}
          >
            Order Again
          </Button>
        </div>
      </div>
    </div>
  );
};