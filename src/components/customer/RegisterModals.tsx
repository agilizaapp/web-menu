import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, User, Calendar, X, ArrowLeft, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { sanitizePhone } from "@/utils/orderUtils";
import { useCustomerStore } from "@/stores";
import { toast } from "sonner";

interface CustomerData {
  phone: string;
  name: string;
  birthDate: string;
  isExistingCustomer?: boolean;
}

interface RegisterModalsProps {
  onComplete: (data: CustomerData) => void;
  onClose?: () => void;
}

export const RegisterModals: React.FC<RegisterModalsProps> = ({ onComplete, onClose }) => {
  const { updateAddress } = useCustomerStore();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [customerData, setCustomerData] = useState<CustomerData>({
    phone: "",
    name: "",
    birthDate: "",
  });
  const [errors, setErrors] = useState({
    phone: "",
    name: "",
  });
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [lastCheckedPhone, setLastCheckedPhone] = useState<string>("");

  // Máscara de telefone (XX) XXXXX-XXXX
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  // Validação de telefone
  const validatePhone = (phone: string): string => {
    const numbers = phone.replace(/\D/g, "");
    if (!numbers) return "Telefone é obrigatório";
    if (numbers.length < 10) return "Telefone incompleto (mínimo 10 dígitos)";
    if (numbers.length > 11) return "Telefone inválido";
    return "";
  };

  // Validação de nome
  const validateName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return "Nome é obrigatório";
    if (trimmed.length < 3) return "Nome deve ter pelo menos 3 caracteres";
    if (trimmed.length > 100) return "Nome muito longo (máximo 100 caracteres)";
    
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      return "Nome deve conter apenas letras e espaços";
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      return "Informe nome e sobrenome";
    }

    for (const part of parts) {
      if (part.length < 2) {
        return "Cada parte do nome deve ter pelo menos 2 letras";
      }
    }

    return "";
  };

  // Validação de data de nascimento (opcional)
  const validateBirthDate = (date: string): boolean => {
    if (!date) return true; // Opcional
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 0 && age <= 120;
  };

  const handlePhoneChange = async (value: string) => {
    const formatted = formatPhone(value);
    setCustomerData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(formatted) }));
    }

    // Buscar cliente automaticamente APENAS se tiver 11 dígitos (celular)
    const numbers = formatted.replace(/\D/g, "");
    if (numbers.length === 11) {
      await checkCustomerByPhone(formatted);
    } else {
      // Limpar dados do cliente existente se telefone incompleto ou com 10 dígitos
      setExistingCustomer(null);
      setLastCheckedPhone("");
    }
  };

  const checkCustomerByPhone = async (phone: string) => {
    const phoneError = validatePhone(phone);
    if (phoneError) return;

    // Evitar requisições duplicadas para o mesmo telefone
    if (lastCheckedPhone === phone) {
      return;
    }

    setIsCheckingPhone(true);
    setLastCheckedPhone(phone);

    try {
      const sanitized = sanitizePhone(phone);
      const customer = await apiService.getCustomerByPhone(sanitized);

      if (customer) {
        setExistingCustomer(customer);
        
        // Se o cliente tem endereço salvo, atualizar no store
        if (customer.address) {
          updateAddress(customer.address);
          toast.success(`Encontramos seu cadastro e endereço, ${customer.name}!`);
        } else {
          toast.success(`Encontramos seu cadastro, ${customer.name}!`);
        }
        
        // Ir direto para o checkout sem precisar clicar em continuar
        const completeData: CustomerData = {
          phone: phone,
          name: customer.name,
          birthDate: "",
          isExistingCustomer: true,
        };
        onComplete(completeData);
      } else {
        setExistingCustomer(null);
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      setExistingCustomer(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[<>"'`]/g, "");
    if (sanitized.length <= 100) {
      setCustomerData((prev) => ({ ...prev, name: sanitized }));
      if (errors.name) {
        setErrors((prev) => ({ ...prev, name: validateName(sanitized) }));
      }
    }
  };

  const handleBirthDateChange = (value: string) => {
    setCustomerData((prev) => ({ ...prev, birthDate: value }));
  };

  const handleStep1Submit = async () => {
    const phoneError = validatePhone(customerData.phone);
    
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    // Se já checou e encontrou cliente, pular para completar
    if (existingCustomer) {
      const completeData: CustomerData = {
        phone: customerData.phone,
        name: existingCustomer.name,
        birthDate: "",
        isExistingCustomer: true,
      };
      onComplete(completeData);
      return;
    }

    // Se já fez a verificação (lastCheckedPhone está setado), não verificar novamente
    if (lastCheckedPhone === customerData.phone) {
      // Novo cliente - ir para próximo modal
      toast.info("Novo cliente! Por favor, preencha seus dados.");
      setCurrentStep(2);
      return;
    }

    // Se não checou ainda (ex: telefone de 10 dígitos), checar agora
    setIsCheckingPhone(true);

    try {
      const sanitized = sanitizePhone(customerData.phone);
      const customer = await apiService.getCustomerByPhone(sanitized);
      setLastCheckedPhone(customerData.phone);
      
      if (customer) {
        // Se o cliente tem endereço salvo, atualizar no store
        if (customer.address) {
          updateAddress(customer.address);
        }
        
        // Cliente encontrado - completar diretamente
        const completeData: CustomerData = {
          phone: customerData.phone,
          name: customer.name,
          birthDate: "",
          isExistingCustomer: true,
        };
        onComplete(completeData);
        return;
      }

      // Novo cliente - ir para próximo modal
      toast.info("Novo cliente! Por favor, preencha seus dados.");
      setCurrentStep(2);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      // Continua para próximo passo mesmo com erro
      setCurrentStep(2);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleStep2Submit = () => {
    const nameError = validateName(customerData.name);
    
    if (nameError) {
      setErrors((prev) => ({ ...prev, name: nameError }));
      return;
    }

    if (customerData.birthDate && !validateBirthDate(customerData.birthDate)) {
      return;
    }

    onComplete({ ...customerData, isExistingCustomer: false });
  };

  return (
    <>
      {/* Modal 1 - Telefone */}
      <Dialog open={currentStep === 1} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          )}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Bem-vindo!
            </DialogTitle>
            <DialogDescription>
              Para começar, precisamos do seu número de WhatsApp para entrar em contato
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone (WhatsApp) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={customerData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleStep1Submit();
                  }
                }}
                className={errors.phone ? "border-destructive" : ""}
                autoComplete="tel"
                autoFocus
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Usaremos este número para enviar atualizações do seu pedido
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleStep1Submit}
              className="w-full"
              style={{ backgroundColor: "var(--restaurant-primary)" }}
              disabled={isCheckingPhone}
            >
              {isCheckingPhone ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2 - Nome e Data de Nascimento */}
      <Dialog open={currentStep === 2} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Seus Dados
            </DialogTitle>
            <DialogDescription>
              Agora precisamos de mais algumas informações
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="João da Silva"
                value={customerData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                autoComplete="name"
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data de Nascimento <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={customerData.birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                autoComplete="bday"
              />
              <p className="text-xs text-muted-foreground">
                Para oferecermos promoções especiais no seu aniversário
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleStep2Submit}
              className="flex-1"
              style={{ backgroundColor: "var(--restaurant-primary)" }}
            >
              Começar a Pedir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
