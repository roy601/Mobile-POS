import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users, DollarSign, Package, Bell, Settings as SettingsIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const stats = [
    { title: 'Total Sales', value: '$12,345', icon: DollarSign, color: '#34D399', change: '+12%' },
    { title: 'Orders Today', value: '23', icon: Package, color: '#60A5FA', change: '+5%' },
    { title: 'Active Users', value: '1,234', icon: Users, color: '#F472B6', change: '+8%' },
    { title: 'Growth', value: '+12%', icon: TrendingUp, color: '#FBBF24', change: '+2%' },
  ];

  const recentOrders = [
    { id: '001', customer: 'John Doe', amount: '$45.99', status: 'Completed', time: '2 min ago' },
    { id: '002', customer: 'Jane Smith', amount: '$32.50', status: 'Processing', time: '5 min ago' },
    { id: '003', customer: 'Mike Johnson', amount: '$78.25', status: 'Pending', time: '8 min ago' },
    { id: '004', customer: 'Sarah Wilson', amount: '$156.75', status: 'Completed', time: '12 min ago' },
  ];

  const quickActions = [
    { title: 'Add Product', icon: Package, colors: ['#667EEA', '#764BA2'] },
    { title: 'New Sale', icon: DollarSign, colors: ['#F093FB', '#F5576C'] },
    { title: 'View Reports', icon: TrendingUp, colors: ['#4FACFE', '#00F2FE'] },
    { title: 'Manage Users', icon: Users, colors: ['#43E97B', '#38F9D7'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.username}>Welcome back, Admin</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={triggerHapticFeedback}
            >
              <Bell size={20} color="#64748B" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={triggerHapticFeedback}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[stat.color + '15', stat.color + '05']}
                style={styles.statGradient}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <View style={[styles.changeIndicator, { backgroundColor: '#34D399' + '20' }]}>
                    <Text style={[styles.changeText, { color: '#34D399' }]}>{stat.change}</Text>
                  </View>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.actionCard}
                onPress={triggerHapticFeedback}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={action.colors}
                  style={styles.actionGradient}
                >
                  <action.icon size={28} color="white" />
                  <Text style={styles.actionText}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ordersContainer}>
            {recentOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={triggerHapticFeedback}
                activeOpacity={0.8}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCustomer}>{order.customer}</Text>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                  </View>
                  <Text style={styles.orderTime}>{order.time}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>{order.amount}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: order.status === 'Completed' ? '#34D399' : 
                                     order.status === 'Processing' ? '#60A5FA' : '#FBBF24' }
                  ]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.metricsCard}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.metricsGradient}
            >
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>89%</Text>
                  <Text style={styles.metricLabel}>Order Success</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>4.8</Text>
                  <Text style={styles.metricLabel}>Avg Rating</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>12m</Text>
                  <Text style={styles.metricLabel}>Avg Response</Text>
                </View>
              </View>
            </LinearGradient>
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
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667EEA20',
    borderRadius: 12,
  },
  viewAllText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  ordersContainer: {
    gap: 12,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderLeft: {
    flex: 1,
  },
  orderInfo: {
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 14,
    color: '#64748B',
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricsGradient: {
    padding: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});