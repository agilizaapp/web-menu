'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRestaurantStore } from '@/stores';
import { toast } from 'sonner';
import type { MenuItem } from '@/types/entities.types';
import type {
  ICreateProductPayload,
  IProductModifierGroup,
} from '@/types/admin/product.types';
import { ProductService } from '@/services/admin/product.service';
import { ApiError } from '@/lib/utils/api-error';
import { ModifierField } from '@/components/admin/ModifierField';
import { ImageUpload } from '@/components/admin/ImageUpload';

export const MenuManagement: React.FC = () => {
  // ✅ CORREÇÃO: Usar setCurrentRestaurant ao invés de addMenuItem/deleteMenuItem
  const { menu, categories, currentRestaurant, setCurrentRestaurant } =
    useRestaurantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<
    Partial<MenuItem & { modifiers?: IProductModifierGroup[] }>
  >({});

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

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
  };

  // ✅ CORREÇÃO: Atualizar deleteMenuItem para usar setCurrentRestaurant
  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      await ProductService.deleteProduct(item.id);

      // ✅ Atualizar o menu removendo o item deletado
      if (currentRestaurant) {
        const updatedMenu = currentRestaurant.menu.filter(
          (menuItem) => menuItem.id !== item.id
        );
        setCurrentRestaurant({
          ...currentRestaurant,
          menu: updatedMenu,
        });
      }

      toast.success('Item do cardápio deletado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao deletar item');
      }
    }
  };

  const handleSave = async () => {
    // Validação básica
    if (
      !formData.name ||
      !formData.price ||
      !formData.description ||
      !formData.category
    ) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // ✅ Validar se tem imagem
    if (!formData.image) {
      toast.error('Por favor, adicione uma imagem do produto');
      return;
    }

    try {
      setIsSaving(true);

      // ✅ Preparar payload com URL da Cloudinary
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
        // ✅ PUT /product/:id
        const response = await ProductService.updateProduct(
          editingItem.id,
          payload
        );

        // ✅ Atualizar o menu com o item editado
        if (currentRestaurant) {
          const updatedMenu = currentRestaurant.menu.map((item) =>
            item.id === editingItem.id
              ? {
                ...editingItem,
                ...payload,
                id: editingItem.id,
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
        // ✅ POST /product
        const response = await ProductService.createProduct(payload);

        // ✅ Adicionar o novo item ao menu
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

      // Resetar form
      setFormData({});
      setIsAddingNew(false);
      setEditingItem(null);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao salvar produto');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ CORREÇÃO: Atualizar toggleAvailability para usar setCurrentRestaurant
  const toggleAvailability = async (item: MenuItem) => {
    try {
      const newAvailability = !item.available;

      await ProductService.updateProduct(item.id, {
        available: newAvailability,
      });

      // ✅ Atualizar o menu com a nova disponibilidade
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
        `Item ${newAvailability ? 'habilitado' : 'desabilitado'} com sucesso`
      );
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar disponibilidade');
      }
    }
  };

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
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
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
                ? `Todos os Itens (${menu.length})`
                : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative h-48">
              <img
                src={item.image || '/placeholder-food.jpg'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge variant={item.available ? 'default' : 'secondary'}>
                  {item.available ? 'Disponível' : 'Esgotado'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  R${' '}
                  {item.price.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <Badge variant="outline" className="capitalize">
                  {item.category}
                </Badge>
              </div>

              {/* Modificadores Preview */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {item.modifiers.length} variação(ões) disponível(is)
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAvailability(item)}
                >
                  <Switch checked={item.available} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item)}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum item encontrado correspondente à sua busca.
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddingNew || editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingNew(false);
            setEditingItem(null);
            setFormData({});
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Adicionar Novo Produto' : 'Editar Produto'}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew
                ? 'Crie um novo produto com foto, preço e variações.'
                : 'Atualize os detalhes do produto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* ✅ ImageUpload Component */}
            <div className="space-y-2">
              <Label>Foto do Produto *</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, image: url }))
                }
                disabled={isSaving}
              />
            </div>

            {/* Nome e Preço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Pizza Margherita"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0,00"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descreva seu prato de forma atrativa..."
                rows={3}
                disabled={isSaving}
              />
            </div>

            {/* Categoria e Disponibilidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Ex: Pizzas, Bebidas..."
                  maxLength={50}
                  disabled={isSaving}
                />
                {categories && (categories as string[]).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Categorias existentes:</span>{' '}
                    {(categories as string[]).map((cat, idx) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, category: cat }))
                        }
                        className="text-primary hover:underline mx-1"
                        disabled={isSaving}
                      >
                        {cat}
                        {idx < (categories as string[]).length - 1 && ','}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Disponibilidade</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={formData.available || false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, available: checked }))
                    }
                    disabled={isSaving}
                  />
                  <span className="text-sm">
                    {formData.available ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modificadores */}
            <ModifierField
              modifiers={formData.modifiers || []}
              onChange={(modifiers) =>
                setFormData((prev) => ({ ...prev, modifiers }))
              }
            />

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingItem(null);
                  setFormData({});
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{isAddingNew ? 'Criar Produto' : 'Salvar Alterações'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};