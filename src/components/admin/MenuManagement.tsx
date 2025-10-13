'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRestaurantStore } from '@/stores';
import { toast } from 'sonner';
import type { MenuItem, Restaurant } from '@/types/entities.types';
import type {
  ICreateProductPayload,
  IProductModifierGroup,
} from '@/types/admin/product.types';
import { ProductService } from '@/services/admin/product.service';
import { RestaurantsService } from '@/services/restaurant/restaurant.service';
import { ApiError } from '@/lib/utils/api-error';
import { ModifierField } from './ModifierField';
import { ImageUpload } from './ImageUpload';

interface MenuManagementProps {
  isVisible?: boolean; // ✅ NOVO: Prop para controlar visibilidade
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ isVisible = true }) => {
  const { menu, categories, currentRestaurant, setCurrentRestaurant } =
    useRestaurantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasLoadedRef = useRef(false); // ✅ Controla se já carregou

  const [formData, setFormData] = useState<
    Partial<MenuItem & { modifiers?: IProductModifierGroup[] }>
  >({
    available: true,
  });

  const allCategories = useMemo(() => {
    return ['all', ...(categories as string[])];
  }, [categories]);

  const filteredMenu = useMemo(() => {
    console.log('🔍 Filtrando menu:', {
      totalItems: menu.length,
      searchQuery,
      selectedCategory,
    });

    const filtered = menu.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    console.log('✅ Produtos filtrados:', filtered.length);
    return filtered;
  }, [menu, searchQuery, selectedCategory]);

  // Carregar produtos quando a tab ficar visível
  useEffect(() => {
    console.log('👁️ MenuManagement visibilidade mudou:', { isVisible, hasLoaded: hasLoadedRef.current });

    if (!isVisible) {
      // console.log('🙈 Tab não está visível, ignorando carregamento');
      return;
    }

    if (currentRestaurant) {
      return;
    }

    // Se já tem produtos E já carregou antes, não recarrega
    if (menu && menu.length > 0 && hasLoadedRef.current) {
      console.log('✅ Produtos já carregados anteriormente');
      return;
    }

    // Carregar produtos da API
    console.log('📡 Tab visível - Iniciando carregamento de produtos...');
    hasLoadedRef.current = true;
    loadMenuFromAPI();
  }, [isVisible, currentRestaurant]); // Reage a mudanças de visibilidade

  // Função para carregar menu da API
  const loadMenuFromAPI = async (showToast = false) => {
    try {
      setIsLoadingMenu(true);
      console.log('📡 Chamando RestaurantsService.getAllProducts()...');

      const response = await RestaurantsService.getAllProducts(true);

      console.log('📦 Resposta da API:', {
        hasProducts: !!response?.products,
        productsCount: response?.products?.length || 0,
        isArray: Array.isArray(response?.products),
      });

      if (response?.products) {
        const products = Array.isArray(response.products)
          ? response.products
          : [];

        const restaurantData = {
          id: 1,
          name: response?.store?.name || "",
          theme: {
            name: response?.store?.name,
            logo: response?.store?.configs.theme.logo,
            primaryColor: response?.store?.configs.theme.primaryColor,
            secondaryColor: response?.store?.configs.theme.secondaryColor,
            accentColor: response?.store?.configs.theme.accentColor,
          },
          settings: {
            hours: response?.store?.configs.settings.hours,
            useCustomHours: response?.store?.configs.settings.useCustomHours,
            customHours: response?.store?.configs.settings.customHours,
            deliveryFee: response?.store?.configs.settings.deliveryFee,
            deliveryZones: response?.store?.configs.settings.deliveryZones,
            pixKey: response?.store?.configs.settings.pixKey,
            address: response?.store?.configs.settings.address,
            pickUpLocation: response?.store?.configs.settings.pickUpLocation,
          },
          menu: products as MenuItem[],
        };

        setCurrentRestaurant(restaurantData as Restaurant);

        if (showToast) {
          toast.success(`${products.length} produtos carregados`);
        }
      } else {
        console.warn('⚠️ Sem produtos');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar menu:', error);

      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // ✅ Carregar dados do produto ao editar
  useEffect(() => {
    if (editingItem) {
      loadProductData(editingItem.id);
    }
  }, [editingItem]);

  const loadProductData = async (productId: number) => {
    try {
      setIsLoadingProduct(true);
      console.log('📡 Carregando produto ID:', productId);

      const response = await ProductService.getProductById(productId);

      console.log('✅ Produto carregado:', response.data);

      setFormData({
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        category: response.data.category,
        price: response.data.price,
        image: response.data.image,
        available: response.data.available,
        modifiers: response.data.modifiers || [],
      });
    } catch (error) {
      console.error('❌ Erro ao carregar produto:', error);

      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao carregar dados do produto');
      }

      setEditingItem(null);
      setFormData({ available: true });
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    console.log('✏️ Editando produto:', item.name);
    setEditingItem(item);
  };

  const handleDeleteClick = (item: MenuItem) => {
    console.log('🗑️ Preparando para deletar:', item.name);
    setDeletingItem(item);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (deleteConfirmText.trim().toLowerCase() !== deletingItem.name.trim().toLowerCase()) {
      toast.error('Nome do produto incorreto. Tente novamente.');
      return;
    }

    try {
      setIsDeleting(true);
      console.log('🗑️ Deletando produto ID:', deletingItem.id);

      await ProductService.deleteProduct(deletingItem.id);

      if (currentRestaurant) {
        const updatedMenu = currentRestaurant.menu.filter(
          (menuItem) => menuItem.id !== deletingItem.id
        );
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: updatedMenu,
        });
      }

      toast.success('✅ Produto deletado com sucesso');
      setDeletingItem(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao deletar produto');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.description ||
      !formData.category
    ) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.image) {
      toast.error('Por favor, adicione uma imagem do produto');
      return;
    }

    try {
      setIsSaving(true);

      const payload: ICreateProductPayload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        image: formData.image,
        available: formData.available ?? true,
        modifiers: formData.modifiers || [],
      };

      if (editingItem) {
        console.log('📤 Atualizando produto ID:', editingItem.id);
        const response = await ProductService.updateProduct(
          editingItem.id,
          payload
        );

        if (currentRestaurant) {
          const updatedMenu = currentRestaurant.menu.map((item) =>
            item.id === editingItem.id
              ? {
                id: response.data.id,
                name: response.data.name,
                description: response.data.description,
                category: response.data.category,
                price: response.data.price,
                image: response.data.image,
                available: response.data.available,
                modifiers: response.data.modifiers,
              }
              : item
          );

          setCurrentRestaurant({
            ...currentRestaurant,
            menu: updatedMenu,
          });
        }

        toast.success('✅ Produto atualizado com sucesso');
      } else {
        console.log('📤 Criando novo produto');
        const response = await ProductService.createProduct(payload);

        if (currentRestaurant) {
          const newMenuItem: MenuItem = {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            category: response.data.category,
            price: response.data.price,
            image: response.data.image,
            available: response.data.available,
            modifiers: response.data.modifiers,
          };

          setCurrentRestaurant({
            ...currentRestaurant,
            menu: [...currentRestaurant.menu, newMenuItem],
          });
        }

        toast.success('✅ Produto criado com sucesso');
      }

      setFormData({ available: true });
      setIsAddingNew(false);
      setEditingItem(null);
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao salvar produto');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const newAvailability = !item.available;
      console.log('🔄 Toggle disponibilidade:', item.name, '->', newAvailability);

      await ProductService.updateProduct(item.id, {
        available: newAvailability,
      });

      if (currentRestaurant) {
        const updatedMenu = currentRestaurant.menu.map((menuItem) =>
          menuItem.id === item.id
            ? { ...menuItem, available: newAvailability }
            : menuItem
        );
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: updatedMenu,
        });
      }

      toast.success(
        `${item.name} ${newAvailability ? 'habilitado' : 'desabilitado'}`
      );
    } catch (error) {
      console.error('❌ Erro ao toggle:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar disponibilidade');
      }
    }
  };

  const handleCloseModal = () => {
    setIsAddingNew(false);
    setEditingItem(null);
    setFormData({ available: true });
  };

  // ✅ Loading State
  if (isLoadingMenu) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Gerenciamento do Cardápio</h2>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie os itens do cardápio do seu restaurante
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center flex flex-col justify-center items-center">
            <Loader2 className="animate-spin h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 Renderizando MenuManagement');
  console.log('📊 Estado de renderização:', {
    menuLength: menu.length,
    filteredMenuLength: filteredMenu.length,
    selectedCategory,
    searchQuery,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Gerenciamento do Cardápio</h2>
          <p className="text-muted-foreground">
            Adicione, edite e gerencie os itens do cardápio do seu restaurante
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              hasLoadedRef.current = false; // ✅ Reseta flag para forçar reload
              loadMenuFromAPI(true);
            }}
            disabled={isLoadingMenu}
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isLoadingMenu ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>

          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens do cardápio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="shrink-0 capitalize"
            >
              {category === 'all'
                ? `Todos (${menu.length})`
                : `${category} (${menu.filter(item => item.category === category).length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-3">
        {console.log('🔢 Renderizando', filteredMenu.length, 'produtos')}
        {filteredMenu.map((item) => {
          console.log('📦 Renderizando card:', item.name);
          return (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEdit(item)}
            >
              <div className="flex gap-4 p-4">
                {/* Imagem do Produto */}
                <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={item.image || '/placeholder-food.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">
                        Indisponível
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Informações do Produto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="h-9 w-9"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item);
                        }}
                        className="h-9 w-9 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Metadados */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="capitalize">
                      {item.category}
                    </Badge>

                    <span className="text-lg font-bold text-primary">
                      R${' '}
                      {item.price.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {item.modifiers.length} variação(ões)
                      </span>
                    )}

                    {/* Switch de Disponibilidade */}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-muted-foreground">
                        {item.available ? 'Disponível' : 'Indisponível'}
                      </span>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => toggleAvailability(item, {} as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMenu.length === 0 && !isLoadingMenu && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Nenhum produto corresponde à sua busca.'
              : 'Comece adicionando produtos ao cardápio.'}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Limpar Busca
            </Button>
          ) : (
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          )}
        </div>
      )}

      {/* Modals (sem alterações) */}
      {/* ... resto do código permanece igual ... */}
    </div>
  );
};