import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/types/entities.types';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick }) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative">
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Esgotado</Badge>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
          <span className="font-semibold text-lg" style={{ color: 'var(--restaurant-primary)' }}>
            R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.description}
        </p>
        
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
          
          <Button 
            size="sm" 
            className="h-8 w-8 p-0"
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