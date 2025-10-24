import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/types/entities.types';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { animations } from '@/lib/animations';
import { HighlightBadge } from './HighlightBadge';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick }) => {
  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${animations.fadeInUp} group`}
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge de destaque */}
        {item.isHighlighted && item.highlightType && (
          <HighlightBadge 
            type={item.highlightType} 
            label={item.highlightLabel}
          />
        )}
        
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="destructive" className="animate-in zoom-in-95 duration-300">Esgotado</Badge>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold max-w-[220px] sm:!max-w-[165px] transition-colors duration-200 group-hover:text-primary">{item.name}</h3>
          <span className="font-semibold text-lg transition-all duration-200 group-hover:scale-110" style={{ color: 'var(--restaurant-primary)' }}>
            R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.description}
        </p>
        
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs transition-all duration-200 group-hover:bg-primary/10">
            {item.category}
          </Badge>
          
          <Button 
            size="sm" 
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 hover:rotate-90"
            style={{ backgroundColor: 'var(--restaurant-primary)' }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};