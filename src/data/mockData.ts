import { IStoreConfigs, Order } from '@/types/index';
import { MenuItem, MenuCategory, Restaurant } from '@/types/entities.types';


const restaurant: {
  products: MenuItem[];
  categories: MenuCategory[] | string[];
  store: IStoreConfigs;
} = {
  "store": {
    "name": "Lelek's Food",
    "type": "restaurant",
    "configs": {
      "theme": {
        "logo": "https://natelhacupimrestaurante.com.br/wp-content/uploads/2020/02/Co%CC%81pia-de-Co%CC%81pia-de-Logotipos-Natelha-Cupim-sem-fundo-1-150x75.png",
        "primaryColor": "#DC2626",
        "secondaryColor": "#FEF2F2",
        "accentColor": "#FBBF24"
      },
      "settings": {
        "hours": "11:00 - 23:00",
        "useCustomHours": true,
        "customHours": {
          "monday": {
            "open": "11:00",
            "close": "23:00",
            "closed": false
          },
          "tuesday": {
            "open": "11:00",
            "close": "23:00",
            "closed": false
          },
          "wednesday": {
            "open": "11:00",
            "close": "23:00",
            "closed": false
          },
          "thursday": {
            "open": "11:00",
            "close": "23:00",
            "closed": false
          },
          "friday": {
            "open": "11:00",
            "close": "23:00",
            "closed": false
          },
          "saturday": {
            "open": "12:00",
            "close": "00:00",
            "closed": false
          },
          "sunday": {
            "open": "12:00",
            "close": "22:00",
            "closed": false
          }
        },
        "deliveryFee": 5,
        "deliveryZones": [
          "Centro",
          "Zona Sul",
          "Zona Norte"
        ],
        "pixKey": "rychard.souza1111@gmail.com"
      }
    }
  },
  "categories": [
    "Pizzas"
  ],
  "products": [
    {
      "id": 1,
      "name": "Pizza Margherita",
      "description": "Pizza clássica com mussarela fresca, molho de tomate e manjericão",
      "category": "Pizzas",
      "price": 18.99,
      "available": true,
      "modifiers": [
        {
          "id": "size",
          "name": "Tamanho",
          "type": "single",
          "required": true,
          "options": [
            {
              "id": "small",
              "name": "Pequena (30cm)",
              "price": 0
            },
            {
              "id": "medium",
              "name": "Média (35cm)",
              "price": 3
            }
          ]
        }
      ]
    },
    {
      "id": 2,
      "name": "Marmita da Casa (Pequena)",
      "description": "Marmita da Casa seguindo o cardápio semanal. Peso: aprox. 340g",
      "image": "https://images.unsplash.com/photo-1667207394004-acb6aaf4790e",
      "category": "Marmitas",
      "price": 20,
      "available": true
    },
    {
      "id": 3,
      "name": "Marmita da Casa (Média)",
      "description": "Marmita da Casa seguindo o cardápio semanal. Peso: aprox. 530g",
      "image": "https://images.unsplash.com/photo-1667207394004-acb6aaf4790e",
      "category": "Marmitas",
      "price": 25,
      "available": true
    },
    {
      "id": 4,
      "name": "Marmita da Casa (Grande)",
      "description": "Marmita da Casa seguindo o cardápio semanal. Peso: aprox. 1,04kg",
      "image": "https://images.unsplash.com/photo-1667207394004-acb6aaf4790e",
      "category": "Marmitas",
      "price": 30,
      "available": true
    }
  ]
};

export const mockRestaurantData: Restaurant = {
  id: 1,
  name: restaurant.store.name || "",
  theme: {
    name: restaurant.store.name,
    logo: restaurant.store.configs.theme.logo,
    primaryColor: restaurant.store.configs.theme.primaryColor,
    secondaryColor: restaurant.store.configs.theme.secondaryColor,
    accentColor: restaurant.store.configs.theme.accentColor,
  },
  settings: {
    hours: restaurant.store.configs.settings.hours,
    useCustomHours: restaurant.store.configs.settings.useCustomHours,
    customHours: restaurant.store.configs.settings.customHours,
    deliverySettings: restaurant.store.configs.settings.deliverySettings || [],
    deliveryZones: restaurant.store.configs.settings.deliveryZones,
    pixKey: restaurant.store.configs.settings.pixKey,
  },
  menu: restaurant.products as MenuItem[],
};

