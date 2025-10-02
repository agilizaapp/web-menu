import React, { useState } from 'react';
import { ArrowLeft, Clock, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore, useRestaurantStore, useOrderStore } from '@/stores';
import { Order } from '@/types';
import { toast } from 'sonner';

interface CheckoutFlowProps {
  onOrderComplete: (orderId: string) => void;
  onBack: () => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onOrderComplete, onBack }) => {
  const { cart, getTotalCartPrice, clearCart } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();
  const { addOrder } = useOrderStore();
  
  const [step, setStep] = useState<'details' | 'payment' | 'waiting'>('details');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [pixCode] = useState('00020126360014BR.GOV.BCB.PIX0114+55119999999990208Pedido015204000053039865802BR5923Restaurant Name6009Sao Paulo62070503***63041234');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const cartTotal = getTotalCartPrice();
  const deliveryFee = currentRestaurant?.settings.deliveryFee || 0;
  const tax = cartTotal * 0.1;
  const finalTotal = cartTotal + deliveryFee + tax;

  React.useEffect(() => {
    if (step === 'payment' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep('payment');
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success('PIX code copied to clipboard!');
  };

  const simulatePayment = () => {
    setStep('waiting');
    
    // Simulate payment processing
    setTimeout(() => {
      const order: Order = {
        id: `order-${Date.now()}`,
        items: cart,
        customerInfo,
        status: 'pending',
        totalAmount: finalTotal,
        createdAt: new Date(),
        paymentMethod: 'pix',
        paymentStatus: 'completed'
      };
      
      addOrder(order);
      clearCart();
      onOrderComplete(order.id);
      toast.success('Payment confirmed! Your order has been placed.');
    }, 3000);
  };

  if (!currentRestaurant) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {step === 'details' ? 'Delivery Details' : 
             step === 'payment' ? 'Payment' : 'Processing Payment'}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>${(item.totalPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full h-12"
              style={{ backgroundColor: 'var(--restaurant-primary)' }}
            >
              Continue to Payment
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  PIX Payment
                  <Badge variant="destructive" className="ml-auto">
                    {formatTime(timeLeft)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                    {/* In a real app, this would be a QR code */}
                    <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                      <span className="text-4xl">📱</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan the QR code with your bank app or copy the PIX code below
                  </p>
                </div>

                <div className="bg-muted p-3 rounded text-xs font-mono break-all">
                  {pixCode}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={copyPixCode}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy PIX Code
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Amount to pay: <span className="font-semibold">${finalTotal.toFixed(2)}</span>
                  </p>
                  <Button 
                    onClick={simulatePayment}
                    className="w-full"
                    style={{ backgroundColor: 'var(--restaurant-primary)' }}
                  >
                    I've Made the Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'waiting' && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment. This usually takes a few seconds.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};