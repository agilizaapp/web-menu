import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, ChefHat } from "lucide-react";
import { MenuItem } from "@/types/entities.types";
import { MenuItemCard } from "./MenuItemCard";
import { animations } from "@/lib/animations";

interface HighlightedItemsSectionProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  title?: string;
  maxItems?: number;
}

export const HighlightedItemsSection: React.FC<HighlightedItemsSectionProps> = ({
  items,
  onItemClick,
  title = "Recomendações do Chefe",
  maxItems = 4
}) => {
  // Filtrar apenas itens em destaque e limitar a quantidade
  const highlightedItems = items
    .filter(item => item.isHighlighted && item.available)
    .slice(0, maxItems);

  if (highlightedItems.length === 0) {
    return null;
  }

  const getSectionIcon = () => {
    const types = highlightedItems.map(item => item.highlightType);
    if (types.includes('chef-recommendation')) return <ChefHat className="w-5 h-5" />;
    if (types.includes('popular')) return <Flame className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  return (
    <section className="mb-8">
      {/* Cabeçalho da seção */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          {getSectionIcon()}
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          {highlightedItems.length} {highlightedItems.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {/* Grid de itens em destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlightedItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`${animations.fadeInUp}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <MenuItemCard
              item={item}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>

      {/* Linha decorativa */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
};