export const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Palácio da Pizza',
    theme: {
      name: 'Palácio da Pizza',
      logo: '🍕',
      primaryColor: '#DC2626',
      secondaryColor: '#FEF2F2',
      accentColor: '#FBBF24'
    },
    settings: {
      hours: '11:00 - 23:00',
      useCustomHours: true,
      customHours: {
        monday: { open: '11:00', close: '23:00', closed: false },
        tuesday: { open: '11:00', close: '23:00', closed: false },
        wednesday: { open: '11:00', close: '23:00', closed: false },
        thursday: { open: '11:00', close: '23:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '12:00', close: '00:00', closed: false },
        sunday: { open: '12:00', close: '22:00', closed: false }
      },
      deliverySettings: [
        { distance: 5000, value: 10 },
        { distance: 3000, value: 7 },
        { distance: 0, value: 5 }
      ],
      deliveryZones: ['Centro', 'Zona Sul', 'Zona Norte'],
      pixKey: 'pizzapalace@bank.com'
    },
    menu: []
  },
  {
    id: 2,
    name: 'Casa do Sushi',
    theme: {
      name: 'Casa do Sushi',
      logo: '🍣',
      primaryColor: '#065F46',
      secondaryColor: '#ECFDF5',
      accentColor: '#10B981'
    },
    settings: {
      hours: '12:00 - 22:00',
      useCustomHours: true,
      customHours: {
        monday: { open: '00:00', close: '00:00', closed: true },
        tuesday: { open: '12:00', close: '22:00', closed: false },
        wednesday: { open: '12:00', close: '22:00', closed: false },
        thursday: { open: '12:00', close: '22:00', closed: false },
        friday: { open: '12:00', close: '22:00', closed: false },
        saturday: { open: '12:00', close: '23:00', closed: false },
        sunday: { open: '12:00', close: '20:00', closed: false }
      },
      deliverySettings: [
        { distance: 5000, value: 12 },
        { distance: 3000, value: 10 },
        { distance: 0, value: 8 }
      ],
      deliveryZones: ['Centro', 'Bairro Comercial'],
      pixKey: 'sushihouse@bank.com'
    },
    menu: []
  },
  {
    id: 3,
    name: 'Burger Grill',
    theme: {
      name: 'Burger Grill',
      logo: '🍔',
      primaryColor: '#7C2D12',
      secondaryColor: '#FEF7F0',
      accentColor: '#EA580C'
    },
    settings: {
      hours: '10:00 - 00:00',
      useCustomHours: false,
      deliverySettings: [
        { distance: 5000, value: 7 },
        { distance: 3000, value: 5 },
        { distance: 0, value: 3.50 }
      ],
      deliveryZones: ['Todas as Regiões'],
      pixKey: 'burgerbarn@bank.com'
    },
    menu: []
  }
];

