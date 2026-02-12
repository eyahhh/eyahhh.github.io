
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
  used: boolean;
  usedAt?: number;
}

export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName?: string;
  productIcon?: string;
  content: string;
  keyUsed: string;
  consumedAt: number;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'ADMIN';

export const ADMIN_KEY = 'adminkey777';
