
export interface StockItem {
  id: string;
  content: string;
}

export interface Product {
  id: string;
  name: string;
  icon: string;
  stock: StockItem[];
}

export interface Key {
  id: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'ADMIN';

export const ADMIN_KEY = 'adminkey777';
