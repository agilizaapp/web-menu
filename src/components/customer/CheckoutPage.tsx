import React, { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Store, CreditCard, QrCode as QrCodeIcon, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore, useRestaurantStore, useCustomerStore } from "@/stores";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { AddressData } from "@/types";
import { fetchAddressByCEP, formatCEP, isValidCEP } from "@/services/viaCEP";
import { cookieService } from "@/services/cookies";
import { toast } from "sonner";

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutPageProps {
  customerData: CustomerData;
  isReturningCustomer?: boolean;
  onBack: () => void;
  onProceedToPayment: (data: {
    deliveryType: "delivery" | "pickup";
    address: AddressData | string;
    paymentMethod: "pix" | "card";
  }) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  customerData,
  isReturningCustomer = false,
  onBack,
  onProceedToPayment,
}) => {
  const { cart, getTotalCartPrice, clearCart, updateCartItem, removeFromCart } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();
  const { clearCustomer } = useCustomerStore();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [addressData, setAddressData] = useState<AddressData>({
    street: "",
    number: "",
    neighborhood: "",
    postalCode: "",
    complement: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const cartTotal = getTotalCartPrice();
  const deliveryFee = deliveryType === "delivery" ? (currentRestaurant?.settings?.deliveryFee || 0) : 0;
  const finalTotal = cartTotal + deliveryFee;

  const restaurantAddress = currentRestaurant?.settings?.address || "Rua Exemplo, 123 - Centro";

  const handleLogout = () => {
    cookieService.removeCustomerToken();
    clearCustomer();
    toast.success("Logout realizado com sucesso");
    onBack();
  };

  const validateAddressField = (field: keyof AddressData, value: string): string => {
    switch (field) {
      case 'street':
        if (!value.trim()) return "Rua é obrigatória";
        if (value.trim().length < 3) return "Rua muito curta";
        return "";
      case 'number':
        if (!value.trim()) return "Número é obrigatório";
        return "";
      case 'neighborhood':
        if (!value.trim()) return "Bairro é obrigatório";
        if (value.trim().length < 3) return "Bairro muito curto";
        return "";
      case 'postalCode':
        if (!value.trim()) return "CEP é obrigatório";
        const numbers = value.replace(/\D/g, '');
        if (numbers.length !== 8) return "CEP deve ter 8 dígitos";
        return "";
      case 'complement':
        return ""; // Opcional
      default:
        return "";
    }
  };

  const handleAddressChange = (field: keyof AddressData, value: string) => {
    let sanitized = value.replace(/[<>"'`]/g, "");
    
    // Formatação especial para CEP
    if (field === 'postalCode') {
      sanitized = sanitized.replace(/\D/g, '');
      if (sanitized.length > 8) sanitized = sanitized.slice(0, 8);
      // Formata como XXXXX-XXX
      if (sanitized.length > 5) {
        sanitized = `${sanitized.slice(0, 5)}-${sanitized.slice(5)}`;
      }
    }
    
    setAddressData(prev => ({ ...prev, [field]: sanitized }));
    
    // Limpa erro ao digitar
    if (addressErrors[field]) {
      setAddressErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Buscar endereço via CEP quando completo (8 dígitos)
  useEffect(() => {
    const searchCEP = async () => {
      const cleanCEP = addressData.postalCode.replace(/\D/g, '');
      
      // Só busca se tiver 8 dígitos
      if (!isValidCEP(cleanCEP)) {
        return;
      }

      setIsLoadingCEP(true);

      try {
        const address = await fetchAddressByCEP(cleanCEP);

        if (address) {
          // Preenche automaticamente rua e bairro (apenas se vazios)
          setAddressData(prev => ({
            ...prev,
            street: prev.street || address.logradouro || '',
            neighborhood: prev.neighborhood || address.bairro || '',
            // Mantém número e complemento do usuário
          }));

          toast.success('✅ CEP encontrado!');
        } else {
          toast.warning('⚠️ CEP não encontrado. Preencha manualmente.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast.error('❌ Erro ao buscar CEP');
      } finally {
        setIsLoadingCEP(false);
      }
    };

    // Delay para evitar chamadas desnecessárias ao digitar
    const timeoutId = setTimeout(() => {
      searchCEP();
    }, 500); // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [addressData.postalCode]); // Executa quando CEP muda

  const validateAllAddressFields = (): boolean => {
    const errors: Partial<Record<keyof AddressData, string>> = {};
    let isValid = true;

    (Object.keys(addressData) as Array<keyof AddressData>).forEach(field => {
      if (field !== 'complement') { // Complement é opcional
        const error = validateAddressField(field, addressData[field] || '');
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      }
    });

    setAddressErrors(errors);
    return isValid;
  };

  const handleProceedToPayment = () => {
    // Validar endereço se for entrega
    if (deliveryType === "delivery") {
      if (!validateAllAddressFields()) {
        return;
      }
    }

    onProceedToPayment({
      deliveryType,
      address: deliveryType === "delivery" ? addressData : restaurantAddress,
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
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Finalizar Pedido</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {customerData.name.split(" ")[0]}!
                </p>
              </div>
              {isReturningCustomer && (
                <button
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Não é você?
                </button>
              )}
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
                setAddressErrors({});
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CEP - PRIMEIRO CAMPO */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="postalCode">
                      CEP <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="postalCode"
                        placeholder="12345-678"
                        value={addressData.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        onBlur={() => {
                          if (addressData.postalCode) {
                            const error = validateAddressField('postalCode', addressData.postalCode);
                            if (error) setAddressErrors(prev => ({ ...prev, postalCode: error }));
                          }
                        }}
                        className={addressErrors.postalCode ? "border-destructive" : ""}
                        maxLength={9}
                        disabled={isLoadingCEP}
                      />
                      {isLoadingCEP && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {addressErrors.postalCode && (
                      <p className="text-sm text-destructive">{addressErrors.postalCode}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Digite o CEP para preencher automaticamente
                    </p>
                  </div>

                  {/* Rua */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">
                      Rua <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="street"
                      placeholder="Nome da rua"
                      value={addressData.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      onBlur={() => {
                        if (addressData.street) {
                          const error = validateAddressField('street', addressData.street);
                          if (error) setAddressErrors(prev => ({ ...prev, street: error }));
                        }
                      }}
                      className={addressErrors.street ? "border-destructive" : ""}
                      disabled={isLoadingCEP}
                    />
                    {addressErrors.street && (
                      <p className="text-sm text-destructive">{addressErrors.street}</p>
                    )}
                  </div>

                  {/* Número */}
                  <div className="space-y-2">
                    <Label htmlFor="number">
                      Número <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="number"
                      placeholder="123"
                      value={addressData.number}
                      onChange={(e) => handleAddressChange('number', e.target.value)}
                      onBlur={() => {
                        if (addressData.number) {
                          const error = validateAddressField('number', addressData.number);
                          if (error) setAddressErrors(prev => ({ ...prev, number: error }));
                        }
                      }}
                      className={addressErrors.number ? "border-destructive" : ""}
                    />
                    {addressErrors.number && (
                      <p className="text-sm text-destructive">{addressErrors.number}</p>
                    )}
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">
                      Bairro <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="neighborhood"
                      placeholder="Centro"
                      value={addressData.neighborhood}
                      onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                      onBlur={() => {
                        if (addressData.neighborhood) {
                          const error = validateAddressField('neighborhood', addressData.neighborhood);
                          if (error) setAddressErrors(prev => ({ ...prev, neighborhood: error }));
                        }
                      }}
                      className={addressErrors.neighborhood ? "border-destructive" : ""}
                      disabled={isLoadingCEP}
                    />
                    {addressErrors.neighborhood && (
                      <p className="text-sm text-destructive">{addressErrors.neighborhood}</p>
                    )}
                  </div>

                  {/* Complemento */}
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento (Opcional)</Label>
                    <Input
                      id="complement"
                      placeholder="Apto 101, Bloco B..."
                      value={addressData.complement}
                      onChange={(e) => handleAddressChange('complement', e.target.value)}
                    />
                  </div>
                </div>
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
