import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Clock,
  Copy,
  CheckCircle,
  QrCode as QrCodeIcon,
  RefreshCw,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useCartStore, useRestaurantStore, useOrderStore, useCustomerStore } from "@/stores";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { createOrderPayload, validateOrderPayload } from "@/utils/orderUtils";
import { cookieService } from "@/services/cookies";
import { animations } from "@/lib/animations";
import type { AddressData } from "@/types";

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutData {
  deliveryType: "delivery" | "pickup";
  address: AddressData | string;
  paymentMethod: "pix" | "card";
}

interface PaymentFlowProps {
  customerData: CustomerData;
  checkoutData: CheckoutData;
  onBack: () => void;
  onOrderComplete: (orderId: string) => void;
  originalAddress?: AddressData; // Endereço original do cliente (da API)
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  customerData,
  checkoutData,
  onBack,
  onOrderComplete,
  originalAddress,
}) => {
  
  const { cart, getTotalCartPrice } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();
  const { addOrder } = useOrderStore();
  const { setCustomer, token: customerToken } = useCustomerStore();

  // useRef para garantir execução única (protege contra React.StrictMode)
  const orderCreationAttempted = useRef(false);

  const [paymentStep, setPaymentStep] = useState<"waiting" | "processing">("waiting");
  const [pixCode, setPixCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [showQrCode, setShowQrCode] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false); // Flag para evitar duplicação
  const [orderData, setOrderData] = useState<{
    orderId: string;
    apiOrderId: number;
    apiToken: string;
  } | null>(null);

  const cartTotal = getTotalCartPrice();
  const deliveryFee =
    checkoutData.deliveryType === "delivery"
      ? currentRestaurant?.settings?.deliveryFee || 0
      : 0;
  const finalTotal = cartTotal + deliveryFee;

  // Criar pedido na API quando o componente montar (APENAS PARA PIX)
  useEffect(() => {
    // Para cartão, criar pedido apenas ao clicar "Confirmar Pedido"
    if (checkoutData.paymentMethod === 'card') {
      return;
    }

    // Evitar execução duplicada (protege contra React.StrictMode em dev)
    if (orderCreationAttempted.current) {
      return;
    }

    // Marcar como iniciado ANTES de fazer a requisição
    orderCreationAttempted.current = true;

    const createOrder = async () => {
      setIsLoadingOrder(true);
      
      try {
        
        // Criar payload da API com token e informações de endereço
        const apiPayload = createOrderPayload(customerData, checkoutData, cart, {
          customerToken,
          originalAddress,
          currentAddress: typeof checkoutData.address === 'object' ? checkoutData.address : undefined,
        });

        // Validar payload
        const validation = validateOrderPayload(apiPayload, customerToken);
        if (!validation.isValid) {
          toast.error(`❌ Erro na validação: ${validation.errors.join(', ')}`);
          setIsLoadingOrder(false);
          return;
        }


        // Enviar para API
        const response = await apiService.createOrder(
          apiPayload,
          customerToken as string
        );


        if (!response.success) {
          throw new Error(response.error?.message || 'Erro ao criar pedido');
        }

        // Salvar dados do pedido
        const apiOrderId = response.data.orderId;
        const orderId = `order-${apiOrderId}`;
        const apiToken = response.data.token;
        const pixCodeFromAPI = response.data.pix?.copyAndPaste;


        // ✅ Salvar token no cookie (1 ano)
        cookieService.setCustomerToken(apiToken);

        // ✅ Salvar dados do cliente na store
        setCustomer({
          token: apiToken,
          name: customerData.name,
          phone: customerData.phone,
          address: typeof checkoutData.address === 'object' ? checkoutData.address : undefined,
        });

        setOrderData({
          orderId,
          apiOrderId,
          apiToken,
        });

        // Se for PIX, atualizar o código
        if (checkoutData.paymentMethod === 'pix') {
          if (pixCodeFromAPI) {
            setPixCode(pixCodeFromAPI);
            toast.success("✅ Código PIX gerado!");
          } else {
            console.error('❌ API não retornou código PIX');
            toast.error("❌ Erro: API não retornou código PIX");
          }
        }
        
        // Marcar como criado
        setOrderCreated(true);
      } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Erro desconhecido ao processar pedido';
        
        toast.error(`❌ Falha ao criar pedido: ${errorMessage}`);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar o componente

  // Timer do PIX
  useEffect(() => {
    if (checkoutData.paymentMethod === "pix" && pixCode && timeLeft > 0 && !isExpired) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            toast.error("⏰ O código PIX expirou. Gere um novo código para continuar.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkoutData.paymentMethod, pixCode, timeLeft, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("✅ Código PIX copiado!");
  };

  const handleRenewPixCode = () => {
    setIsExpired(false);
    setTimeLeft(300);
    toast.success("✅ Novo código PIX gerado!");
  };

  const handleConfirmPayment = async () => {
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      let finalOrderData = orderData;

      // Se for CARTÃO, criar o pedido agora
      if (checkoutData.paymentMethod === 'card' && !orderData) {
        
        // Criar payload da API com token e informações de endereço
        const apiPayload = createOrderPayload(customerData, checkoutData, cart, {
          customerToken,
          originalAddress,
          currentAddress: typeof checkoutData.address === 'object' ? checkoutData.address : undefined,
        });

        // Validar payload
        const validation = validateOrderPayload(apiPayload, customerToken);
        if (!validation.isValid) {
          toast.error(`❌ Erro na validação: ${validation.errors.join(', ')}`);
          setIsSubmitting(false);
          return;
        }

        // Enviar para API
        const response = await apiService.createOrder(apiPayload, customerToken as string);

        if (!response.success) {
          throw new Error(response.error?.message || 'Erro ao criar pedido');
        }

        // Salvar dados do pedido
        const apiOrderId = response.data.orderId;
        const orderId = `order-${apiOrderId}`;
        const apiToken = response.data.token;

        // ✅ Salvar token no cookie (1 ano)
        cookieService.setCustomerToken(apiToken);

        // ✅ Salvar dados do cliente na store
        setCustomer({
          token: apiToken,
          name: customerData.name,
          phone: customerData.phone,
          address: typeof checkoutData.address === 'object' ? checkoutData.address : undefined,
        });

        finalOrderData = {
          orderId,
          apiOrderId,
          apiToken,
        };

        setOrderData(finalOrderData);
      }

      // Verificar se temos os dados do pedido
      if (!finalOrderData) {
        toast.error('❌ Erro: Dados do pedido não encontrados');
        setIsSubmitting(false);
        return;
      }

      // Criar pedido local para o store
      const localOrder = {
        id: finalOrderData.orderId,
        apiOrderId: finalOrderData.apiOrderId,
        apiToken: finalOrderData.apiToken,
        items: cart,
        customerInfo: {
          name: customerData.name,
          phone: customerData.phone,
          address: checkoutData.address,
        },
        deliveryType: checkoutData.deliveryType,
        status: "pending" as const,
        totalAmount: finalTotal,
        createdAt: new Date(),
        paymentMethod: checkoutData.paymentMethod,
        paymentStatus: "pending" as const,
        pixCode: pixCode || undefined,
      };

      // Salvar no store local
      addOrder(localOrder);
      
      // Navegar para página de status
      onOrderComplete(finalOrderData.orderId);
      
      toast.success("✅ Pedido confirmado!");
    } catch (error) {
      console.error('❌ Erro ao confirmar pedido:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro desconhecido ao processar pedido';
      
      toast.error(`❌ Falha ao confirmar pedido: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagamento PIX
  if (checkoutData.paymentMethod === "pix") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Pagamento via PIX</h1>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <QrCodeIcon className="w-5 h-5" />
                  Pagar com PIX
                </span>
                {!isExpired && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(timeLeft)}
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Expirado
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loading state */}
              {isLoadingOrder && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Gerando código PIX...</p>
                </div>
              )}

              {/* Código PIX gerado */}
              {!isLoadingOrder && pixCode && (
                <>
                  {/* Valor Total */}
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-3xl font-bold">
                      R$ {finalTotal.toFixed(2)}
                    </p>
                  </div>

              {/* QR Code */}
              {!isExpired && (
                <>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="mb-4 transition-all duration-200 hover:scale-105"
                    >
                      {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
                    </Button>
                  </div>

                  {showQrCode && (
                    <div className={`flex justify-center p-6 bg-white rounded-lg ${animations.fadeIn}`}>
                      <div className={`${animations.scaleIn}`}>
                        <QRCodeSVG
                          value={pixCode}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Código PIX */}
                  <div className={`space-y-2 ${animations.fadeInUp}`}>
                    <Label className="text-sm font-medium">Código PIX Copia e Cola</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md text-xs font-mono break-all transition-all duration-200 hover:bg-muted/80">
                        {pixCode}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPixCode}
                        className="shrink-0 transition-all duration-200 hover:scale-110"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Instruções */}
                  <div className={`space-y-3 ${animations.fadeInUp}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Como pagar:
                    </h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2 transition-all duration-200 hover:translate-x-1">
                        <span className="font-semibold">1.</span>
                        <span>Abra o app do seu banco</span>
                      </li>
                      <li className="flex gap-2 transition-all duration-200 hover:translate-x-1">
                        <span className="font-semibold">2.</span>
                        <span>Escolha pagar via PIX</span>
                      </li>
                      <li className="flex gap-2 transition-all duration-200 hover:translate-x-1">
                        <span className="font-semibold">3.</span>
                        <span>Escaneie o QR Code ou cole o código PIX</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold">4.</span>
                        <span>Confirme o pagamento</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                    style={{ backgroundColor: "var(--restaurant-primary)" }}
                  >
                    {isSubmitting ? "Processando..." : "Já Realizei o Pagamento"}
                  </Button>
                </>
              )}

              {/* Código Expirado */}
              {isExpired && (
                <div className="text-center space-y-4 py-6">
                  <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="text-muted-foreground">
                    O código PIX expirou. Gere um novo código para continuar.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRenewPixCode}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Gerar Novo Código
                  </Button>
                </div>
              )}
              </>
              )}

              {/* Erro ao gerar PIX */}
              {!isLoadingOrder && !pixCode && (
                <div className="text-center space-y-4 py-6">
                  <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="text-muted-foreground">
                    Erro ao gerar código PIX. Por favor, tente novamente.
                  </p>
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pagamento com Cartão
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Pagamento com Cartão</h1>
              <p className="text-sm text-muted-foreground">
                Você pagará na entrega/retirada
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamento na {checkoutData.deliveryType === "delivery" ? "Entrega" : "Retirada"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor Total */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
              <p className="text-3xl font-bold">
                R$ {finalTotal.toFixed(2)}
              </p>
            </div>

            {/* Informações */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Informações Importantes:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span>O pagamento será feito na {checkoutData.deliveryType === "delivery" ? "entrega" : "retirada"}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span>Aceitamos cartão de crédito e débito</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span>Tenha o cartão em mãos no momento do pagamento</span>
                </li>
              </ul>
            </div>

            <Separator />

            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              style={{ backgroundColor: "var(--restaurant-primary)" }}
            >
              {isSubmitting ? "Processando..." : "Confirmar Pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
