import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
  TextInput, 
  List, 
  Chip,
  useTheme,
  FAB,
  Searchbar
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '../../contexts/DatabaseContext';
import BarcodeScanner from '../../components/BarcodeScanner';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  minStock: number;
}

export default function InventoryScreen() {
  const theme = useTheme();
  const { getProducts, addProduct, updateProduct, getProductByBarcode } = useDatabase();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Mobile Phones', 'Accessories', 'Tablets', 'Cases'];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      const productList = await getProducts();
      setProducts(productList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode);
      if (product) {
        // Navigate to product details or edit
        Alert.alert('Product Found', `${product.name}\nStock: ${product.stock}`, [
          { text: 'OK' },
          { text: 'Edit', onPress: () => editProduct(product) }
        ]);
      } else {
        Alert.alert('Product Not Found', 'Would you like to add this product?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Product', onPress: () => addNewProduct(barcode) }
        ]);
      }
      setShowScanner(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan barcode');
    }
  };

  const addNewProduct = (barcode?: string) => {
    router.push({
      pathname: '/add-product',
      params: { barcode: barcode || '' }
    });
  };

  const editProduct = (product: Product) => {
    router.push({
      pathname: '/edit-product',
      params: { productId: product.id }
    });
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { label: 'Out of Stock', color: theme.colors.error };
    } else if (product.stock <= product.minStock) {
      return { label: 'Low Stock', color: theme.colors.tertiary };
    } else {
      return { label: 'In Stock', color: theme.colors.primary };
    }
  };

  if (showScanner) {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Inventory Management
        </Title>
        
        {/* Search */}
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
            >
              {category === 'all' ? 'All Categories' : category}
            </Chip>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button 
            mode="outlined" 
            onPress={() => setShowScanner(true)}
            icon="qr-code-scanner"
            style={styles.actionButton}
          >
            Scan Product
          </Button>
          <Button 
            mode="contained" 
            onPress={() => addNewProduct()}
            icon="plus"
            style={styles.actionButton}
          >
            Add Product
          </Button>
        </View>
      </View>

      {/* Products List */}
      <ScrollView style={styles.productsList}>
        {filteredProducts.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="inventory" size={64} color={theme.colors.onSurfaceVariant} />
              <Title style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                No Products Found
              </Title>
              <Button 
                mode="contained" 
                onPress={() => addNewProduct()}
                style={styles.addFirstProductButton}
              >
                Add Your First Product
              </Button>
            </Card.Content>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Card key={product.id} style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
                <List.Item
                  title={product.name}
                  description={`৳${product.price.toFixed(2)} • ${product.category}`}
                  left={(props) => (
                    <View style={styles.productIcon}>
                      <MaterialIcons name="inventory-2" size={24} color={theme.colors.primary} />
                    </View>
                  )}
                  right={() => (
                    <View style={styles.productActions}>
                      <Chip 
                        style={[styles.stockChip, { backgroundColor: stockStatus.color + '20' }]}
                        textStyle={{ color: stockStatus.color }}
                      >
                        {product.stock} in stock
                      </Chip>
                      <Button 
                        mode="text" 
                        onPress={() => editProduct(product)}
                        compact
                      >
                        Edit
                      </Button>
                    </View>
                  )}
                  onPress={() => editProduct(product)}
                />
                {product.barcode && (
                  <Card.Content style={styles.barcodeSection}>
                    <Chip icon="qr-code" style={styles.barcodeChip}>
                      {product.barcode}
                    </Chip>
                  </Card.Content>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => addNewProduct()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    marginTop: 32,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  addFirstProductButton: {
    marginTop: 16,
  },
  productCard: {
    marginBottom: 8,
    elevation: 1,
  },
  productIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  productActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stockChip: {
    marginBottom: 4,
  },
  barcodeSection: {
    paddingTop: 0,
    paddingBottom: 12,
  },
  barcodeChip: {
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});