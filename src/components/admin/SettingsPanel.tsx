import React, { useState } from 'react';
import { Save, Palette, Clock, MapPin, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRestaurantStore } from '@/stores';
import { toast } from 'sonner';
import type { WeeklySchedule, DaySchedule } from '@/types';

const defaultSchedule: WeeklySchedule = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true }
};

export const SettingsPanel: React.FC = () => {
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantStore();
  const [formData, setFormData] = useState({
    name: currentRestaurant?.name || '',
    hours: currentRestaurant?.settings?.hours || '',
    useCustomHours: currentRestaurant?.settings?.useCustomHours || false,
    customHours: currentRestaurant?.settings?.customHours || defaultSchedule,
    pixKey: currentRestaurant?.settings?.pixKey || '',
    primaryColor: currentRestaurant?.theme.primaryColor || '#DC2626',
    secondaryColor: currentRestaurant?.theme.secondaryColor || '#FEF2F2',
    accentColor: currentRestaurant?.theme.accentColor || '#FBBF24',
    logo: currentRestaurant?.theme.logo || '🍕'
  });

  const handleSave = (section: string) => {
    if (!currentRestaurant) return;

    // Update the restaurant data
    const updatedRestaurant = {
      ...currentRestaurant,
      name: formData.name,
      theme: {
        ...currentRestaurant?.theme,
        name: formData.name,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        logo: formData.logo
      },
      settings: {
        ...currentRestaurant?.settings,
        hours: formData.hours,
        useCustomHours: formData.useCustomHours,
        customHours: formData.customHours,
        pixKey: formData.pixKey
      }
    };

    setCurrentRestaurant(updatedRestaurant);
    toast.success(`Configurações de ${section} salvas com sucesso`);
  };

  const updateDaySchedule = (day: keyof WeeklySchedule, field: keyof DaySchedule, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      customHours: {
        ...prev.customHours,
        [day]: {
          ...prev.customHours[day],
          [field]: value
        }
      }
    }));
  };

  const dayNames: { key: keyof WeeklySchedule; label: string }[] = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const presetThemes = [
    {
      name: 'Palácio da Pizza',
      logo: '🍕',
      primaryColor: '#DC2626',
      secondaryColor: '#FEF2F2',
      accentColor: '#FBBF24'
    },
    {
      name: 'Casa do Sushi',
      logo: '🍣',
      primaryColor: '#065F46',
      secondaryColor: '#ECFDF5',
      accentColor: '#10B981'
    },
    {
      name: 'Burger Grill',
      logo: '🍔',
      primaryColor: '#7C2D12',
      secondaryColor: '#FEF7F0',
      accentColor: '#EA580C'
    },
    {
      name: 'Taco Express',
      logo: '🌮',
      primaryColor: '#B91C1C',
      secondaryColor: '#FEF2F2',
      accentColor: '#F59E0B'
    },
    {
      name: 'Casa da Massa',
      logo: '🍝',
      primaryColor: '#059669',
      secondaryColor: '#ECFDF5',
      accentColor: '#F59E0B'
    }
  ];

  const applyTheme = (theme: typeof presetThemes[0]) => {
    setFormData(prev => ({
      ...prev,
      logo: theme.logo,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Configurações</h2>
        <p className="text-muted-foreground">
          Configure as definições e marca do seu restaurante
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Marca do Restaurante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Preview */}
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: formData.secondaryColor,
                borderColor: formData.primaryColor
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{formData.logo}</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: formData.primaryColor }}>
                      {formData.name || 'Nome do Restaurante'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Visualização ao Vivo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="px-3 py-1 rounded text-white text-sm"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Primária
                  </div>
                  <div 
                    className="px-3 py-1 rounded text-white text-sm"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Destaque
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Restaurante</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu Restaurante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo Emoji</Label>
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="🍕"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Color Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#DC2626"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#FEF2F2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#FBBF24"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Themes */}
              <div className="space-y-3">
                <Label>Temas Pré-definidos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {presetThemes.map(theme => (
                    <Button
                      key={theme.name}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2"
                      onClick={() => applyTheme(theme)}
                    >
                      <span className="text-xl">{theme.logo}</span>
                      <span className="text-xs text-center">{theme.name}</span>
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={() => handleSave('Marca')} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações de Marca
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configurações Operacionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horário Simples ou Personalizado */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label>Usar Horário Personalizado</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure horários diferentes para cada dia da semana
                  </p>
                </div>
                <Switch
                  checked={formData.useCustomHours}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useCustomHours: checked }))}
                />
              </div>

              {!formData.useCustomHours ? (
                <div className="space-y-2">
                  <Label htmlFor="hours">Horário de Funcionamento</Label>
                  <Input
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                    placeholder="11:00 - 23:00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Horário geral aplicado a todos os dias
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Horários por Dia da Semana</Label>
                  <div className="space-y-3">
                    {dayNames.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-32 flex-shrink-0">
                          <span className="font-medium">{label}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1">
                          {!formData.customHours[key].closed ? (
                            <>
                              <Input
                                type="time"
                                value={formData.customHours[key].open}
                                onChange={(e) => updateDaySchedule(key, 'open', e.target.value)}
                                className="w-32"
                              />
                              <span className="text-muted-foreground">até</span>
                              <Input
                                type="time"
                                value={formData.customHours[key].close}
                                onChange={(e) => updateDaySchedule(key, 'close', e.target.value)}
                                className="w-32"
                              />
                            </>
                          ) : (
                            <Badge variant="secondary" className="ml-2">Fechado</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`closed-${key}`} className="text-sm cursor-pointer">
                            Fechado
                          </Label>
                          <Switch
                            id={`closed-${key}`}
                            checked={formData.customHours[key].closed}
                            onCheckedChange={(checked) => updateDaySchedule(key, 'closed', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => handleSave('Operações')} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações Operacionais
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configurações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  value={formData.pixKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixKey: e.target.value }))}
                  placeholder="restaurante@banco.com"
                />
                <p className="text-sm text-muted-foreground">
                  Sua chave PIX para receber pagamentos (email, telefone ou CPF)
                </p>
              </div>

              <Button onClick={() => handleSave('Pagamento')} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações de Pagamento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gerenciamento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gerenciamento de Usuários</h3>
                <p className="text-muted-foreground mb-4">
                  Gerencie contas e permissões da equipe do seu restaurante
                </p>
                <Button>Adicionar Novo Usuário</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};