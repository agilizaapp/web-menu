import React, { useState } from "react";
import { ArrowLeft, Clock, Copy, CheckCircle, QrCode, Eye, EyeOff, RefreshCw, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore, useRestaurantStore, useOrderStore, useCustomerStore } from "@/stores";
import { calculateDeliveryFee } from '@/services/distance.service';
import { Order } from "@/types";
import { toast } from "sonner";

interface CheckoutFlowProps {
  onOrderComplete: (orderId: string) => void;
  onBack: () => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  onOrderComplete,
  onBack,
}) => {
  const { cart, getTotalCartPrice, clearCart } = useCartStore();
  const { currentRestaurant } = useRestaurantStore();
  const { address: savedAddress } = useCustomerStore();
  const { addOrder } = useOrderStore();

  const [step, setStep] = useState<"details" | "payment" | "waiting">(
    "details"
  );
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
  });
  const [pixCode, setPixCode] = useState(
    "00020126360014BR.GOV.BCB.PIX0114+55119999999990208Pedido015204000053039865802BR5923Restaurant Name6009Sao Paulo62070503***63041234"
  );
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [showQrCode, setShowQrCode] = useState(false); // QR Code começa oculto
  const [isExpired, setIsExpired] = useState(false);

  const cartTotal = getTotalCartPrice();
  // Calcular taxa de entrega a partir das configurações do restaurante e distância salva no cliente
  let deliveryFee = 0; // Taxa de entrega padrão
  try {
    const deliverySettings = currentRestaurant?.settings?.deliverySettings ?? [];
    const customerDist = savedAddress?.distance ?? undefined;
    const apiPickupDist = currentRestaurant?.settings?.pickUpLocation?.distance ?? undefined;

    const distToUse = (typeof customerDist === 'number' && customerDist > 0)
      ? customerDist
      : (typeof apiPickupDist === 'number' && apiPickupDist > 0) ? apiPickupDist : undefined;

    if (distToUse != null && Array.isArray(deliverySettings) && deliverySettings.length > 0) {
      deliveryFee = calculateDeliveryFee(distToUse, deliverySettings);
    }
  } catch (err) {
    console.warn('Erro ao calcular deliveryFee (legacy flow):', err);
    deliveryFee = 0;
  }
  //const tax = cartTotal * 0.1;
  const finalTotal = cartTotal + deliveryFee;

  React.useEffect(() => {
    if (step === "payment" && timeLeft > 0 && !isExpired) {
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
  }, [step, timeLeft, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Sanitização de entrada - remove caracteres perigosos
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>"'`]/g, ""); // Remove caracteres perigosos para XSS
  };

  // Máscara de telefone (XX) XXXXX-XXXX
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7
    )}`;
  };

  // Validação de nome
  const validateName = (name: string): string => {
    const trimmed = name.trim();

    // Campo vazio
    if (!trimmed) return "Nome é obrigatório";

    // Comprimento total
    if (trimmed.length < 3) return "Nome deve ter pelo menos 3 caracteres";
    if (trimmed.length > 100) return "Nome muito longo (máximo 100 caracteres)";

    // Apenas letras e espaços (inclui acentos)
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      return "Nome deve conter apenas letras e espaços";
    }

    // Dividir em partes (nome e sobrenome)
    const parts = trimmed.split(/\s+/); // separa por espaço múltiplo

    if (parts.length < 2) {
      return "Informe nome e sobrenome";
    }

    // Cada parte pelo menos 3 letras
    for (const part of parts) {
      if (part.length < 3) {
        return "Cada parte do nome deve ter pelo menos 3 letras";
      }
    }

    return "";
  };

  // Validação de telefone
  const validatePhone = (phone: string): string => {
    const numbers = phone.replace(/\D/g, "");
    if (!numbers) return "Telefone é obrigatório";
    if (numbers.length < 10) return "Telefone incompleto";
    if (numbers.length > 11) return "Telefone inválido";
    return "";
  };

  // Validação de endereço
  const validateAddress = (address: string): string => {
    if (!address.trim()) return "Endereço é obrigatório";
    if (address.trim().length < 10)
      return "Endereço muito curto (mínimo 10 caracteres)";
    if (address.length > 200)
      return "Endereço muito longo (máximo 200 caracteres)";
    return "";
  };

  // Validação em tempo real
  const handleFieldChange = (
    field: "name" | "phone" | "address",
    value: string
  ) => {
    let sanitizedValue = sanitizeInput(value);

    // Aplicar máscara de telefone
    if (field === "phone") {
      sanitizedValue = formatPhone(value);
    }

    // Limites de caracteres
    if (field === "name" && sanitizedValue.length > 100) return;
    if (field === "phone" && sanitizedValue.replace(/\D/g, "").length > 11)
      return;
    if (field === "address" && sanitizedValue.length > 200) return;

    setCustomerInfo((prev) => ({ ...prev, [field]: sanitizedValue }));

    // Validar se o campo já foi tocado
    if (touched[field]) {
      let error = "";
      if (field === "name") error = validateName(sanitizedValue);
      if (field === "phone") error = validatePhone(sanitizedValue);
      if (field === "address") error = validateAddress(sanitizedValue);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Marcar campo como tocado ao sair dele
  const handleFieldBlur = (field: "name" | "phone" | "address") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error = "";
    if (field === "name") error = validateName(customerInfo.name);
    if (field === "phone") error = validatePhone(customerInfo.phone);
    if (field === "address") error = validateAddress(customerInfo.address);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos os campos
    const nameError = validateName(customerInfo.name);
    const phoneError = validatePhone(customerInfo.phone);
    const addressError = validateAddress(customerInfo.address);

    setErrors({
      name: nameError,
      phone: phoneError,
      address: addressError,
    });

    setTouched({
      name: true,
      phone: true,
      address: true,
    });

    // Se houver erros, não continuar
    if (nameError || phoneError || addressError) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setStep("payment");
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("✅ Código PIX copiado para a área de transferência!");
  };

  const generateNewPixCode = () => {
    // Não gera código novo, apenas reseta o timer
    // Estratégia para incentivar o cliente a pagar logo
    setTimeLeft(300); // Reset para 5 minutos
    setIsExpired(false);
    setShowQrCode(false); // Esconde QR Code ao "renovar"
    toast.success("⏰ Tempo renovado! Você tem mais 5 minutos para pagar.");
  };

  const simulatePayment = () => {
    setStep("waiting");

    // Simulate payment processing
    setTimeout(() => {
      const order: Order = {
        id: `order-${Date.now()}`,
        items: cart,
        customerInfo,
        deliveryType: "delivery", // Default para compatibilidade
        status: "pending",
        totalAmount: finalTotal,
        createdAt: new Date(),
        paymentMethod: "pix",
        paymentStatus: "completed",
      };

      addOrder(order);
      clearCart();
      onOrderComplete(order.id);
      toast.success("🎉 Pagamento confirmado! Seu pedido foi realizado com sucesso.");
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
            {step === "details"
              ? "Quase lá!"
              : step === "payment"
              ? "Pagamento"
              : "Processando Pagamento"}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Entrega</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Campos marcados com <span className="text-red-500">*</span>{" "}
                  são obrigatórios
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Campo Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={customerInfo.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    placeholder="Digite seu nome completo"
                    className={`${
                      touched.name && errors.name
                        ? "border-red-500 focus-visible:ring-red-500"
                        : touched.name && !errors.name
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }`}
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    maxLength={100}
                  />
                  <div className="min-h-[20px]">
                    {touched.name && errors.name && (
                      <p
                        id="name-error"
                        className="text-sm text-red-500 flex items-center gap-1"
                      >
                        <span>⚠</span> {errors.name}
                      </p>
                    )}
                    {touched.name && !errors.name && customerInfo.name && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Nome válido
                      </p>
                    )}
                  </div>
                </div>

                {/* Campo Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone (WhatsApp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    placeholder="(00) 00000-0000"
                    className={`${
                      touched.phone && errors.phone
                        ? "border-red-500 focus-visible:ring-red-500"
                        : touched.phone && !errors.phone
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }`}
                    aria-invalid={touched.phone && !!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    maxLength={15}
                  />
                  <div className="min-h-[20px]">
                    {touched.phone && errors.phone && (
                      <p
                        id="phone-error"
                        className="text-sm text-red-500 flex items-center gap-1"
                      >
                        <span>⚠</span> {errors.phone}
                      </p>
                    )}
                    {touched.phone && !errors.phone && customerInfo.phone && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Telefone válido
                      </p>
                    )}
                  </div>
                </div>

                {/* Campo Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Endereço Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={customerInfo.address}
                    onChange={(e) =>
                      handleFieldChange("address", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("address")}
                    placeholder="Rua, número, bairro e ponto de referência"
                    className={`${
                      touched.address && errors.address
                        ? "border-red-500 focus-visible:ring-red-500"
                        : touched.address && !errors.address
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }`}
                    aria-invalid={touched.address && !!errors.address}
                    aria-describedby={
                      errors.address ? "address-error" : undefined
                    }
                    maxLength={200}
                  />
                  <div className="flex justify-between items-start min-h-[20px]">
                    <div className="flex-1">
                      {touched.address && errors.address && (
                        <p
                          id="address-error"
                          className="text-sm text-red-500 flex items-center gap-1"
                        >
                          <span>⚠</span> {errors.address}
                        </p>
                      )}
                      {touched.address &&
                        !errors.address &&
                        customerInfo.address && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Endereço válido
                          </p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {customerInfo.address.length}/200
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>
                        R${" "}
                        {(item.totalPrice * item.quantity).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      R${" "}
                      {cartTotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span>
                      R${" "}
                      {deliveryFee.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div> */}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    R${" "}
                    {finalTotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-12"
              style={{ backgroundColor: "var(--restaurant-primary)" }}
            >
              Continuar para o Pagamento
            </Button>
          </form>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <Card className={isExpired ? "border-destructive" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pagamento PIX
                  <Badge 
                    variant={isExpired ? "destructive" : timeLeft < 60 ? "destructive" : "default"} 
                    className={`ml-auto ${!isExpired && timeLeft >= 60 ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  >
                    {isExpired ? "Expirado" : `Tempo restante: ${formatTime(timeLeft)}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Estado: Código Expirado */}
                {isExpired && (
                  <div className="bg-destructive/10 border border-destructive rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">
                        O tempo expirou. Clique para renovar e continuar com o mesmo código.
                      </p>
                    </div>
                    <Button
                      onClick={generateNewPixCode}
                      className="w-full"
                      style={{ backgroundColor: "var(--restaurant-primary)" }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renovar Tempo (+ 5 minutos)
                    </Button>
                  </div>
                )}

                {/* Conteúdo Principal - Só mostra se não expirou */}
                {!isExpired && (
                  <>
                    {/* Botão Toggle QR Code */}
                    <div className="text-center">
                      <Button
                        onClick={() => setShowQrCode(!showQrCode)}
                        variant="default"
                        className="w-full font-semibold"
                        style={{ backgroundColor: "var(--restaurant-primary)" }}
                      >
                        {showQrCode ? (
                          <>
                            <EyeOff className="w-5 h-5 mr-2" />
                            Esconder QR Code
                          </>
                        ) : (
                          <>
                            <QrCode className="w-5 h-5 mr-2" />
                            Mostrar QR Code para Escanear
                          </>
                        )}
                      </Button>
                    </div>

                    {/* QR Code - Aparece com animação */}
                    {showQrCode && (
                      <div className="text-center">
                        <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4 inline-block">
                          <QRCodeSVG
                            value={pixCode}
                            size={200}
                            level="M"
                            includeMargin={false}
                            className="mx-auto"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Escaneie o QR Code com o app do seu banco
                        </p>
                      </div>
                    )}

                    {/* Botão Copiar */}
                    <Button
                      variant="default"
                      className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white"
                      onClick={copyPixCode}
                    >
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar Código PIX
                    </Button>

                    {/* Valor e Confirmação */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Valor a pagar:{" "}
                        <span className="font-semibold text-lg">
                          R$ {finalTotal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                      <Button
                        onClick={simulatePayment}
                        variant="outline"
                        className="w-full font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Já Realizei o Pagamento
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "waiting" && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Processando Pagamento...
              </h3>
              <p className="text-muted-foreground">
                Aguarde enquanto confirmamos seu pagamento. Isso geralmente leva alguns segundos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
