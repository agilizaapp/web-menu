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
import { AddressPreview } from "./AddressPreview";
import { LocationMapModal } from "./LocationMapModal";
import { DeliveryFeeInfo } from "./DeliveryFeeInfo";
import type { AddressData } from "@/types";
import type { DeliverySettings } from "@/types/entities.types";
import { fetchAddressByCEP, formatCEP, isValidCEP } from "@/services/viaCEP";
import { calculateDistance, calculateDeliveryFee } from "@/services/distance.service";
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
    deliveryFee?: number; // Taxa de entrega calculada
    distance?: number; // Distância em metros para enviar ao backend
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
  const { clearCustomer, address: savedAddress } = useCustomerStore();

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
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number>(0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null); // em km para exibição
  const [deliveryDistanceInMeters, setDeliveryDistanceInMeters] = useState<number | null>(null); // em metros para payload

  // Preencher endereço automaticamente se vier do store (cliente autenticado com endereço salvo)
  useEffect(() => {
    if (savedAddress) {
      setAddressData({
        street: savedAddress.street || "",
        number: savedAddress.number || "",
        neighborhood: savedAddress.neighborhood || "",
        postalCode: savedAddress.postalCode || "",
        complement: savedAddress.complement || "",
        distance: savedAddress.distance, // ✅ Preservar distância da API
      });
    }
  }, [savedAddress]);

  // Calcular taxa de entrega baseada na distância
  useEffect(() => {
    const calculateDistanceAndFee = async () => {
      if (deliveryType !== "delivery") {
        setCalculatedDeliveryFee(0);
        setDeliveryDistance(null);
        setDeliveryDistanceInMeters(null);
        return;
      }

      // Verificar se temos endereço completo e pickUpLocation
      const hasCompleteAddress = addressData.street && addressData.number && addressData.neighborhood;
      const pickUpLocation = currentRestaurant?.settings?.pickUpLocation?.label;
      
      // FONTES DE DISTÂNCIA (em ordem de prioridade):
      // 1. Distância do endereço do customer (retornada por /customer/{phone})
      const customerAddressDistance = addressData.distance;
      // 2. Distância do pickUpLocation (retornada por /restaurant/{slug})
      const apiDistance = currentRestaurant?.settings?.pickUpLocation?.distance;

      if (!hasCompleteAddress || !pickUpLocation) {
        return;
      }

      // Se deliverySettings existe (tabela de taxas por distância)
      if (Array.isArray(currentRestaurant?.settings?.deliverySettings)) {
        setIsCalculatingDistance(true);

        try {
          let distanceInMeters: number;
          let distanceInKm: number;

          // PRIORIDADE 1: Distância do endereço do customer
          if (customerAddressDistance && customerAddressDistance > 0) {
            distanceInMeters = customerAddressDistance;
            distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100;
          }
          // PRIORIDADE 2: Distância do pickUpLocation (API do restaurante)
          else if (apiDistance && apiDistance > 0) {
            distanceInMeters = apiDistance;
            distanceInKm = Math.round((distanceInMeters / 1000) * 100) / 100;
          } 
          // PRIORIDADE 3: Calcular via geocoding (somente se endereço NÃO estiver mascarado)
          else {
            const customerAddress = `${addressData.street}, ${addressData.number}, ${addressData.neighborhood}, ${addressData.postalCode}`;
            
            // Verificar se o endereço está mascarado
            const isAddressMasked = (address: string): boolean => {
              return address.includes('*') || address.includes('...');
            };
            
            if (isAddressMasked(customerAddress)) {
              // Endereço mascarado SEM distance da API = não é possível calcular
              throw new Error('Endereço mascarado - distância não disponível');
            }
            
            // Endereço completo = pode fazer geocoding
            const result = await calculateDistance(pickUpLocation, customerAddress);
            
            distanceInMeters = result.distanceInMeters;
            distanceInKm = result.distanceInKm;
          }

          // Atualizar estados com a distância obtida
          setDeliveryDistance(distanceInKm);
          setDeliveryDistanceInMeters(distanceInMeters);
          
          // Calcular taxa baseada na distância
          const fee = calculateDeliveryFee(distanceInMeters, currentRestaurant.settings.deliverySettings);
          setCalculatedDeliveryFee(fee);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          
          // Verificar se o erro é de endereço mascarado
          const isMaskedError = errorMessage.includes('mascarado') || errorMessage.includes('Endereço mascarado');
          
          if (isMaskedError) {
            toast.warning(
              `⚠️ Endereço protegido detectado. Utilizando taxa mínima de entrega.`,
              { duration: 4000 }
            );
          } else {
            toast.error(
              `Não foi possível calcular a distância exata. ${errorMessage}. Usando taxa mínima.`,
              { duration: 5000 }
            );
          }
          
          // Usar a menor taxa como fallback
          const minFee = Math.min(...currentRestaurant.settings.deliverySettings.map(t => t.value));
          setCalculatedDeliveryFee(minFee);
          setDeliveryDistance(null);
          setDeliveryDistanceInMeters(null);
        } finally {
          setIsCalculatingDistance(false);
        }
      }
    };

    calculateDistanceAndFee();
  }, [deliveryType, addressData, currentRestaurant?.settings?.deliverySettings, currentRestaurant?.settings?.pickUpLocation]);

  const cartTotal = getTotalCartPrice();
  const deliveryFee = deliveryType === "delivery" ? calculatedDeliveryFee : 0;
  const deliveryToShow = calculatedDeliveryFee;
  const finalTotal = cartTotal + deliveryFee;

  // Usar pickUpLocation se disponível, senão fallback para address
  const restaurantAddress = currentRestaurant?.settings?.pickUpLocation?.label 
    || currentRestaurant?.settings?.address 
    || "";

  // Função para limpar carrinho e voltar ao menu
  const handleClearCart = () => {
    clearCart();
    onBack(); // Volta para a tela de produtos
  };

  const handleLogout = () => {
    cookieService.removeCustomerToken();
    clearCustomer();
    toast.success("Logout realizado com sucesso");
    onBack();
  };

  const validateAddressField = (field: keyof AddressData, value: string): string => {
    // Se o valor tem asterisco (mascarado), aceita sem validar
    if (value && value.includes('*')) return "";
    
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
        } else {
          toast.warning('⚠️ CEP não encontrado. Preencha manualmente.');
        }
      } catch {
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
      // Ignorar campos opcionais e distance (vem da API)
      if (field !== 'complement' && field !== 'distance') {
        const fieldValue = addressData[field];
        const error = validateAddressField(field, typeof fieldValue === 'string' ? fieldValue : '');
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

    const paymentData = {
      deliveryType,
      address: deliveryType === "delivery" ? addressData : restaurantAddress,
      paymentMethod,
      deliveryFee: deliveryType === "delivery" ? calculatedDeliveryFee : undefined,
      distance: deliveryType === "delivery" && deliveryDistanceInMeters !== null 
        ? deliveryDistanceInMeters 
        : undefined,
    };

    onProceedToPayment(paymentData);
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
                    <div className="flex-1">
                      <p className="font-medium">Entrega</p>
                      <p className="text-xs text-muted-foreground">
                        {isCalculatingDistance ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Calculando...
                          </span>
                        ) : deliveryDistance !== null ? (
                          <>
                            {/* {deliveryDistance.toFixed(2)}km - R$ {deliveryToShow.toFixed(2)} */}
                          </>
                        ) : (
                          <>
                          {/* Taxa: R$ {deliveryToShow.toFixed(2)} */}
                          </>
                        )}
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
                      <p className="text-xs text-muted-foreground">
                        Sem taxa de entrega
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Informação de Taxas de Entrega (quando tem tabela) */}
            {/* {deliveryType === "delivery" && 
             Array.isArray(currentRestaurant?.settings?.deliverySettings) && 
             currentRestaurant.settings.deliverySettings.length > 0 && (
              <DeliveryFeeInfo deliverySettings={currentRestaurant.settings.deliverySettings} />
            )} */}

            {/* Endereço de Retirada (quando pickup)
            {deliveryType === "pickup" && (
              currentRestaurant?.settings?.pickUpLocation ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Local de Retirada</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {currentRestaurant.settings.pickUpLocation.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMapModalOpen(true)}
                            className="text-primary border-primary/50 hover:bg-primary/10"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Ver no Mapa
                          </Button>
                          {currentRestaurant.settings.pickUpLocation.mapsUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(currentRestaurant.settings.pickUpLocation!.mapsUrl, '_blank')}
                              className="text-primary hover:text-primary/80"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Abrir no Google Maps
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : currentRestaurant?.settings?.address ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Store className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Local de Retirada</p>
                        <p className="text-sm text-muted-foreground">
                          {currentRestaurant.settings.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )} */}

            {/* Campo de Endereço ou Endereço do Restaurante */}
            {deliveryType === "delivery" ? (
              <div className="space-y-4">
                {/* Se tem endereço salvo (cliente autenticado), mostrar preview */}
                {savedAddress ? (
                  <AddressPreview
                    address={addressData}
                    onAddressChange={(newAddress) => {
                      setAddressData(newAddress);
                    }}
                    errors={addressErrors}
                    onValidate={validateAddressField}
                    onEditingChange={setIsEditingAddress}
                    originAddress={restaurantAddress}
                  />
                ) : (
                  // Cliente novo - mostrar inputs normalmente
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
                          onChange={(e) =>
                            handleAddressChange("postalCode", e.target.value)
                          }
                          onBlur={() => {
                            if (addressData.postalCode) {
                              const error = validateAddressField(
                                "postalCode",
                                addressData.postalCode
                              );
                              if (error)
                                setAddressErrors((prev) => ({
                                  ...prev,
                                  postalCode: error,
                                }));
                            }
                          }}
                          className={
                            addressErrors.postalCode ? "border-destructive" : ""
                          }
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
                        <p className="text-sm text-destructive">
                          {addressErrors.postalCode}
                        </p>
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
                        onChange={(e) =>
                          handleAddressChange("street", e.target.value)
                        }
                        onBlur={() => {
                          if (addressData.street) {
                            const error = validateAddressField(
                              "street",
                              addressData.street
                            );
                            if (error)
                              setAddressErrors((prev) => ({
                                ...prev,
                                street: error,
                              }));
                          }
                        }}
                        className={
                          addressErrors.street ? "border-destructive" : ""
                        }
                        disabled={isLoadingCEP}
                      />
                      {addressErrors.street && (
                        <p className="text-sm text-destructive">
                          {addressErrors.street}
                        </p>
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
                        onChange={(e) =>
                          handleAddressChange("number", e.target.value)
                        }
                        onBlur={() => {
                          if (addressData.number) {
                            const error = validateAddressField(
                              "number",
                              addressData.number
                            );
                            if (error)
                              setAddressErrors((prev) => ({
                                ...prev,
                                number: error,
                              }));
                          }
                        }}
                        className={
                          addressErrors.number ? "border-destructive" : ""
                        }
                      />
                      {addressErrors.number && (
                        <p className="text-sm text-destructive">
                          {addressErrors.number}
                        </p>
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
                        onChange={(e) =>
                          handleAddressChange("neighborhood", e.target.value)
                        }
                        onBlur={() => {
                          if (addressData.neighborhood) {
                            const error = validateAddressField(
                              "neighborhood",
                              addressData.neighborhood
                            );
                            if (error)
                              setAddressErrors((prev) => ({
                                ...prev,
                                neighborhood: error,
                              }));
                          }
                        }}
                        className={
                          addressErrors.neighborhood ? "border-destructive" : ""
                        }
                        disabled={isLoadingCEP}
                      />
                      {addressErrors.neighborhood && (
                        <p className="text-sm text-destructive">
                          {addressErrors.neighborhood}
                        </p>
                      )}
                    </div>

                    {/* Complemento */}
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento (Opcional)</Label>
                      <Input
                        id="complement"
                        placeholder="Apto 101, Bloco B..."
                        value={addressData.complement}
                        onChange={(e) =>
                          handleAddressChange("complement", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="font-medium text-sm">Local de Retirada:</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  {restaurantAddress}
                </p>
                {currentRestaurant?.settings?.pickUpLocation?.mapsUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMapModalOpen(true)}
                    className="w-full text-primary border-primary/50 hover:bg-primary/10"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Ver Localização no Mapa
                  </Button>
                )}
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
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "pix" | "card")
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="w-4 h-4" />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-xs text-muted-foreground">
                        Pagamento instantâneo
                      </p>
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
                      <p className="text-xs text-muted-foreground">
                        Crédito ou Débito
                      </p>
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
                    <h4 className="font-medium text-sm">
                      {item.menuItem.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x R$ {item.totalPrice.toFixed(2)}
                    </p>

                    {/* Modifiers */}
                    {Object.entries(item.selectedModifiers).map(
                      ([modifierId, optionIds]) => {
                        const modifier = item.menuItem.modifiers?.find(
                          (m) => m.id === modifierId
                        );
                        if (!modifier || optionIds.length === 0) return null;

                        return (
                          <div key={modifierId} className="mt-1">
                            <span className="text-xs text-muted-foreground">
                              {modifier.name}:{" "}
                              {optionIds
                                .map((id) => {
                                  const option = modifier.options.find(
                                    (o) => o.id === id
                                  );
                                  return option?.name;
                                })
                                .join(", ")}
                            </span>
                          </div>
                        );
                      }
                    )}
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
                  {isCalculatingDistance ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Calculando...
                    </span>
                  ) : (
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  )}
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              {isEditingAddress && (
                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <span className="animate-pulse">⚠️</span>
                  <span>Finalize a edição do endereço para continuar</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 transition-all duration-200 hover:scale-105"
                  onClick={handleClearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2 hidden md:!flex" />
                  Limpar Carrinho
                </Button>
                <Button
                  className="flex-1 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  style={{ backgroundColor: "var(--restaurant-primary)" }}
                  onClick={handleProceedToPayment}
                  disabled={isEditingAddress || isCalculatingDistance}
                >
                  {isCalculatingDistance ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando taxa...
                    </>
                  ) : (
                    'Ir para Pagamento'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Mapa */}
      {currentRestaurant?.settings?.pickUpLocation && (
        <LocationMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          location={currentRestaurant.settings.pickUpLocation}
          title="Local de Retirada"
        />
      )}
    </div>
  );
};
