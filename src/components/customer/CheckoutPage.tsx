import React, { useState } from "react";
import { ArrowLeft, MapPin, Store, CreditCard, QrCode as QrCodeIcon, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore, useRestaurantStore } from "@/stores";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutPageProps {
  customerData: CustomerData;
  onBack: () => void;
  onProceedToPayment: (data: {
    deliveryType: "delivery" | "pickup";
    address: string;
    paymentMethod: "pix" | "card";
  }) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  customerData,
  onBack,
  onProceedToPayment,
}) => {
  const { cart, getTotalCartPrice, clearCart, updateCartItem, removeFromCart } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [addressError, setAddressError] = useState("");

  const cartTotal = getTotalCartPrice();
  const deliveryFee = deliveryType === "delivery" ? (currentRestaurant?.settings?.deliveryFee || 0) : 0;
  const finalTotal = cartTotal + deliveryFee;

  const restaurantAddress = currentRestaurant?.settings?.address || "Rua Exemplo, 123 - Centro";

  const validateAddress = (addr: string): string => {
    if (!addr.trim()) return "Endereço é obrigatório para entrega";
    if (addr.trim().length < 10) return "Endereço muito curto (mínimo 10 caracteres)";
    if (addr.length > 200) return "Endereço muito longo (máximo 200 caracteres)";
    return "";
  };

  const handleAddressChange = (value: string) => {
    const sanitized = value.replace(/[<>"'`]/g, "");
    if (sanitized.length <= 200) {
      setAddress(sanitized);
      if (addressError) {
        setAddressError(validateAddress(sanitized));
      }
    }
  };

  const handleProceedToPayment = () => {
    // Validar endereço se for entrega
    if (deliveryType === "delivery") {
      const error = validateAddress(address);
      if (error) {
        setAddressError(error);
        return;
      }
    }

    onProceedToPayment({
      deliveryType,
      address: deliveryType === "delivery" ? address : restaurantAddress,
      paymentMethod,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Finalizar Pedido</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {customerData.name.split(" ")[0]}!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tipo de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Tipo de Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={deliveryType}
              onValueChange={(value) => {
                setDeliveryType(value as "delivery" | "pickup");
                setAddressError("");
              }}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Entrega</p>
                      <p className="text-xs text-muted-foreground">
                        Taxa: R$ {deliveryFee.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Retirada no Local</p>
                      <p className="text-xs text-muted-foreground">Sem taxa de entrega</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Campo de Endereço ou Endereço do Restaurante */}
            {deliveryType === "delivery" ? (
              <div className="space-y-2">
                <Label htmlFor="address">
                  Endereço de Entrega <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, complemento..."
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => {
                    if (address) setAddressError(validateAddress(address));
                  }}
                  className={addressError ? "border-destructive" : ""}
                />
                {addressError && (
                  <p className="text-sm text-destructive">{addressError}</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                <p className="font-medium text-sm">Local de Retirada:</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {restaurantAddress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="w-4 h-4" />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Cartão</p>
                      <p className="text-xs text-muted-foreground">Crédito ou Débito</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                  <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.menuItem.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x R$ {item.totalPrice.toFixed(2)}
                    </p>

                    {/* Modifiers */}
                    {Object.entries(item.selectedModifiers).map(([modifierId, optionIds]) => {
                      const modifier = item.menuItem.modifiers?.find((m) => m.id === modifierId);
                      if (!modifier || optionIds.length === 0) return null;

                      return (
                        <div key={modifierId} className="mt-1">
                          <span className="text-xs text-muted-foreground">
                            {modifier.name}:{" "}
                            {optionIds
                              .map((id) => {
                                const option = modifier.options.find((o) => o.id === id);
                                return option?.name;
                              })
                              .join(", ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-sm">
                      R$ {(item.totalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={clearCart}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Carrinho
              </Button>
              <Button
                className="flex-1"
                style={{ backgroundColor: "var(--restaurant-primary)" }}
                onClick={handleProceedToPayment}
              >
                Ir para Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
