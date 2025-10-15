'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { MenuItem } from '@/types/entities.types';
import type {
  IProductPayload,
  IProductModifierGroup,
} from '@/types/admin/product.types';
import { ProductService } from '@/services/admin/product.service';
import { ApiError } from '@/lib/utils/api-error';
import { ModifierField } from './ModifierField';
import { ImageUpload } from './ImageUpload';

interface ProductModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productData?: MenuItem; // ✅ NOVO: Recebe dados completos do produto
  categories: string[];
  onClose: () => void;
  onSave: (product: MenuItem) => void;
}

interface ProductFormData {
  id?: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  modifiers: IProductModifierGroup[];
}

const INITIAL_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  image: '',
  available: true,
  modifiers: [],
};

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  mode,
  productData, // ✅ NOVO: Recebe dados via props
  categories,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ ATUALIZADO: Preencher formulário com dados das props
  useEffect(() => {
    if (isOpen && mode === 'edit' && productData) {
      console.log('✏️ Carregando dados do produto para edição:', productData.name);

      setFormData({
        id: productData.id,
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        image: productData.image || '',
        available: productData.available,
        modifiers: (productData.modifiers as IProductModifierGroup[]) || [],
      });
    } else if (isOpen && mode === 'create') {
      console.log('➕ Modo criação - formulário vazio');
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen, mode, productData]);

  // ✅ Validação do formulário
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return false;
    }

    if (!formData.category.trim()) {
      toast.error('Categoria é obrigatória');
      return false;
    }

    if (formData.price <= 0) {
      toast.error('Preço deve ser maior que zero');
      return false;
    }

    if (!formData.image.trim()) {
      toast.error('Imagem do produto é obrigatória');
      return false;
    }

    return true;
  };

  // Salvar produto (criar ou editar)
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload: IProductPayload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        image: formData.image,
        available: formData.available,
        modifiers: formData.modifiers,
      };

      if (mode === 'edit' && formData.id) {
        const response = await ProductService.updateProduct(formData.id, payload);

        const updatedProduct: MenuItem = {
          id: response.product.id,
          name: response.product.name,
          description: response.product.description,
          category: response.product.category,
          price: response.product.price / 100, // ✅ Converter centavos para reais
          image: response.product.image,
          available: response.product.available,
          modifiers: formData.modifiers, // Mantém modificadores do form
        };

        onSave(updatedProduct);
        toast.success('✅ Produto atualizado com sucesso');
      } else {
        // ✅ CRIAR novo produto
        console.log('📤 Criando novo produto');
        const response = await ProductService.createProduct(payload);

        const newProduct: MenuItem = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          category: response.data.category,
          price: response.data.price,
          image: response.data.image,
          available: response.data.available,
          modifiers: response.data.modifiers,
        };

        onSave(newProduct);
        toast.success('✅ Produto criado com sucesso');
      }

      // Fechar modal após sucesso
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);

      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao salvar produto');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Fechar modal e resetar formulário
  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Novo Produto' : 'Editar Produto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie um novo produto com foto, preço e variações.'
              : 'Atualize os detalhes do produto.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Foto do Produto *</Label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              disabled={isSaving}
            />
          </div>

          {/* Nome e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
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
              value={formData.description}
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
                value={formData.category}
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
              {categories.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Categorias existentes:</span>{' '}
                  {categories.map((cat, idx) => (
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
                      {idx < categories.length - 1 && ','}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Disponibilidade</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={formData.available}
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
            modifiers={formData.modifiers}
            onChange={(modifiers) =>
              setFormData((prev) => ({ ...prev, modifiers }))
            }
          />

          {/* Botões de Ação */}
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>{mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}</>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};