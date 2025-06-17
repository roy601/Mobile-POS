import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph,
  useTheme,
  Chip,
  List
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useDatabase } from '../../contexts/DatabaseContext';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const theme = useTheme();
  const { getSalesAnalytics, getTopProducts, getCustomerAnalytics } = useDatabase();
  const [salesData, setSalesData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [sales, products, customers] = await Promise.all([
        getSalesAnalytics(),
        getTopProducts(),
        getCustomerAnalytics()
      ]);
      
      setSalesData(sales);
      setTopProducts(products);
      setCustomerData(customers);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.onSurface}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  // Sample data - replace with real data from database
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [20000, 45000, 28000, 80000, 99000, 43000, 67000],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const categoryData = [
    {
      name: 'Mobile Phones',
      population: 65,
      color: theme.colors.primary,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
    {
      name: 'Accessories',
      population: 25,
      color: theme.colors.secondary,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
    {
      name: 'Tablets',
      population: 10,
      color: theme.colors.tertiary,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
  ];

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [150000, 180000, 220000, 190000, 250000, 280000],
      },
    ],
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Analytics Dashboard
          </Title>
          <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Business insights and performance metrics
          </Paragraph>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="trending-up" size={24} color={theme.colors.primary} />
                <Title style={[styles.metricValue, { color: theme.colors.onSurface }]}>৳45,231</Title>
              </View>
              <Paragraph style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Revenue
              </Paragraph>
              <Chip style={styles.changeChip} textStyle={{ color: 'green' }}>
                +20.1%
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="shopping-cart" size={24} color={theme.colors.secondary} />
                <Title style={[styles.metricValue, { color: theme.colors.onSurface }]}>573</Title>
              </View>
              <Paragraph style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Sales
              </Paragraph>
              <Chip style={styles.changeChip} textStyle={{ color: 'green' }}>
                +12.2%
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="people" size={24} color={theme.colors.tertiary} />
                <Title style={[styles.metricValue, { color: theme.colors.onSurface }]}>2,350</Title>
              </View>
              <Paragraph style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Customers
              </Paragraph>
              <Chip style={styles.changeChip} textStyle={{ color: 'green' }}>
                +10.1%
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricHeader}>
                <MaterialIcons name="inventory" size={24} color={theme.colors.error} />
                <Title style={[styles.metricValue, { color: theme.colors.onSurface }]}>24</Title>
              </View>
              <Paragraph style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                Low Stock
              </Paragraph>
              <Chip style={styles.changeChip} textStyle={{ color: 'orange' }}>
                Alert
              </Chip>
            </Card.Content>
          </Card>
        </View>

        {/* Sales Chart */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Weekly Sales Trend
            </Title>
            <LineChart
              data={salesChartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Category Distribution */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Sales by Category
            </Title>
            <PieChart
              data={categoryData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Monthly Revenue */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Monthly Revenue
            </Title>
            <BarChart
              data={monthlyData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel="৳"
              yAxisSuffix="k"
            />
          </Card.Content>
        </Card>

        {/* Top Products */}
        <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Top Selling Products
            </Title>
            <List.Item
              title="Samsung Galaxy A54"
              description="145 units sold • ৳130,050 revenue"
              left={(props) => <List.Icon {...props} icon="trending-up" />}
              right={() => <Chip>1st</Chip>}
            />
            <List.Item
              title="iPhone 14"
              description="89 units sold • ৳95,000 revenue"
              left={(props) => <List.Icon {...props} icon="trending-up" />}
              right={() => <Chip>2nd</Chip>}
            />
            <List.Item
              title="Xiaomi Redmi Note 12"
              description="67 units sold • ৳64,000 revenue"
              left={(props) => <List.Icon {...props} icon="trending-up" />}
              right={() => <Chip>3rd</Chip>}
            />
          </Card.Content>
        </Card>

        {/* Customer Insights */}
        <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Customer Insights
            </Title>
            <View style={styles.insightGrid}>
              <View style={styles.insightItem}>
                <Title style={styles.insightValue}>68%</Title>
                <Paragraph style={styles.insightLabel}>Repeat Customers</Paragraph>
              </View>
              <View style={styles.insightItem}>
                <Title style={styles.insightValue}>৳456</Title>
                <Paragraph style={styles.insightLabel}>Avg. Order Value</Paragraph>
              </View>
              <View style={styles.insightItem}>
                <Title style={styles.insightValue}>12%</Title>
                <Paragraph style={styles.insightLabel}>Churn Rate</Paragraph>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  metricContent: {
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  changeChip: {
    alignSelf: 'flex-start',
  },
  chartCard: {
    marginBottom: 24,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    marginBottom: 24,
    elevation: 2,
  },
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  insightLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});