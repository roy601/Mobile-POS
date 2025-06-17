import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalPurchases: number;
  lastPurchase?: string;
  customerType: 'regular' | 'vip' | 'wholesale';
}

export default function CustomersScreen() {
  const theme = useTheme();
  const { getCustomers, addCustomer } = useDatabase();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const customerTypes = ['all', 'regular', 'vip', 'wholesale'];

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, selectedType]);

  const loadCustomers = async () => {
    try {
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load customers');
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === selectedType);
    }

    setFilteredCustomers(filtered);
  };

  const addNewCustomer = () => {
    router.push('/add-customer');
  };

  const editCustomer = (customer: Customer) => {
    router.push({
      pathname: '/edit-customer',
      params: { customerId: customer.id }
    });
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return theme.colors.tertiary;
      case 'wholesale': return theme.colors.secondary;
      default: return theme.colors.primary;
    }
  };

  const callCustomer = (phone: string) => {
    Alert.alert('Call Customer', `Call ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => {
        // In a real app, you would use Linking.openURL(`tel:${phone}`)
        Alert.alert('Calling', `Calling ${phone}...`);
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Customer Management
        </Title>
        
        {/* Search */}
        <Searchbar
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilter}>
          {customerTypes.map((type) => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={styles.typeChip}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{customers.length}</Title>
              <Title style={styles.statLabel}>Total Customers</Title>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{customers.filter(c => c.customerType === 'vip').length}</Title>
              <Title style={styles.statLabel}>VIP Customers</Title>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Customers List */}
      <ScrollView style={styles.customersList}>
        {filteredCustomers.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="people" size={64} color={theme.colors.onSurfaceVariant} />
              <Title style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                No Customers Found
              </Title>
              <Button 
                mode="contained" 
                onPress={addNewCustomer}
                style={styles.addFirstCustomerButton}
              >
                Add Your First Customer
              </Button>
            </Card.Content>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} style={[styles.customerCard, { backgroundColor: theme.colors.surface }]}>
              <List.Item
                title={customer.name}
                description={`${customer.phone}${customer.email ? ` • ${customer.email}` : ''}`}
                left={(props) => (
                  <View style={styles.customerIcon}>
                    <MaterialIcons name="person" size={24} color={theme.colors.primary} />
                  </View>
                )}
                right={() => (
                  <View style={styles.customerActions}>
                    <Chip 
                      style={[styles.typeChipSmall, { backgroundColor: getCustomerTypeColor(customer.customerType) + '20' }]}
                      textStyle={{ color: getCustomerTypeColor(customer.customerType) }}
                    >
                      {customer.customerType.toUpperCase()}
                    </Chip>
                    <View style={styles.actionButtons}>
                      <Button 
                        mode="text" 
                        onPress={() => callCustomer(customer.phone)}
                        compact
                        icon="phone"
                      >
                        Call
                      </Button>
                      <Button 
                        mode="text" 
                        onPress={() => editCustomer(customer)}
                        compact
                        icon="edit"
                      >
                        Edit
                      </Button>
                    </View>
                  </View>
                )}
                onPress={() => editCustomer(customer)}
              />
              <Card.Content style={styles.customerDetails}>
                <View style={styles.purchaseInfo}>
                  <Chip icon="shopping-cart" style={styles.purchaseChip}>
                    ৳{customer.totalPurchases.toFixed(2)} total purchases
                  </Chip>
                  {customer.lastPurchase && (
                    <Chip icon="schedule" style={styles.lastPurchaseChip}>
                      Last: {customer.lastPurchase}
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="person-add"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={addNewCustomer}
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
  typeFilter: {
    marginBottom: 16,
  },
  typeChip: {
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  customersList: {
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
  addFirstCustomerButton: {
    marginTop: 16,
  },
  customerCard: {
    marginBottom: 8,
    elevation: 1,
  },
  customerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  customerActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeChipSmall: {
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  customerDetails: {
    paddingTop: 0,
    paddingBottom: 12,
  },
  purchaseInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purchaseChip: {
    flex: 1,
  },
  lastPurchaseChip: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});