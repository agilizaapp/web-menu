import React, { useState, useEffect, useRef } from "react";
// Hook simples de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
import { MapPin, Pen, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAddressByCEP, isValidCEP } from "@/services/viaCEP";
import { calculateDistance } from "@/services/distance.service";
import { toast } from "sonner";
import type { AddressData } from "@/types";

interface AddressPreviewProps {
  address: AddressData;
  onAddressChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  onValidate?: (field: keyof AddressData, value: string) => string;
  onEditingChange?: (isEditing: boolean) => void; // Novo callback
  originAddress: string;
}

export const AddressPreview: React.FC<AddressPreviewProps> = ({
  address,
  onAddressChange,
  errors = {},
  onValidate,
  onEditingChange,
  originAddress,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState<AddressData>(address);
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof AddressData, string>>>(errors);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

    // Debounce para o conjunto dos campos relevantes do endereço
    const debouncedAddress = useDebounce(
      {
        street: editedAddress.street,
        number: editedAddress.number,
        neighborhood: editedAddress.neighborhood,
        postalCode: editedAddress.postalCode,
      },
      500
    );

  const handleEdit = () => {
    setIsEditing(true);
    onEditingChange?.(true); // Notificar que entrou em modo de edição
    // Limpar os inputs ao editar (não auto-preencher)
    setEditedAddress({
      street: "",
      number: "",
      neighborhood: "",
      postalCode: "",
      complement: "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    onEditingChange?.(false); // Notificar que saiu do modo de edição
    setEditedAddress(address);
    setLocalErrors({});
  };

  const handleSave = () => {
    // Validar todos os campos antes de salvar
    if (onValidate) {
      const validationErrors: Partial<Record<keyof AddressData, string>> = {};
      let hasErrors = false;

      (Object.keys(editedAddress) as Array<keyof AddressData>).forEach((field) => {
        // Pular campos opcionais e numéricos
        if (field !== 'complement' && field !== 'distance') {
          const fieldValue = editedAddress[field];
          const error = onValidate(field, typeof fieldValue === 'string' ? fieldValue : String(fieldValue || ''));
          if (error) {
            validationErrors[field] = error;
            hasErrors = true;
          }
        }
      });

      setLocalErrors(validationErrors);

      if (hasErrors) {
        return;
      }
    }

    onAddressChange(editedAddress);
    setIsEditing(false);
    onEditingChange?.(false); // Notificar que saiu do modo de edição
  };

  const handleFieldChange = (field: keyof AddressData, value: string) => {
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

    setEditedAddress((prev) => ({ ...prev, [field]: sanitized }));

    // Limpa erro ao digitar
    if (localErrors[field]) {
      setLocalErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  // Chamar cálculo de distância apenas quando todos os campos estiverem estáveis
  useEffect(() => {
    if (!isEditing) return;
    const { street, number, neighborhood, postalCode } = debouncedAddress;
    const hasRequired = street && number && neighborhood && postalCode;
    if (!hasRequired) return;

    // Monta endereço destino do cliente
    const destinationAddress = `${street}, ${number}, ${neighborhood}, ${postalCode}`;

    // Evita cálculo se endereço estiver mascarado
    if (destinationAddress.includes("*") || destinationAddress.includes("...")) return;

    // Chama cálculo de distância usando originAddress da prop
    calculateDistance(originAddress, destinationAddress)
      .then(result => {
        setEditedAddress(prev => ({ ...prev, distance: result.distanceInMeters }));
      })
      .catch(err => {
        // toast.error("Erro ao calcular distância");
      });
  }, [debouncedAddress, isEditing, originAddress]);

  // Buscar endereço via CEP quando completo (8 dígitos)
  useEffect(() => {
    if (!isEditing) return;

    const searchCEP = async () => {
      const cleanCEP = editedAddress.postalCode.replace(/\D/g, '');
      
      // Só busca se tiver 8 dígitos
      if (!isValidCEP(cleanCEP)) {
        return;
      }

      setIsLoadingCEP(true);

      try {
        const addressFromCEP = await fetchAddressByCEP(cleanCEP);

        if (addressFromCEP) {
          // Preenche automaticamente rua e bairro (apenas se vazios)
          setEditedAddress(prev => ({
            ...prev,
            street: prev.street || addressFromCEP.logradouro || '',
            neighborhood: prev.neighborhood || addressFromCEP.bairro || '',
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
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editedAddress.postalCode, isEditing]);

  // Formatar endereço para exibição
  const formatAddress = () => {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(`nº ${address.number}`);
    
    const line1 = parts.join(', ');
    
    const parts2 = [];
    if (address.neighborhood) parts2.push(address.neighborhood);
    if (address.postalCode) parts2.push(`CEP ${address.postalCode}`);
    
    const line2 = parts2.join(' - ');
    
    return {
      line1,
      line2,
      complement: address.complement
    };
  };

  const formattedAddress = formatAddress();

  return (
    <div className="space-y-4">
      {!isEditing ? (
        // Preview Mode - Design simplificado conforme solicitado
        <Card className="relative border border-border/50 hover:border-border transition-colors duration-200">
          <CardContent className="p-6">
            {/* Botão de editar flutuante no canto superior direito */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Pen className="w-4 h-4" />
            </Button>

            {/* Conteúdo do endereço */}
            <div className="flex flex-col items-start gap-3 pr-12">
              {/* Título com ícone */}
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Seu endereço</h3>
              </div>

              {/* Endereço formatado */}
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="leading-relaxed">{formattedAddress.line1}</p>
                <p className="leading-relaxed">{formattedAddress.line2}</p>
                {formattedAddress.complement && (
                  <p className="leading-relaxed italic text-xs">{formattedAddress.complement}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <Card className="border-2 border-primary shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Editar Endereço</h3>
                  <p className="text-xs text-muted-foreground">Atualize suas informações de entrega</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="h-9 px-4 bg-primary hover:bg-primary/90 transition-all duration-200"
                  disabled={isLoadingCEP}
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CEP */}
              <div className="sm:col-span-2">
                <Label htmlFor="postalCode" className="text-sm font-medium flex items-center gap-1">
                  CEP <span className="text-destructive">*</span>
                  {isLoadingCEP && (
                    <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Buscando...
                    </span>
                  )}
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="postalCode"
                    value={editedAddress.postalCode}
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                    placeholder="00000-000"
                    className={`transition-all ${
                      localErrors.postalCode 
                        ? "border-red-500 focus:ring-red-500" 
                        : "focus:ring-primary"
                    }`}
                    disabled={isLoadingCEP}
                  />
                  {isLoadingCEP && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-background">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {localErrors.postalCode && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                    <span className="mt-0.5">⚠️</span>
                    {localErrors.postalCode}
                  </p>
                )}
                {!localErrors.postalCode && !isLoadingCEP && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Digite o CEP para preenchimento automático
                  </p>
                )}
              </div>

              {/* Rua */}
              <div className="sm:col-span-2">
                <Label htmlFor="street" className="text-sm font-medium">
                  Rua <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street"
                  value={editedAddress.street}
                  onChange={(e) => handleFieldChange('street', e.target.value)}
                  placeholder="Nome da rua"
                  className={`mt-1.5 transition-all ${
                    localErrors.street 
                      ? "border-red-500 focus:ring-red-500" 
                      : "focus:ring-primary"
                  }`}
                />
                {localErrors.street && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                    <span className="mt-0.5">⚠️</span>
                    {localErrors.street}
                  </p>
                )}
              </div>

              {/* Número */}
              <div>
                <Label htmlFor="number" className="text-sm font-medium">
                  Número <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="number"
                  value={editedAddress.number}
                  onChange={(e) => handleFieldChange('number', e.target.value)}
                  placeholder="123"
                  className={`mt-1.5 transition-all ${
                    localErrors.number 
                      ? "border-red-500 focus:ring-red-500" 
                      : "focus:ring-primary"
                  }`}
                />
                {localErrors.number && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                    <span className="mt-0.5">⚠️</span>
                    {localErrors.number}
                  </p>
                )}
              </div>

              {/* Bairro */}
              <div>
                <Label htmlFor="neighborhood" className="text-sm font-medium">
                  Bairro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="neighborhood"
                  value={editedAddress.neighborhood}
                  onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                  className={`mt-1.5 transition-all ${
                    localErrors.neighborhood 
                      ? "border-red-500 focus:ring-red-500" 
                      : "focus:ring-primary"
                  }`}
                />
                {localErrors.neighborhood && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                    <span className="mt-0.5">⚠️</span>
                    {localErrors.neighborhood}
                  </p>
                )}
              </div>

              {/* Complemento */}
              <div className="sm:col-span-2">
                <Label htmlFor="complement" className="text-sm font-medium text-muted-foreground">
                  Complemento <span className="text-xs">(opcional)</span>
                </Label>
                <Input
                  id="complement"
                  value={editedAddress.complement}
                  onChange={(e) => handleFieldChange('complement', e.target.value)}
                  placeholder="Apartamento, bloco, andar, etc..."
                  className="mt-1.5 focus:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
