import React, { useState, useEffect } from "react";
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
import { useCartStore, useRestaurantStore, useOrderStore } from "@/stores";
import { toast } from "sonner";

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
}

interface CheckoutData {
  deliveryType: "delivery" | "pickup";
  address: string;
  paymentMethod: "pix" | "card";
}

interface PaymentFlowProps {
  customerData: CustomerData;
  checkoutData: CheckoutData;
  onBack: () => void;
  onOrderComplete: (orderId: string) => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  customerData,
  checkoutData,
  onBack,
  onOrderComplete,
}) => {
  const { cart, getTotalCartPrice, clearCart } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();
  const { addOrder } = useOrderStore();

  const [paymentStep, setPaymentStep] = useState<"waiting" | "processing">("waiting");
  const [pixCode, setPixCode] = useState(
    "00020126360014BR.GOV.BCB.PIX0114+55119999999990208Pedido015204000053039865802BR5923Restaurant Name6009Sao Paulo62070503***63041234"
  );
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [showQrCode, setShowQrCode] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const cartTotal = getTotalCartPrice();
  const deliveryFee =
    checkoutData.deliveryType === "delivery"
      ? currentRestaurant?.settings?.deliveryFee || 0
      : 0;
  const finalTotal = cartTotal + deliveryFee;

  // Timer do PIX
  useEffect(() => {
    if (checkoutData.paymentMethod === "pix" && timeLeft > 0 && !isExpired) {
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
  }, [checkoutData.paymentMethod, timeLeft, isExpired]);

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

  const handleConfirmPayment = () => {
    const orderId = `order-${Date.now()}`;

    const order = {
      id: orderId,
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
    };

    addOrder(order);
    clearCart();
    onOrderComplete(orderId);
    toast.success("✅ Pedido realizado com sucesso!");
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
                      className="mb-4"
                    >
                      {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
                    </Button>
                  </div>

                  {showQrCode && (
                    <div className="flex justify-center p-6 bg-white rounded-lg">
                      <QRCodeSVG
                        value={pixCode}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Código PIX */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Código PIX Copia e Cola</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-md text-xs font-mono break-all">
                        {pixCode}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPixCode}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Instruções */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Como pagar:
                    </h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-semibold">1.</span>
                        <span>Abra o app do seu banco</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold">2.</span>
                        <span>Escolha pagar via PIX</span>
                      </li>
                      <li className="flex gap-2">
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
                    style={{ backgroundColor: "var(--restaurant-primary)" }}
                  >
                    Já Realizei o Pagamento
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
              style={{ backgroundColor: "var(--restaurant-primary)" }}
            >
              Confirmar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
