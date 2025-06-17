import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Plus, Star, ShoppingCart, TrendingUp, Package } from 'lucide-react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const categories = ['All', 'Electronics', 'Clothing', 'Food', 'Books', 'Home'];

  const products = [
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 129.99,
      category: 'Electronics',
      rating: 4.5,
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 15,
      description: 'Premium wireless headphones with noise cancellation',
      sales: 234
    },
    {
      id: '2',
      name: 'Cotton T-Shirt',
      price: 24.99,
      category: 'Clothing',
      rating: 4.2,
      image: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 32,
      description: '100% organic cotton t-shirt, comfortable fit',
      sales: 156
    },
    {
      id: '3',
      name: 'Coffee Beans',
      price: 18.50,
      category: 'Food',
      rating: 4.8,
      image: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 8,
      description: 'Premium arabica coffee beans, freshly roasted',
      sales: 89
    },
    {
      id: '4',
      name: 'Smart Watch',
      price: 299.99,
      category: 'Electronics',
      rating: 4.6,
      image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 12,
      description: 'Advanced fitness tracking and smart notifications',
      sales: 67
    },
    {
      id: '5',
      name: 'Leather Jacket',
      price: 189.99,
      category: 'Clothing',
      rating: 4.4,
      image: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 6,
      description: 'Genuine leather jacket with modern styling',
      sales: 43
    },
    {
      id: '6',
      name: 'Programming Book',
      price: 45.99,
      category: 'Books',
      rating: 4.7,
      image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
      stock: 20,
      description: 'Complete guide to modern web development',
      sales: 112
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={12} color="#FFD700" fill="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={12} color="#FFD700" fill="#FFD700" style={{ opacity: 0.5 }} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={12} color="#E5E7EB" />);
    }

    return stars;
  };

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.sales), 0);
  const lowStockCount = products.filter(product => product.stock < 10).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Products</Text>
            <Text style={styles.headerSubtitle}>{totalProducts} items in inventory</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={triggerHapticFeedback}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.addButtonGradient}
            >
              <Plus size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#34D39920' }]}>
              <Package size={20} color="#34D399" />
            </View>
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#60A5FA20' }]}>
              <TrendingUp size={20} color="#60A5FA" />
            </View>
            <Text style={styles.statValue}>${totalValue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#F4444420' }]}>
              <Package size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#64748B"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={triggerHapticFeedback}
          >
            <Filter size={20} color="#667EEA" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategory(category);
                triggerHapticFeedback();
              }}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.productsContainer}>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={triggerHapticFeedback}
                activeOpacity={0.8}
              >
                <View style={styles.productImageContainer}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={[
                    styles.stockBadge,
                    { backgroundColor: product.stock < 10 ? '#EF4444' : '#34D399' }
                  ]}>
                    <Text style={styles.stockText}>{product.stock} left</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={triggerHapticFeedback}
                  >
                    <Star size={16} color="#FFD700" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                  
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {renderStars(product.rating)}
                    </View>
                    <Text style={styles.ratingText}>({product.rating})</Text>
                  </View>

                  <View style={styles.salesInfo}>
                    <Text style={styles.salesText}>{product.sales} sold</Text>
                  </View>
                  
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>${product.price}</Text>
                    <TouchableOpacity 
                      style={styles.addToCartButton}
                      onPress={triggerHapticFeedback}
                    >
                      <ShoppingCart size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryTextActive: {
    color: 'white',
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  salesInfo: {
    marginBottom: 12,
  },
  salesText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addToCartButton: {
    width: 32,
    height: 32,
    backgroundColor: '#34D399',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});