import React from "react";
import { Truck } from "lucide-react";
import type { DeliverySettings } from "@/types/entities.types";

interface DeliveryFeeInfoProps {
  deliverySettings: DeliverySettings[];
}

export const DeliveryFeeInfo: React.FC<DeliveryFeeInfoProps> = ({ deliverySettings }) => {
  // Ordenar por distance (metros)
  const sortedSettings = [...deliverySettings].sort((a, b) => a.distance - b.distance);

  // Formatar ranges
  const ranges = sortedSettings.map((tier, index) => {
    const next = sortedSettings[index + 1];
    const currentKm = (tier.distance / 1000).toFixed(1);
    
    if (next) {
      const nextKm = (next.distance / 1000).toFixed(1);
      return {
        label: `De ${currentKm}km a ${nextKm}km`,
        value: tier.value,
      };
    } else {
      return {
        label: `Acima de ${currentKm}km`,
        value: tier.value,
      };
    }
  });

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
            Taxas de Entrega por Distância
          </p> 
          <div className="space-y-1.5">
            {ranges.map((range, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300"
              >
                <span>{range.label}</span>
                <span className="font-semibold">R$ {range.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            💡 A taxa será calculada automaticamente com base na distância do seu endereço.
          </p>
        </div>
      </div>
    </div>
  );
};
