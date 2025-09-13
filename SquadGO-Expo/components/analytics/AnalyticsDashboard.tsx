import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';
import { analyticsManager } from '../../lib/analytics';

const { width: screenWidth } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#007AFF'
  }
};

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalEvents: number;
  crashRate: number;
  retentionRate: number;
  conversionRate: number;
  topEvents: Array<{ name: string; count: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  sessionTrends: Array<{ date: string; sessions: number }>;
  deviceBreakdown: Array<{ name: string; population: number; color: string }>;
  screenViews: Array<{ screen: string; views: number }>;
}

interface AnalyticsDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '7d',
  onTimeRangeChange
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'events' | 'performance'>('overview');

  const { trackEvent, getUserMetrics } = useAnalytics({
    screenName: 'AnalyticsDashboard',
    autoTrackScreenView: true
  });

  const { trackError } = useMonitoring({ screenName: 'AnalyticsDashboard' });

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos del analytics manager
      const userMetrics = await getUserMetrics();
      
      // En una implementación real, estos datos vendrían de tu backend o Firebase Analytics
      const mockMetrics: DashboardMetrics = {
        totalUsers: 15420,
        activeUsers: 8930,
        totalSessions: 45680,
        averageSessionDuration: 342, // segundos
        totalEvents: 234560,
        crashRate: 0.02, // 2%
        retentionRate: 0.68, // 68%
        conversionRate: 0.12, // 12%
        topEvents: [
          { name: 'screen_view', count: 89450 },
          { name: 'button_click', count: 45230 },
          { name: 'squad_join', count: 12340 },
          { name: 'post_like', count: 8920 },
          { name: 'share_content', count: 5670 }
        ],
        userGrowth: generateTimeSeriesData('users', timeRange),
        sessionTrends: generateTimeSeriesData('sessions', timeRange),
        deviceBreakdown: [
          { name: 'iOS', population: 0.65, color: '#007AFF' },
          { name: 'Android', population: 0.35, color: '#34C759' }
        ],
        screenViews: [
          { screen: 'Home', views: 23450 },
          { screen: 'Profile', views: 18920 },
          { screen: 'Squad', views: 15670 },
          { screen: 'Chat', views: 12340 },
          { screen: 'Settings', views: 8920 }
        ]
      };
      
      setMetrics(mockMetrics);
      trackEvent('analytics_dashboard_loaded', { time_range: timeRange });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      trackError(error as Error, 'load_dashboard_data');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (type: 'users' | 'sessions', range: string) => {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const baseValue = type === 'users' ? 1200 : 800;
      const randomVariation = Math.random() * 400;
      const value = Math.floor(baseValue + randomVariation);
      
      data.push({
        date: date.toISOString().split('T')[0],
        [type]: value
      });
    }
    
    return data;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [timeRange]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const renderTimeRangeSelector = () => {
    const ranges = [
      { key: '24h', label: '24h' },
      { key: '7d', label: '7d' },
      { key: '30d', label: '30d' },
      { key: '90d', label: '90d' }
    ];

    return (
      <View style={styles.timeRangeSelector}>
        {ranges.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.timeRangeButton,
              timeRange === range.key && styles.timeRangeButtonActive
            ]}
            onPress={() => {
              onTimeRangeChange?.(range.key);
              trackEvent('time_range_changed', { range: range.key });
            }}
          >
            <Text style={[
              styles.timeRangeButtonText,
              timeRange === range.key && styles.timeRangeButtonTextActive
            ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTabSelector = () => {
    const tabs = [
      { key: 'overview', label: 'Resumen', icon: 'analytics-outline' },
      { key: 'users', label: 'Usuarios', icon: 'people-outline' },
      { key: 'events', label: 'Eventos', icon: 'pulse-outline' },
      { key: 'performance', label: 'Rendimiento', icon: 'speedometer-outline' }
    ];

    return (
      <View style={styles.tabSelector}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.tabButtonActive
            ]}
            onPress={() => {
              setSelectedTab(tab.key as any);
              trackEvent('dashboard_tab_changed', { tab: tab.key });
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.key ? '#007AFF' : '#666'}
            />
            <Text style={[
              styles.tabButtonText,
              selectedTab === tab.key && styles.tabButtonTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, icon?: string, color?: string) => {
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricTitle}>{title}</Text>
          {icon && (
            <Ionicons name={icon as any} size={24} color={color || '#007AFF'} />
          )}
        </View>
        <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderOverviewTab = () => {
    if (!metrics) return null;

    return (
      <View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Usuarios Totales',
            metrics.totalUsers.toLocaleString(),
            'Usuarios registrados',
            'people-outline',
            '#007AFF'
          )}
          {renderMetricCard(
            'Usuarios Activos',
            metrics.activeUsers.toLocaleString(),
            'Últimos 7 días',
            'pulse-outline',
            '#34C759'
          )}
          {renderMetricCard(
            'Sesiones',
            metrics.totalSessions.toLocaleString(),
            'Total de sesiones',
            'time-outline',
            '#FF9500'
          )}
          {renderMetricCard(
            'Duración Promedio',
            formatDuration(metrics.averageSessionDuration),
            'Por sesión',
            'timer-outline',
            '#AF52DE'
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Crecimiento de Usuarios</Text>
          <LineChart
            data={{
              labels: metrics.userGrowth.slice(-7).map(d => d.date.split('-')[2]),
              datasets: [{
                data: metrics.userGrowth.slice(-7).map(d => d.users)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribución de Dispositivos</Text>
          <PieChart
            data={metrics.deviceBreakdown}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 50]}
            absolute
            style={styles.chart}
          />
        </View>
      </View>
    );
  };

  const renderUsersTab = () => {
    if (!metrics) return null;

    return (
      <View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Tasa de Retención',
            formatPercentage(metrics.retentionRate),
            'Usuarios que regresan',
            'repeat-outline',
            '#34C759'
          )}
          {renderMetricCard(
            'Tasa de Conversión',
            formatPercentage(metrics.conversionRate),
            'Usuarios premium',
            'trophy-outline',
            '#FF9500'
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Tendencia de Sesiones</Text>
          <BarChart
            data={{
              labels: metrics.sessionTrends.slice(-7).map(d => d.date.split('-')[2]),
              datasets: [{
                data: metrics.sessionTrends.slice(-7).map(d => d.sessions)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      </View>
    );
  };

  const renderEventsTab = () => {
    if (!metrics) return null;

    return (
      <View>
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Eventos Más Populares</Text>
          {metrics.topEvents.map((event, index) => (
            <View key={event.name} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemRank}>#{index + 1}</Text>
                <Text style={styles.listItemName}>{event.name}</Text>
              </View>
              <Text style={styles.listItemValue}>{event.count.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Pantallas Más Visitadas</Text>
          {metrics.screenViews.map((screen, index) => (
            <View key={screen.screen} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemRank}>#{index + 1}</Text>
                <Text style={styles.listItemName}>{screen.screen}</Text>
              </View>
              <Text style={styles.listItemValue}>{screen.views.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerformanceTab = () => {
    if (!metrics) return null;

    return (
      <View>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Tasa de Crashes',
            formatPercentage(metrics.crashRate),
            'Crashes por sesión',
            'warning-outline',
            '#F44336'
          )}
          {renderMetricCard(
            'Eventos Totales',
            metrics.totalEvents.toLocaleString(),
            'Eventos registrados',
            'pulse-outline',
            '#007AFF'
          )}
        </View>

        <View style={styles.performanceIndicators}>
          <Text style={styles.sectionTitle}>Indicadores de Rendimiento</Text>
          
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorLabel}>Tiempo de carga promedio</Text>
            <Text style={styles.indicatorValue}>1.2s</Text>
          </View>
          
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorLabel}>Uso de memoria promedio</Text>
            <Text style={styles.indicatorValue}>45MB</Text>
          </View>
          
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorLabel}>Tiempo de respuesta API</Text>
            <Text style={styles.indicatorValue}>320ms</Text>
          </View>
          
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorLabel}>Tasa de éxito de red</Text>
            <Text style={styles.indicatorValue}>99.2%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'events':
        return renderEventsTab();
      case 'performance':
        return renderPerformanceTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Métricas y estadísticas de la aplicación</Text>
      </View>

      {renderTimeRangeSelector()}
      {renderTabSelector()}
      {renderTabContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  timeRangeSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF'
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  timeRangeButtonTextActive: {
    color: 'white'
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: '#f0f8ff'
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4
  },
  tabButtonTextActive: {
    color: '#007AFF'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginBottom: 16
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: '2%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999'
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  chart: {
    borderRadius: 16
  },
  listContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  listItemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 24
  },
  listItemName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500'
  },
  listItemValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  performanceIndicators: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  indicatorLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  indicatorValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600'
  }
});

export default AnalyticsDashboard;