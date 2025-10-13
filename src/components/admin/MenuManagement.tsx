'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { useRestaurantStore } from '@/stores';
import { toast } from 'sonner';
import type { MenuItem, Restaurant } from '@/types/entities.types';
import { ProductService } from '@/services/admin/product.service';
import { RestaurantsService } from '@/services/restaurant/restaurant.service';
import { ApiError } from '@/lib/utils/api-error';
import { ProductModal } from './ProductModal';

interface MenuManagementProps {
  isVisible?: boolean;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ isVisible = true }) => {
  const { menu, categories, currentRestaurant, setCurrentRestaurant } = useRestaurantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ ATUALIZADO: Estados para o modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<MenuItem | undefined>(); // ✅ MUDOU: Armazena objeto completo

  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const hasLoadedRef = useRef(false);

  const allCategories = useMemo(() => {
    return ['all', ...(categories as string[])];
  }, [categories]);

  const filteredMenu = useMemo(() => {
    const filtered = menu.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return filtered;
  }, [menu, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!isVisible) return;
    if (currentRestaurant) return;
    if (menu && menu.length > 0 && hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    loadMenuFromAPI();
  }, [isVisible, currentRestaurant]);

  const loadMenuFromAPI = async (showToast = false) => {
    try {
      setIsLoadingMenu(true);
      const response = await RestaurantsService.getAllProducts(true);

      if (response?.products) {
        const products = Array.isArray(response.products) ? response.products : [];

        const restaurantData = {
          id: 1,
          name: response?.store?.name || '',
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
            deliverySettings: response?.store?.configs.settings.deliverySettings || [],
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

  // ✅ NOVO: Abrir modal para criar produto
  const handleAddNew = () => {
    setModalMode('create');
    setEditingProduct(undefined);
    setModalOpen(true);
  };

  // Abrir modal para editar produto (passa objeto completo)
  const handleEdit = (item: MenuItem) => {
    setModalMode('edit');
    setEditingProduct(item);
    setModalOpen(true);
  };

  const handleProductSave = (product: MenuItem) => {
    if (modalMode === 'edit' && currentRestaurant) {
      // Atualizar produto existente
      const updatedMenu = currentRestaurant.menu.map((item) =>
        item.id === product.id ? product : item
      );
      setCurrentRestaurant({
        ...currentRestaurant,
        menu: updatedMenu,
      });
    } else {
      if (currentRestaurant)
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: [...currentRestaurant.menu, product],
        });
    }
  };

  const handleDeleteClick = (item: MenuItem) => {
    setDeletingItem(item);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (
      deleteConfirmText.trim().toLowerCase() !== deletingItem.name.trim().toLowerCase()
    ) {
      toast.error('Nome do produto incorreto. Tente novamente.');
      return;
    }

    try {
      setIsDeleting(true);
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

  const toggleAvailability = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const newAvailability = !item.available;
      await ProductService.updateProduct(item.id, {
        available: newAvailability,
      });

      if (currentRestaurant) {
        const updatedMenu = currentRestaurant.menu.map((menuItem) =>
          menuItem.id === item.id ? { ...menuItem, available: newAvailability } : menuItem
        );
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: updatedMenu,
        });
      }

      toast.success(`${item.name} ${newAvailability ? 'habilitado' : 'desabilitado'}`);
    } catch (error) {
      console.error('❌ Erro ao toggle:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar disponibilidade');
      }
    }
  };

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
              hasLoadedRef.current = false;
              loadMenuFromAPI(true);
            }}
            disabled={isLoadingMenu}
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isLoadingMenu ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>

          <Button onClick={handleAddNew}>
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
                : `${category} (${menu.filter((item) => item.category === category).length
                })`}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-3">
        {filteredMenu.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleEdit(item)}
          >
            <div className="flex gap-4 p-4">
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

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>

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

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">
                      {item.available ? 'Disponível' : 'Indisponível'}
                    </span>
                    <Switch
                      checked={item.available}
                      onCheckedChange={() =>
                        toggleAvailability(item, {} as React.MouseEvent)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
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
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          )}
        </div>
      )}

      {/* ✅ ATUALIZADO: Modal recebe productData em vez de productId */}
      <ProductModal
        isOpen={modalOpen}
        mode={modalMode}
        productData={editingProduct} // ✅ Passa objeto completo
        categories={categories as string[]}
        onClose={() => setModalOpen(false)}
        onSave={handleProductSave}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a deletar o produto:{' '}
                <strong className="text-foreground">{deletingItem?.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. Para confirmar, digite o nome completo
                do produto abaixo:
              </p>
              <Input
                placeholder="Digite o nome do produto"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={isDeleting}
                className="mt-2"
              />
              {deleteConfirmText &&
                deleteConfirmText.trim().toLowerCase() !==
                deletingItem?.name.trim().toLowerCase() && (
                  <p className="text-xs text-destructive">
                    ⚠️ Nome incorreto. Digite exatamente: &quot;{deletingItem?.name}&quot;
                  </p>
                )} 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletingItem(null);
                setDeleteConfirmText('');
              }}
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={
                isDeleting ||
                deleteConfirmText.trim().toLowerCase() !==
                deletingItem?.name.trim().toLowerCase()
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};