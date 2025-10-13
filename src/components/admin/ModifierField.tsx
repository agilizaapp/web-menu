'use client';

import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IProductModifierGroup } from '@/types/admin/product.types';

interface ModifierFieldProps {
  modifiers: IProductModifierGroup[];
  onChange: (modifiers: IProductModifierGroup[]) => void;
}

export const ModifierField: React.FC<ModifierFieldProps> = ({
  modifiers,
  onChange,
}) => {
  const addModifierGroup = () => {
    const newGroup: IProductModifierGroup = {
      id: `modifier-${Date.now()}`,
      name: '',
      type: 'single',
      required: false,
      options: [],
    };
    onChange([...modifiers, newGroup]);
  };

  const removeModifierGroup = (groupId: string) => {
    onChange(modifiers.filter((g) => g.id !== groupId));
  };

  const updateModifierGroup = (
    groupId: string,
    updates: Partial<IProductModifierGroup>
  ) => {
    onChange(
      modifiers.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    );
  };

  const addOption = (groupId: string) => {
    const newOption = {
      id: `option-${Date.now()}`,
      name: '',
      price: 0,
      available: true,
    };

    onChange(
      modifiers.map((g) =>
        g.id === groupId
          ? { ...g, options: [...g.options, newOption] }
          : g
      )
    );
  };

  const removeOption = (groupId: string, optionId: string) => {
    onChange(
      modifiers.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<IProductModifierGroup['options'][0]>
  ) => {
    onChange(
      modifiers.map((g) =>
        g.id === groupId
          ? {
            ...g,
            options: g.options.map((o) =>
              o.id === optionId ? { ...o, ...updates } : o
            ),
          }
          : g
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Variações do Produto</Label>
          <p className="text-sm text-muted-foreground">
            Adicione opções como tamanho, sabor, adicionais, etc.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addModifierGroup}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Grupo
        </Button>
      </div>

      {modifiers.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            Nenhuma variação adicionada
          </p>
          <p className="text-xs text-muted-foreground">
            Clique em "Adicionar Grupo" para criar variações
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {modifiers.map((group, groupIndex) => (
            <Card key={group.id} className="p-4 space-y-4">
              {/* Grupo Header */}
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />

                <div className="flex-1 space-y-3">
                  {/* Nome do Grupo e Tipo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`group-name-${group.id}`}>
                        Nome do Grupo *
                      </Label>
                      <Input
                        id={`group-name-${group.id}`}
                        placeholder="Ex: Tamanho, Sabor, Adicionais"
                        value={group.name}
                        onChange={(e) =>
                          updateModifierGroup(group.id, {
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`group-type-${group.id}`}>
                        Tipo de Seleção
                      </Label>
                      <Select
                        value={group.type}
                        onValueChange={(value) =>
                          updateModifierGroup(group.id, {
                            type: value as 'single' | 'multiple',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">
                            Seleção única
                          </SelectItem>
                          <SelectItem value="multiple">
                            Múltipla seleção
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Opções do Grupo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Opções</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(group.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Opção
                      </Button>
                    </div>

                    {group.options.length === 0 ? (
                      <div className="text-center py-4 border border-dashed rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          Nenhuma opção adicionada
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {group.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg"
                          >
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input
                                placeholder="Nome da opção"
                                value={option.name}
                                onChange={(e) =>
                                  updateOption(group.id, option.id, {
                                    name: e.target.value,
                                  })
                                }
                                className="bg-background"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Preço adicional (R$)"
                                value={option.price || ''}
                                onChange={(e) =>
                                  updateOption(group.id, option.id, {
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="bg-background"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeOption(group.id, option.id)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Configurações Adicionais */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={group.required}
                        onCheckedChange={(checked) =>
                          updateModifierGroup(group.id, {
                            required: checked,
                          })
                        }
                      />
                      <Label className="text-sm cursor-pointer">
                        Seleção obrigatória
                      </Label>
                    </div>

                    {group.type === 'multiple' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Label className="text-xs text-muted-foreground">
                          Mín:
                        </Label>
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={group.minSelection || ''}
                          onChange={(e) =>
                            updateModifierGroup(group.id, {
                              minSelection: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <Label className="text-xs text-muted-foreground">
                          Máx:
                        </Label>
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={group.maxSelection || ''}
                          onChange={(e) =>
                            updateModifierGroup(group.id, {
                              maxSelection: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeModifierGroup(group.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};