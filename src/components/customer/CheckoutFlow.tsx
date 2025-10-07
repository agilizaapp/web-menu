import React, { useState, useEffect } from "react";
import { RegisterModals } from "./RegisterModals";
import { CheckoutPage } from "./CheckoutPage";
import { PaymentFlow } from "./PaymentFlow";
import { AddressData } from "@/types";
import { useCustomerStore } from "@/stores";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface CheckoutFlowProps {
  onOrderComplete: (orderId: string) => void;
  onBack: () => void;
}

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
  isExistingCustomer?: boolean;
}

interface CheckoutData {
  deliveryType: "delivery" | "pickup";
  address: string | AddressData;
  paymentMethod: "pix" | "card";
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  onOrderComplete,
  onBack,
}) => {
  const { token, name, phone, address, isAuthenticated, setCustomer } = useCustomerStore();
  const [currentFlow, setCurrentFlow] = useState<"register" | "checkout" | "payment">("register");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);

  // Verificar se o cliente já está autenticado (dados já vieram da requisição inicial)
  // IMPORTANTE: Executar apenas no início, não durante o fluxo de pagamento
  useEffect(() => {
    // Se já está em payment, não interferir
    if (currentFlow === "payment") {
      setIsLoadingAuth(false);
      return;
    }

    if (isAuthenticated && token && name && phone) {
      // Cliente já autenticado - dados vieram da requisição /product?config=true
      setCustomerData({
        name,
        phone,
        birthDate: "", // Não temos esta informação
      });
      
      setIsReturningCustomer(true);
      setCurrentFlow("checkout");
    } else {
      // Não autenticado - ir para modal de registro
      setCurrentFlow("register");
    }
    
    setIsLoadingAuth(false);
  }, [isAuthenticated, token, name, phone]);

  const handleRegisterComplete = (data: CustomerData) => {
    setCustomerData(data);
    setIsReturningCustomer(data.isExistingCustomer || false);
    setCurrentFlow("checkout");
  };

  const handleCheckoutComplete = (data: CheckoutData) => {
    setCheckoutData(data);
    setCurrentFlow("payment");
  };

  const handleBackFromCheckout = () => {
    setCurrentFlow("register");
    setCustomerData(null);
  };

  const handleBackFromPayment = () => {
    setCurrentFlow("checkout");
    setCheckoutData(null);
  };

  return (
    <>
      {isLoadingAuth ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      ) : (
        <>
          {currentFlow === "register" && (
            <RegisterModals 
              onComplete={handleRegisterComplete}
              onClose={onBack}
            />
          )}

          {currentFlow === "checkout" && customerData && (
            <CheckoutPage
              customerData={customerData}
              isReturningCustomer={isReturningCustomer}
              onBack={handleBackFromCheckout}
              onProceedToPayment={handleCheckoutComplete}
            />
          )}

          {currentFlow === "payment" && customerData && checkoutData && (
            <PaymentFlow
              customerData={customerData}
              checkoutData={checkoutData}
              onBack={handleBackFromPayment}
              onOrderComplete={onOrderComplete}
              originalAddress={address || undefined} // Endereço original do cliente (da API)
            />
          )}
        </>
      )}
    </>
  );
};
