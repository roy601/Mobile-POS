import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const DashboardCard = ({ title, value, subtitle, icon, color }: any) => {
  const theme = useTheme();
  
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <MaterialIcons name={icon} size={24} color={color} />
          <Title style={[styles.cardValue, { color: theme.colors.onSurface }]}>{value}</Title>
        </View>
        <Paragraph style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>{title}</Paragraph>
        <Paragraph style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Paragraph>
      </Card.Content>
    </Card>
  );
};

export default function Dashboard() {
  const theme = useTheme();

  const quickActions = [
    { title: 'New Sale', icon: 'add-shopping-cart', route: '/pos', color: theme.colors.primary },
    { title: 'Scan Product', icon: 'qr-code-scanner', route: '/scanner?mode=product', color: theme.colors.secondary },
    { title: 'Add Customer', icon: 'person-add', route: '/customers', color: theme.colors.tertiary },
    { title: 'View Reports', icon: 'assessment', route: '/analytics', color: theme.colors.error },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Mobile POS Dashboard
          </Title>
          <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Welcome back! Here's your business overview.
          </Paragraph>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <DashboardCard
            title="Today's Sales"
            value="৳45,231"
            subtitle="+20.1% from yesterday"
            icon="trending-up"
            color={theme.colors.primary}
          />
          <DashboardCard
            title="Total Orders"
            value="573"
            subtitle="+12.2% from yesterday"
            icon="shopping-cart"
            color={theme.colors.secondary}
          />
          <DashboardCard
            title="Active Customers"
            value="2,350"
            subtitle="+10.1% this month"
            icon="people"
            color={theme.colors.tertiary}
          />
          <DashboardCard
            title="Low Stock Items"
            value="24"
            subtitle="Need attention"
            icon="warning"
            color={theme.colors.error}
          />
        </View>

        {/* Quick Actions */}
        <Card style={[styles.quickActionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Quick Actions</Title>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  mode="outlined"
                  onPress={() => router.push(action.route)}
                  style={[styles.quickActionButton, { borderColor: action.color }]}
                  labelStyle={{ color: action.color }}
                  icon={({ size }) => (
                    <MaterialIcons name={action.icon as any} size={size} color={action.color} />
                  )}
                >
                  {action.title}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={[styles.recentActivityCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recent Activity</Title>
            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <MaterialIcons name="shopping-cart" size={20} color={theme.colors.primary} />
                <View style={styles.activityContent}>
                  <Paragraph style={{ color: theme.colors.onSurface }}>Sale #INV-2024-001</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    ৳42,000 - 2 minutes ago
                  </Paragraph>
                </View>
              </View>
              <View style={styles.activityItem}>
                <MaterialIcons name="inventory" size={20} color={theme.colors.secondary} />
                <View style={styles.activityContent}>
                  <Paragraph style={{ color: theme.colors.onSurface }}>Product Added</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Samsung Galaxy A54 - 5 minutes ago
                  </Paragraph>
                </View>
              </View>
              <View style={styles.activityItem}>
                <MaterialIcons name="person-add" size={20} color={theme.colors.tertiary} />
                <View style={styles.activityContent}>
                  <Paragraph style={{ color: theme.colors.onSurface }}>New Customer</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    আহমেদ হাসান - 10 minutes ago
                  </Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  quickActionsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    marginBottom: 12,
  },
  recentActivityCard: {
    marginBottom: 24,
    elevation: 2,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
});