import React from "react";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Tag, Sparkles } from "lucide-react";

interface HighlightBadgeProps {
  type: 'popular' | 'chef-recommendation' | 'promotion' | 'new';
  label?: string;
  className?: string;
}

export const HighlightBadge: React.FC<HighlightBadgeProps> = ({ 
  type, 
  label, 
  className = "" 
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'popular':
        return {
          icon: <Flame className="w-3 h-3" />,
          text: label || "Mais Pedido",
          variant: "default" as const,
          className: "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
        };
      case 'chef-recommendation':
        return {
          icon: <Star className="w-3 h-3" />,
          text: label || "Recomendação do Chefe",
          variant: "default" as const,
          className: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
        };
      case 'promotion':
        return {
          icon: <Tag className="w-3 h-3" />,
          text: label || "Promoção",
          variant: "default" as const,
          className: "bg-red-500 hover:bg-red-600 text-white border-red-500"
        };
      case 'new':
        return {
          icon: <Sparkles className="w-3 h-3" />,
          text: label || "Novo",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600 text-white border-green-500"
        };
      default:
        return {
          icon: null,
          text: label || "Destaque",
          variant: "default" as const,
          className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge 
      variant={config.variant}
      className={`absolute top-2 right-2 z-10 flex items-center gap-1 text-xs font-semibold shadow-lg ${config.className} ${className}`}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
      <span className="sm:hidden">{config.text.split(' ')[0]}</span>
    </Badge>
  );
};
