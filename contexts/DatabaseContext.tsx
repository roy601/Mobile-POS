import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  initDatabase: () => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  getProducts: () => Promise<any[]>;
  getProductByBarcode: (barcode: string) => Promise<any>;
  updateProduct: (id: string, product: any) => Promise<void>;
  addCustomer: (customer: any) => Promise<void>;
  getCustomers: () => Promise<any[]>;
  updateCustomer: (id: string, customer: any) => Promise<void>;
  addSale: (sale: any) => Promise<void>;
  getSales: () => Promise<any[]>;
  getSalesAnalytics: () => Promise<any>;
  getTopProducts: () => Promise<any[]>;
  getCustomerAnalytics: () => Promise<any>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('mobilepos.db');
      setDb(database);

      // Create tables
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          barcode TEXT UNIQUE,
          price REAL NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          category TEXT,
          minStock INTEGER DEFAULT 5,
          description TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          address TEXT,
          customerType TEXT DEFAULT 'regular',
          totalPurchases REAL DEFAULT 0,
          lastPurchase TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          customerId TEXT,
          customerName TEXT,
          subtotal REAL NOT NULL,
          tax REAL NOT NULL,
          total REAL NOT NULL,
          paymentMethod TEXT,
          cashReceived REAL,
          change REAL,
          notes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
          id TEXT PRIMARY KEY,
          saleId TEXT NOT NULL,
          productId TEXT,
          productName TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          total REAL NOT NULL,
          FOREIGN KEY (saleId) REFERENCES sales (id)
        );

        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(createdAt);
      `);

      // Insert sample data if tables are empty
      const productCount = await database.getFirstAsync('SELECT COUNT(*) as count FROM products');
      if ((productCount as any)?.count === 0) {
        await insertSampleData(database);
      }

    } catch (error) {
      console.error('Database initialization error:', error);
    }
  };

  const insertSampleData = async (database: SQLite.SQLiteDatabase) => {
    try {
      await database.execAsync(`
        INSERT INTO products (id, name, barcode, price, stock, category, minStock, description) VALUES
        ('1', 'Samsung Galaxy A54', '8801234567890', 42000, 25, 'Mobile Phones', 5, 'Samsung Galaxy A54 5G Smartphone'),
        ('2', 'iPhone 14', '8801234567891', 95000, 15, 'Mobile Phones', 5, 'Apple iPhone 14 128GB'),
        ('3', 'Xiaomi Redmi Note 12', '8801234567892', 32000, 30, 'Mobile Phones', 5, 'Xiaomi Redmi Note 12 Pro'),
        ('4', 'Phone Case Universal', '8801234567893', 300, 100, 'Accessories', 20, 'Universal Phone Protection Case'),
        ('5', 'Screen Protector', '8801234567894', 200, 150, 'Accessories', 30, 'Tempered Glass Screen Protector');

        INSERT INTO customers (id, name, phone, email, customerType, totalPurchases) VALUES
        ('1', 'আহমেদ হাসান', '+8801712345678', 'ahmed.hasan@email.com', 'regular', 42000),
        ('2', 'ফাতেমা খাতুন', '+8801812345679', 'fatema.khatun@email.com', 'vip', 95000),
        ('3', 'মোহাম্মদ রহিম', '+8801912345680', 'mohammad.rahim@email.com', 'wholesale', 64000);
      `);
    } catch (error) {
      console.error('Sample data insertion error:', error);
    }
  };

  const addProduct = async (product: any) => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    await db.runAsync(
      'INSERT INTO products (id, name, barcode, price, stock, category, minStock, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, product.name, product.barcode, product.price, product.stock, product.category, product.minStock || 5, product.description || '']
    );
  };

  const getProducts = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.getAllAsync('SELECT * FROM products ORDER BY name');
    return result;
  };

  const getProductByBarcode = async (barcode: string) => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.getFirstAsync('SELECT * FROM products WHERE barcode = ?', [barcode]);
    return result;
  };

  const updateProduct = async (id: string, product: any) => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync(
      'UPDATE products SET name = ?, barcode = ?, price = ?, stock = ?, category = ?, minStock = ?, description = ? WHERE id = ?',
      [product.name, product.barcode, product.price, product.stock, product.category, product.minStock, product.description, id]
    );
  };

  const addCustomer = async (customer: any) => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    await db.runAsync(
      'INSERT INTO customers (id, name, phone, email, address, customerType) VALUES (?, ?, ?, ?, ?, ?)',
      [id, customer.name, customer.phone, customer.email || '', customer.address || '', customer.customerType || 'regular']
    );
  };

  const getCustomers = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.getAllAsync('SELECT * FROM customers ORDER BY name');
    return result;
  };

  const updateCustomer = async (id: string, customer: any) => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, customerType = ? WHERE id = ?',
      [customer.name, customer.phone, customer.email, customer.address, customer.customerType, id]
    );
  };

  const addSale = async (sale: any) => {
    if (!db) throw new Error('Database not initialized');
    
    const saleId = Date.now().toString();
    
    // Insert sale
    await db.runAsync(
      'INSERT INTO sales (id, customerId, customerName, subtotal, tax, total, paymentMethod, cashReceived, change, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        saleId,
        sale.customer?.id || null,
        sale.customer?.name || '',
        sale.subtotal,
        sale.tax,
        sale.total,
        sale.paymentMethod,
        sale.cashReceived,
        sale.change,
        sale.notes || ''
      ]
    );

    // Insert sale items
    for (const item of sale.items) {
      const itemId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.runAsync(
        'INSERT INTO sale_items (id, saleId, productId, productName, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [itemId, saleId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );

      // Update product stock
      await db.runAsync(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    // Update customer total purchases
    if (sale.customer?.id) {
      await db.runAsync(
        'UPDATE customers SET totalPurchases = totalPurchases + ?, lastPurchase = CURRENT_TIMESTAMP WHERE id = ?',
        [sale.total, sale.customer.id]
      );
    }
  };

  const getSales = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.getAllAsync('SELECT * FROM sales ORDER BY createdAt DESC');
    return result;
  };

  const getSalesAnalytics = async () => {
    if (!db) throw new Error('Database not initialized');
    
    // This would return real analytics data
    return {
      totalSales: 45231,
      totalOrders: 573,
      averageOrderValue: 456,
      growthRate: 20.1
    };
  };

  const getTopProducts = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.getAllAsync(`
      SELECT p.name, p.price, SUM(si.quantity) as totalSold, SUM(si.total) as revenue
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.productId
      GROUP BY p.id, p.name, p.price
      ORDER BY totalSold DESC
      LIMIT 10
    `);
    return result;
  };

  const getCustomerAnalytics = async () => {
    if (!db) throw new Error('Database not initialized');
    
    // This would return real customer analytics
    return {
      totalCustomers: 2350,
      repeatCustomers: 68,
      averageOrderValue: 456,
      churnRate: 12
    };
  };

  const value = {
    db,
    initDatabase,
    addProduct,
    getProducts,
    getProductByBarcode,
    updateProduct,
    addCustomer,
    getCustomers,
    updateCustomer,
    addSale,
    getSales,
    getSalesAnalytics,
    getTopProducts,
    getCustomerAnalytics,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}