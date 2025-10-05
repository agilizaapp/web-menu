import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingBag, Filter, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MenuItemCard } from './MenuItemCard';
import { MenuItemModal } from './MenuItemModal';
import { useCartStore } from '@/stores/cartStore';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { WeeklySchedule } from '@/types';
import { MenuItem } from '@/types/entities.types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Image from 'next/image';

interface MenuPageProps {
  onStartCheckout: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onStartCheckout }) => {
  const { currentRestaurant, menu, categories } = useRestaurantStore();
  const { getCartItemCount, getTotalCartPrice } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering cart button after client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const allCategories = useMemo(() => {
    // if (menu?.length > 0) {
    //   const cats = Array.from(new Set(menu.map(item => item.category)));
    // }
    return ['all'].concat(categories as string[]);
  }, [categories]);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (typeof item === 'string') {
        const matchesSearch = item.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item === selectedCategory;
        return matchesSearch && matchesCategory;
      }

      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.available;
    });
  }, [menu, searchQuery, selectedCategory]);

  const groupedMenu = useMemo(() => {
    const grouped: { [category: string]: MenuItem[] } = {};
    filteredMenu.forEach(item => {
      if (typeof item === 'string') {
        return;
      }
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [filteredMenu]);

  if (!currentRestaurant) return null;

  const cartCount = getCartItemCount();
  const cartTotal = getTotalCartPrice();

  const getDayName = (day: keyof WeeklySchedule): string => {
    const names: Record<keyof WeeklySchedule, string> = {
      monday: 'Segunda-feira',
      tuesday: 'Terça-feira',
      wednesday: 'Quarta-feira',
      thursday: 'Quinta-feira',
      friday: 'Sexta-feira',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return names[day];
  };

  const getShortDayName = (day: keyof WeeklySchedule): string => {
    const names: Record<keyof WeeklySchedule, string> = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
      saturday: 'Sáb',
      sunday: 'Dom'
    };
    return names[day];
  };

  const formatTime = (time: string): string => {
    // Converts 24h format to more readable format
    return time;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Restaurant Branding */}
      <div 
        className="sticky top-0 z-40 px-4 py-6 shadow-sm"
        style={{ backgroundColor: 'var(--restaurant-primary)', color: 'white' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="w-full flex flex-col items-start mb-4">
            {/* <img className="text-3xl max-h-20" width="150" height="80" src={currentRestaurant?.theme?.logo} alt={`Logo do Restaurante ${currentRestaurant?.theme?.name}`} /> */}
            <Image
              src={currentRestaurant?.theme?.logo}
              alt={`Logo ${currentRestaurant?.theme?.name}`}
              width={150}
              height={80}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWUiLz48L3N2Zz4="
              className="relative w-[150px] h-[80px] object-contain"
              priority
            />
            <div className="w-full flex-1">
              <h1 className="text-xl font-semibold">{currentRestaurant?.theme?.name}</h1>
              
              {/* Hours Display */}
              {currentRestaurant?.settings?.useCustomHours && currentRestaurant?.settings?.customHours ? (
                <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
                  <CollapsibleTrigger className="flex items-center gap-1 text-white/80 text-sm hover:text-white transition-colors">
                    <Clock className="w-3 h-3" />
                    <span>Ver horários de funcionamento</span>
                    {hoursOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-white/10 rounded-lg p-3 space-y-1">
                      {(Object.keys(currentRestaurant?.settings?.customHours) as Array<keyof WeeklySchedule>).map(day => {
                        const schedule = currentRestaurant?.settings?.customHours![day];
                        return (
                          <div key={day} className="flex justify-between items-center text-sm">
                            <span className="text-white/90">{getDayName(day)}</span>
                            {schedule.closed ? (
                              <span className="text-white/60">Fechado</span>
                            ) : (
                              <span className="text-white/90">
                                {formatTime(schedule.open)} - {formatTime(schedule.close)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentRestaurant?.settings?.hours}
                </p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              placeholder="Buscar itens do cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-[120px] z-30 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allCategories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0 capitalize"
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--restaurant-primary)' : undefined,
                  borderColor: 'var(--restaurant-primary)',
                  color: selectedCategory === category ? 'white' : 'var(--restaurant-primary)'
                }}
              >
                {category === 'all' ? 'Todos os Itens' : category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {Object.entries(groupedMenu).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredMenu.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum item encontrado correspondente à sua busca.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {isClient && cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={onStartCheckout}
              className="w-full h-14 text-base shadow-lg"
              style={{ backgroundColor: 'var(--restaurant-primary)' }}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              <span className="flex-1">Ver Carrinho ({cartCount} itens)</span>
              <span className="font-semibold">R$ {cartTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};