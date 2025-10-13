'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Upload, X, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRestaurantStore } from '@/stores';
import { toast } from 'sonner';
import type { MenuItem } from '@/types/entities.types';
import type {
  ICreateProductPayload,
  IProductModifierGroup,
} from '@/types/admin/product.types';
import { ProductService } from '@/services/admin/product.service';
import { ApiError } from '@/lib/utils/api-error';
import { ModifierField } from './ModifierField';

export const MenuManagement: React.FC = () => {
  const { menu, categories, addMenuItem, updateMenuItem, deleteMenuItem } =
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

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      await ProductService.deleteProduct(item.id);
      deleteMenuItem(item.id);
      toast.success('Item do cardápio deletado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao deletar item');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      toast.success('Imagem enviada com sucesso');
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

    try {
      setIsSaving(true);

      // Preparar payload
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
        // ✅ Atualizar produto existente
        const response = await ProductService.updateProduct(
          editingItem.id,
          payload
        );

        updateMenuItem({
          ...editingItem,
          ...payload,
          id: editingItem.id,
          modifiers: response.data.modifiers,
        });

        toast.success('Item do cardápio atualizado com sucesso');
      } else {
        // ✅ Criar novo produto
        const response = await ProductService.createProduct(payload);

        addMenuItem({
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          category: response.data.category,
          price: response.data.price,
          image: response.data.image,
          available: response.data.available,
          modifiers: response.data.modifiers,
        });

        toast.success('Item do cardápio adicionado com sucesso');
      }

      // Resetar form
      setFormData({});
      setIsAddingNew(false);
      setEditingItem(null);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao salvar item do cardápio');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const newAvailability = !item.available;

      await ProductService.updateProduct(item.id, {
        available: newAvailability,
      });

      updateMenuItem({ ...item, available: newAvailability });

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
              {isAddingNew ? 'Adicionar Novo Item' : 'Editar Item do Cardápio'}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew
                ? 'Crie um novo item do cardápio com fotos, preços e variações.'
                : 'Atualize os detalhes, preços e disponibilidade deste item do cardápio.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do Produto</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {formData.image ? (
                  <div className="relative space-y-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, image: '' }))
                      }
                    >
                      Remover Imagem
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Envie uma foto de alta qualidade do seu prato
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button variant="outline" asChild>
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer"
                        >
                          Escolher Imagem
                        </label>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
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
                />
              </div>
            </div>

            {/* Description */}
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
              />
            </div>

            {/* Category & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
                  maxLength={50}
                />
                {/* ✅ NOVO: Sugestões de categorias existentes */}
                {categories && (categories as string[]).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Categorias existentes:</span>{' '}
                    {(categories as string[]).map((cat, idx) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                        className="text-primary hover:underline mx-1"
                      >
                        {cat}{idx < (categories as string[]).length - 1 && ','}
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
                  />
                  <span className="text-sm">
                    {formData.available ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ NOVO: Campo de Modificadores */}
            <ModifierField
              modifiers={formData.modifiers || []}
              onChange={(modifiers) =>
                setFormData((prev) => ({ ...prev, modifiers }))
              }
            />

            {/* Action Buttons */}
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
                  <>{isAddingNew ? 'Adicionar Item' : 'Salvar Alterações'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};