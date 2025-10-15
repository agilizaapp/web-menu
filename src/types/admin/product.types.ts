export interface IProductModifierOption {
  id: string;
  name: string;
  price: number;
  available?: boolean;
}

export interface IProductModifierGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  minSelection?: number;
  maxSelection?: number;
  options: IProductModifierOption[];
}

export interface IProductApiResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    image?: string;
    available: boolean;
    modifiers?: IProductModifierGroup[];
    created_at: string;
    updated_at: string;
  };
  message?: string;
}

export interface IProductPayload {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  modifiers?: IProductModifierGroup[];
}