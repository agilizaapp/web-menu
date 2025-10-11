import React from "react";
import { MapPin, ExternalLink, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: {
    label: string;
    mapsUrl: string;
  };
  title?: string;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  location,
  title = "Localização",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-background relative">
          {/* Botão X para fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
          
          <div className="flex items-start justify-between pr-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl mb-2">{title}</DialogTitle>
                <DialogDescription className="text-base flex items-start gap-2">
                  <Navigation className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{location.label}</span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Mapa Incorporado do Google Maps */}
          <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 shadow-lg">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(location.label)}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de localização"
              className="bg-muted"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            {location.mapsUrl && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => window.open(location.mapsUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Google Maps
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto min-w-[120px]"
            >
              Fechar
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Como chegar?</p>
                <p className="text-sm text-muted-foreground">
                  Toque em &quot;Abrir no Google Maps&quot; para obter direções em tempo real, 
                  tempo estimado de chegada e opções de transporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
