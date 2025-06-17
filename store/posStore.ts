import { Product, CartItem, Transaction, Customer, Category } from '../types/pos';

class POSStore {
  private products: Product[] = [];
  private cart: CartItem[] = [];
  private transactions: Transaction[] = [];
  private customers: Customer[] = [];
  private categories: Category[] = [];
  private currentCustomer: Customer | null = null;

  constructor() {
    this.initializeStore();
  }

  private initializeStore() {
    // Initialize with sample data
    this.categories = [
      { id: '1', name: 'Electronics', color: '#3B82F6', icon: 'laptop' },
      { id: '2', name: 'Clothing', color: '#10B981', icon: 'shirt' },
      { id: '3', name: 'Food & Beverages', color: '#F59E0B', icon: 'coffee' },
      { id: '4', name: 'Books', color: '#8B5CF6', icon: 'book' },
      { id: '5', name: 'Home & Garden', color: '#EF4444', icon: 'home' },
    ];

    this.products = [
      {
        id: '1',
        name: 'Wireless Headphones',
        price: 129.99,
        category: 'Electronics',
        stock: 25,
        barcode: '1234567890123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Cotton T-Shirt',
        price: 24.99,
        category: 'Clothing',
        stock: 50,
        barcode: '1234567890124',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Premium Coffee Beans',
        price: 15.99,
        category: 'Food & Beverages',
        stock: 30,
        barcode: '1234567890125',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'Programming Guide',
        price: 39.99,
        category: 'Books',
        stock: 15,
        barcode: '1234567890126',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5',
        name: 'Indoor Plant Pot',
        price: 19.99,
        category: 'Home & Garden',
        stock: 20,
        barcode: '1234567890127',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.customers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        totalPurchases: 250.75,
        loyaltyPoints: 25,
        lastPurchase: new Date(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        totalPurchases: 180.50,
        loyaltyPoints: 18,
        lastPurchase: new Date(),
      },
    ];
  }

  // Product methods
  getProducts(): Product[] {
    return this.products;
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.products[index];
  }

  deleteProduct(id: string): boolean {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.products.splice(index, 1);
    return true;
  }

  // Cart methods
  getCart(): CartItem[] {
    return this.cart;
  }

  addToCart(product: Product, quantity: number = 1): void {
    const existingIndex = this.cart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += quantity;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].quantity * product.price;
    } else {
      this.cart.push({
        product,
        quantity,
        subtotal: quantity * product.price,
      });
    }
  }

  removeFromCart(productId: string): void {
    this.cart = this.cart.filter(item => item.product.id !== productId);
  }

  updateCartQuantity(productId: string, quantity: number): void {
    const index = this.cart.findIndex(item => item.product.id === productId);
    if (index >= 0) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.cart[index].quantity = quantity;
        this.cart[index].subtotal = quantity * this.cart[index].product.price;
      }
    }
  }

  clearCart(): void {
    this.cart = [];
  }

  getCartTotal(): number {
    return this.cart.reduce((total, item) => total + item.subtotal, 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Transaction methods
  processTransaction(paymentMethod: 'cash' | 'card' | 'digital', cashierName: string): Transaction {
    const subtotal = this.getCartTotal();
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      items: [...this.cart],
      subtotal,
      tax,
      total,
      paymentMethod,
      customer: this.currentCustomer,
      timestamp: new Date(),
      receiptNumber: `RCP-${Date.now()}`,
      cashier: cashierName,
    };

    this.transactions.push(transaction);
    
    // Update inventory
    this.cart.forEach(item => {
      this.updateProductStock(item.product.id, item.product.stock - item.quantity);
    });

    // Update customer loyalty points
    if (this.currentCustomer) {
      const points = Math.floor(total / 10); // 1 point per $10
      this.updateCustomerPoints(this.currentCustomer.id, points);
    }

    this.clearCart();
    this.currentCustomer = null;
    
    return transaction;
  }

  private updateProductStock(productId: string, newStock: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.stock = newStock;
      product.updatedAt = new Date();
    }
  }

  private updateCustomerPoints(customerId: string, points: number): void {
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      customer.loyaltyPoints += points;
      customer.lastPurchase = new Date();
    }
  }

  getTransactions(): Transaction[] {
    return this.transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Customer methods
  getCustomers(): Customer[] {
    return this.customers;
  }

  setCurrentCustomer(customer: Customer | null): void {
    this.currentCustomer = customer;
  }

  getCurrentCustomer(): Customer | null {
    return this.currentCustomer;
  }

  addCustomer(customer: Omit<Customer, 'id' | 'totalPurchases' | 'loyaltyPoints'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      totalPurchases: 0,
      loyaltyPoints: 0,
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  // Categories
  getCategories(): Category[] {
    return this.categories;
  }

  // Reports
  getDailySales(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.transactions
      .filter(t => t.timestamp >= today)
      .reduce((total, t) => total + t.total, 0);
  }

  getWeeklySales(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return this.transactions
      .filter(t => t.timestamp >= weekAgo)
      .reduce((total, t) => total + t.total, 0);
  }

  getMonthlySales(): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return this.transactions
      .filter(t => t.timestamp >= monthAgo)
      .reduce((total, t) => total + t.total, 0);
  }

  getTopProducts(limit: number = 5) {
    const productSales = new Map<string, { product: Product; quantity: number; revenue: number }>();

    this.transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const existing = productSales.get(item.product.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productSales.set(item.product.id, {
            product: item.product,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  getLowStockProducts(threshold: number = 10): Product[] {
    return this.products.filter(product => product.stock <= threshold);
  }
}

export const posStore = new POSStore();