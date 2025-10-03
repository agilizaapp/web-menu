import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MenuItem, CartItem } from '@/types';
import { useCartStore } from '@/stores';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<{ [modifierId: string]: string[] }>({});

  const calculateTotalPrice = () => {
    let total = item.price;
    
    // Add modifier prices
    Object.entries(selectedModifiers).forEach(([modifierId, optionIds]) => {
      const modifier = item.modifiers?.find(m => m.id === modifierId);
      if (modifier) {
        optionIds.forEach(optionId => {
          const option = modifier.options.find(o => o.id === optionId);
          if (option) {
            total += option.price;
          }
        });
      }
    });
    
    return total;
  };

  const handleModifierChange = (modifierId: string, optionId: string, checked: boolean) => {
    const modifier = item.modifiers?.find(m => m.id === modifierId);
    if (!modifier) return;

    setSelectedModifiers(prev => {
      const current = prev[modifierId] || [];
      
      if (modifier.type === 'single') {
        return { ...prev, [modifierId]: checked ? [optionId] : [] };
      } else {
        if (checked) {
          return { ...prev, [modifierId]: [...current, optionId] };
        } else {
          return { ...prev, [modifierId]: current.filter(id => id !== optionId) };
        }
      }
    });
  };

  const canAddToCart = () => {
    if (!item.modifiers) return true;
    
    return item.modifiers.every(modifier => {
      if (!modifier.required) return true;
      const selected = selectedModifiers[modifier.id] || [];
      return selected.length > 0;
    });
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      menuItem: item,
      quantity,
      selectedModifiers,
      totalPrice: calculateTotalPrice()
    };
    
    addToCart(cartItem);
    onClose();
  };

  const totalPrice = calculateTotalPrice();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Personalize seu pedido de {item.name} com as opções e modificadores disponíveis.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {/* Image */}
          <div className="aspect-[4/3] relative">
            <ImageWithFallback
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-semibold">{item.name}</h2>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
              <p className="text-muted-foreground mb-3">{item.description}</p>
              <div className="text-xl font-semibold" style={{ color: 'var(--restaurant-primary)' }}>
                R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.map(modifier => (
              <div key={modifier.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium">{modifier.name}</h3>
                  {modifier.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>

                {modifier.type === 'single' ? (
                  <RadioGroup
                    value={selectedModifiers[modifier.id]?.[0] || ''}
                    onValueChange={(value) => handleModifierChange(modifier.id, value, true)}
                  >
                    {modifier.options.map(option => (
                      <div key={option.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id}>{option.name}</Label>
                        </div>
                        {option.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +${option.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {modifier.options.map(option => (
                      <div key={option.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={selectedModifiers[modifier.id]?.includes(option.id) || false}
                            onCheckedChange={(checked) => 
                              handleModifierChange(modifier.id, option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={option.id}>{option.name}</Label>
                        </div>
                        {option.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +${option.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Quantity and Add to Cart */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium text-lg min-w-[2rem] text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                className="px-6"
                style={{ backgroundColor: 'var(--restaurant-primary)' }}
              >
                Add to Cart - ${(totalPrice * quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};