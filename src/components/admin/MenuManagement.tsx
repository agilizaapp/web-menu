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
import type { IProductPayload } from '@/types/admin/product.types';
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<IProductPayload | null>(null);

  const [deletingItem, setDeletingItem] = useState<IProductPayload | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);

  const hasLoadedRef = useRef(false);

  const allCategories = useMemo(() => {
    return ['all', ...(categories as string[])];
  }, [categories]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!isVisible || currentRestaurant || (menu && menu.length > 0 && hasLoadedRef.current)) {
      return;
    }

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
          menu: products as IProductPayload[],
        };

        setCurrentRestaurant(restaurantData);

        if (showToast) {
          toast.success(`${products.length} produtos carregados`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar menu:', error);
      toast.error(error instanceof ApiError ? error.message : 'Erro ao carregar produtos');
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const handleAddNew = () => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (item: IProductPayload) => {
    setModalMode('edit');
    setEditingProduct(item);
    setModalOpen(true);
  };

  const handleProductSave = async (product: IProductPayload) => {
    try {
      if (modalMode === 'edit' && currentRestaurant) {
        const updatedMenu = currentRestaurant.menu.map((item) =>
          item.id === product.id ? product : item
        );
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: updatedMenu,
        });
      } else if (currentRestaurant) {
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: [...currentRestaurant.menu, product],
        });
      }
      toast.success('Produto salvo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const toggleAvailability = async (item: IProductPayload) => {
    try {
      setLoadingProductId(item.id || 0);

      try {
        const newAvailability = !item.available;

        // Faz a requisição para atualizar a disponibilidade do produto
        const response = await ProductService.updateProduct(item.id || 0, {
          ...item,
          available: newAvailability,
        });

        // Atualiza o estado do restaurante apenas se o produto for atualizado com sucesso
        if (currentRestaurant) {
          const updatedMenu = currentRestaurant.menu.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, available: response.product.available }
              : menuItem
          );

          setCurrentRestaurant({
            ...currentRestaurant,
            menu: updatedMenu,
          });
        }

        // Exibe uma mensagem de sucesso ao usuário
        toast.success(
          `${item.name} ${response.product.available ? 'habilitado' : 'desabilitado'}`
        );
      } catch (error) {
        console.error('❌ Erro ao atualizar disponibilidade:', error);

        // Exibe uma mensagem de erro ao usuário
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Erro ao atualizar disponibilidade do produto'
        );
      } finally {
        // Reseta o estado de loading para permitir novas interações
        setLoadingProductId(null);
      }
    } catch (e) {
      console.error('❌ Erro inesperado ao alternar disponibilidade:', e);

    }
  }

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
            className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${loadingProductId === item.id ? 'opacity-50 pointer-events-none' : ''
              }`} // Adiciona opacidade e desabilita interações durante o loading
            onClick={() => handleEdit(item)}
          >
            <div className="flex gap-4 p-4">
              <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                <img
                  src={item.image || '/product-image-default.webp'}
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
                      disabled={loadingProductId === item.id} // Desabilita o botão durante o loading
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
                      disabled={loadingProductId === item.id} // Desabilita o botão durante o loading
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => toggleAvailability(item)}
                        disabled={loadingProductId === item.id} // Desabilita o switch durante o loading
                      />
                      {loadingProductId === item.id && (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin text-muted-foreground" />
                      )}
                    </div>
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

      <ProductModal
        isOpen={modalOpen}
        mode={modalMode}
        productData={editingProduct}
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
                    ⚠️ Nome incorreto. Digite exatamente: "{deletingItem?.name}"
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
              // onClick={handleDeleteConfirm}
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
}