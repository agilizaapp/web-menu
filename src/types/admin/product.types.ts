import { IOrderItemModifier } from './api.types';

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

export interface ICreateProductPayload {
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  available: boolean;
  modifiers?: IProductModifierGroup[];
}

export interface IUpdateProductPayload extends Partial<ICreateProductPayload> {
  id: number;
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