export const mockMenuItems: MenuItem[] = [
  // Pizza Palace Items
  {
    id: 1,
    name: 'Pizza Margherita',
    description: 'Pizza clássica com mussarela fresca, molho de tomate e manjericão',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1667207394004-acb6aaf4790e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBwaXp6YSUyMG1hcmdoZXJpdGF8ZW58MXx8fHwxNzU4OTYyMzM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Pizzas',
    available: true,
    isHighlighted: true,
    highlightType: 'chef-recommendation',
    highlightLabel: 'Recomendação do Chefe',
    orderCount: 156,
    modifiers: [
      {
        id: 'size',
        name: 'Tamanho',
        type: 'single',
        required: true,
        options: [
          { id: 'small', name: 'Pequena (30cm)', price: 0 },
          { id: 'medium', name: 'Média (35cm)', price: 3 },
          { id: 'large', name: 'Grande (40cm)', price: 6 }
        ]
      },
      {
        id: 'extras',
        name: 'Adicionais',
        type: 'multiple',
        required: false,
        options: [
          { id: 'cheese', name: 'Queijo Extra', price: 2 },
          { id: 'pepperoni', name: 'Calabresa', price: 3 },
          { id: 'mushrooms', name: 'Champignon', price: 2 }
        ]
      }
    ]
  },
  // Sushi House Items
  {
    id: 2,
    name: 'Roll de Salmão com Abacate',
    description: 'Salmão fresco e abacate com pepino, coberto com gergelim',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1628676825875-031ad212c31e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHN1c2hpJTIwcm9sbHN8ZW58MXx8fHwxNzU4OTUwOTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Rolls',
    available: true,
    isHighlighted: true,
    highlightType: 'popular',
    highlightLabel: 'Mais Pedido',
    orderCount: 203,
    modifiers: [
      {
        id: 'spicy',
        name: 'Nível de Picância',
        type: 'single',
        required: false,
        options: [
          { id: 'mild', name: 'Suave', price: 0 },
          { id: 'medium', name: 'Médio', price: 0 },
          { id: 'hot', name: 'Picante', price: 0 }
        ]
      }
    ]
  },
  // Burger Barn Items  
  {
    id: 3,
    name: 'Cheeseburger Clássico',
    description: 'Hambúrguer de carne com queijo, alface, tomate, cebola e nosso molho especial',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZnJpZXN8ZW58MXx8fHwxNzU5MDAzNjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Hambúrgueres',
    available: true,
    isHighlighted: true,
    highlightType: 'promotion',
    highlightLabel: 'Promoção',
    orderCount: 89,
    modifiers: [
      {
        id: 'temperature',
        name: 'Ponto da Carne',
        type: 'single',
        required: true,
        options: [
          { id: 'rare', name: 'Mal Passado', price: 0 },
          { id: 'medium', name: 'Ao Ponto', price: 0 },
          { id: 'well', name: 'Bem Passado', price: 0 }
        ]
      },
      {
        id: 'sides',
        name: 'Escolha um Acompanhamento',
        type: 'single',
        required: true,
        options: [
          { id: 'fries', name: 'Batata Frita', price: 0 },
          { id: 'onion-rings', name: 'Anéis de Cebola', price: 2 },
          { id: 'salad', name: 'Salada', price: 1 }
        ]
      }
    ]
  },
  // Additional items for variety
  {
    id: 4,
    name: 'Macarrão à Carbonara',
    description: 'Massa cremosa com bacon, queijo parmesão e pimenta preta',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGNhcmJvbmFyYSUyMHBsYXRlfGVufDF8fHx8MTc1OTAwMzY2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Massas',
    available: true
  },
  {
    id: 5,
    name: 'Salada Caesar',
    description: 'Alface romana fresca com parmesão, croutons e molho caesar',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1739436776460-35f309e3f887?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWVzYXIlMjBzYWxhZCUyMGZyZXNofGVufDF8fHx8MTc1ODk4MjYzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Saladas',
    available: true
  },
  {
    id: 6,
    name: 'Bolo de Chocolate',
    description: 'Bolo de chocolate rico com ganache de chocolate e frutas vermelhas frescas',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1736840334919-aac2d5af73e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwsfHx8fDE3NTg5MTI2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'Sobremesas',
    available: true
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    items: [
      {
        id: 'item-1',
        menuItem: mockMenuItems[0],
        quantity: 1,
        selectedModifiers: {
          size: ['medium'],
          extras: ['cheese', 'pepperoni']
        },
        totalPrice: 26.99
      }
    ],
    customerInfo: {
      name: 'João Silva',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123 - Centro'
    },
    deliveryType: 'delivery',
    status: 'pending',
    totalAmount: 31.99,
    createdAt: new Date(),
    paymentMethod: 'pix',
    paymentStatus: 'pending'
  }
];