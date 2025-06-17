export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  barcode?: string;
  stock: number;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  lastPurchase?: Date;
  loyaltyPoints: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  subtotal: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  customer?: Customer;
  timestamp: Date;
  receiptNumber: string;
  cashier: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  totalTransactions: number;
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
}