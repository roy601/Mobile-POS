import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
  TextInput, 
  List, 
  Divider, 
  useTheme,
  Chip,
  Surface
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '../../contexts/DatabaseContext';
import BarcodeScanner from '../../components/BarcodeScanner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function POSScreen() {
  const theme = useTheme();
  const { addSale, getProductByBarcode, getCustomers } = useDatabase();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const change = parseFloat(cashReceived) - total;

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode);
      if (product) {
        addToCart(product);
        setShowScanner(false);
      } else {
        Alert.alert('Product Not Found', 'No product found with this barcode. Would you like to add it manually?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Manually', onPress: () => addManualProduct(barcode) }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan barcode');
    }
  };

  const addManualProduct = (barcode?: string) => {
    Alert.prompt(
      'Add Product',
      'Enter product details:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (name) => {
            if (name) {
              Alert.prompt(
                'Product Price',
                'Enter price:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Add', 
                    onPress: (price) => {
                      if (price && !isNaN(parseFloat(price))) {
                        addToCart({
                          id: Date.now().toString(),
                          name,
                          price: parseFloat(price),
                          barcode
                        });
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const completeSale = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    if (parseFloat(cashReceived) < total) {
      Alert.alert('Error', 'Insufficient payment amount');
      return;
    }

    try {
      const saleData = {
        items: cartItems,
        customer,
        subtotal,
        tax,
        total,
        paymentMethod,
        cashReceived: parseFloat(cashReceived),
        change,
        notes
      };

      await addSale(saleData);
      
      Alert.alert('Success', 'Sale completed successfully!', [
        { text: 'OK', onPress: clearSale }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete sale');
    }
  };

  const clearSale = () => {
    setCartItems([]);
    setCustomer(null);
    setCashReceived('');
    setNotes('');
    setPaymentMethod('cash');
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
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Point of Sale
          </Title>
        </View>

        {/* Customer Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Customer</Title>
            {customer ? (
              <View style={styles.customerInfo}>
                <List.Item
                  title={customer.name}
                  description={customer.phone}
                  left={(props) => <List.Icon {...props} icon="person" />}
                  right={(props) => (
                    <Button onPress={() => setCustomer(null)}>Clear</Button>
                  )}
                />
              </View>
            ) : (
              <Button 
                mode="outlined" 
                onPress={() => router.push('/customers')}
                style={styles.addCustomerButton}
              >
                Add Customer
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Product Entry */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Add Products</Title>
            <View style={styles.productActions}>
              <Button 
                mode="contained" 
                onPress={() => setShowScanner(true)}
                style={styles.scanButton}
                icon="qr-code-scanner"
              >
                Scan Barcode
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => addManualProduct()}
                style={styles.manualButton}
              >
                Add Manually
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Cart */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Cart ({cartItems.length} items)</Title>
            {cartItems.length === 0 ? (
              <List.Item
                title="Cart is empty"
                description="Scan or add products to start"
                left={(props) => <List.Icon {...props} icon="shopping-cart" />}
              />
            ) : (
              cartItems.map((item) => (
                <View key={item.id}>
                  <List.Item
                    title={item.name}
                    description={`৳${item.price.toFixed(2)} × ${item.quantity}`}
                    left={(props) => <List.Icon {...props} icon="shopping-cart" />}
                    right={() => (
                      <View style={styles.quantityControls}>
                        <Button 
                          mode="outlined" 
                          compact
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <Chip>{item.quantity}</Chip>
                        <Button 
                          mode="outlined" 
                          compact
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button 
                          mode="text" 
                          compact
                          onPress={() => removeFromCart(item.id)}
                          textColor={theme.colors.error}
                        >
                          Remove
                        </Button>
                      </View>
                    )}
                  />
                  <Divider />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Payment */}
        {cartItems.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Payment</Title>
              
              {/* Totals */}
              <Surface style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Title>Subtotal:</Title>
                  <Title>৳{subtotal.toFixed(2)}</Title>
                </View>
                <View style={styles.totalRow}>
                  <Title>Tax (8%):</Title>
                  <Title>৳{tax.toFixed(2)}</Title>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.totalRow}>
                  <Title style={styles.grandTotal}>Total:</Title>
                  <Title style={styles.grandTotal}>৳{total.toFixed(2)}</Title>
                </View>
              </Surface>

              {/* Payment Method */}
              <View style={styles.paymentMethods}>
                <Title>Payment Method:</Title>
                <View style={styles.methodButtons}>
                  {['cash', 'card', 'mobile'].map((method) => (
                    <Chip
                      key={method}
                      selected={paymentMethod === method}
                      onPress={() => setPaymentMethod(method)}
                      style={styles.methodChip}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Cash Received */}
              <TextInput
                label="Cash Received"
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="numeric"
                style={styles.cashInput}
              />

              {/* Change */}
              {cashReceived && (
                <View style={styles.changeSection}>
                  <Title style={change >= 0 ? styles.changePositive : styles.changeNegative}>
                    Change: ৳{change.toFixed(2)}
                  </Title>
                </View>
              )}

              {/* Notes */}
              <TextInput
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                style={styles.notesInput}
              />

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button 
                  mode="outlined" 
                  onPress={clearSale}
                  style={styles.clearButton}
                >
                  Clear Sale
                </Button>
                <Button 
                  mode="contained" 
                  onPress={completeSale}
                  style={styles.completeButton}
                  disabled={!cashReceived || parseFloat(cashReceived) < total}
                >
                  Complete Sale
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  customerInfo: {
    marginTop: 8,
  },
  addCustomerButton: {
    marginTop: 8,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  scanButton: {
    flex: 1,
  },
  manualButton: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalsSection: {
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentMethods: {
    marginVertical: 16,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  methodChip: {
    marginRight: 8,
  },
  cashInput: {
    marginVertical: 8,
  },
  changeSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  changePositive: {
    color: 'green',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeNegative: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesInput: {
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});