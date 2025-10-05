import React, { useState } from "react";
import { RegisterModals } from "./RegisterModals";
import { CheckoutPage } from "./CheckoutPage";
import { PaymentFlow } from "./PaymentFlow";
import { AddressData } from "@/types";

interface CheckoutFlowProps {
  onOrderComplete: (orderId: string) => void;
  onBack: () => void;
}

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
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
  const [currentFlow, setCurrentFlow] = useState<"register" | "checkout" | "payment">("register");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const handleRegisterComplete = (data: CustomerData) => {
    setCustomerData(data);
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
      {currentFlow === "register" && (
        <RegisterModals onComplete={handleRegisterComplete} />
      )}

      {currentFlow === "checkout" && customerData && (
        <CheckoutPage
          customerData={customerData}
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
        />
      )}
    </>
  );
};
