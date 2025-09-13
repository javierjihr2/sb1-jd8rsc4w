import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCurrency } from '../contexts/CurrencyContext';

const { width } = Dimensions.get('window');

interface PerformanceData {
  kills: number[];
  damage: number[];
  survival: number[];
  placement: number[];
  dates: string[];
}

interface AIInsight {
  id: string;
  type: 'improvement' | 'strength' | 'warning' | 'tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'aim' | 'strategy' | 'positioning' | 'teamwork' | 'equipment';
}

interface PremiumStatsProps {
  visible: boolean;
  onClose: () => void;
}

const PremiumStats: React.FC<PremiumStatsProps> = ({ visible, onClose }) => {
  const { hasFeature } = useSubscription();
  const { purchaseItem } = useCurrency();
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'ai-coach'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = hasFeature('advanced_stats');

  useEffect(() => {
    if (visible && isPremium) {
      loadPremiumData();
    }
  }, [visible, timeRange, isPremium]);

  const loadPremiumData = async () => {
    setIsLoading(true);
    
    // Simulate loading premium analytics data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock performance data
    const mockData: PerformanceData = {
      kills: [12, 8, 15, 10, 18, 14, 16],
      damage: [2400, 1800, 3200, 2100, 3600, 2800, 3100],
      survival: [18.5, 12.3, 22.1, 15.7, 25.4, 20.2, 23.8],
      placement: [3, 8, 1, 5, 2, 4, 2],
      dates: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    };
    
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'improvement',
        title: 'Mejora tu Puntería',
        description: 'Tu precisión de tiro ha disminuido un 12% esta semana. Practica en el campo de entrenamiento 15 minutos antes de cada partida.',
        priority: 'high',
        category: 'aim'
      },
      {
        id: '2',
        type: 'strength',
        title: 'Excelente Supervivencia',
        description: 'Tu tiempo de supervivencia promedio ha aumentado 23%. Mantén esta estrategia defensiva.',
        priority: 'medium',
        category: 'strategy'
      },
      {
        id: '3',
        type: 'tip',
        title: 'Optimiza tu Equipamiento',
        description: 'Considera usar más granadas de humo en zonas abiertas. Esto podría mejorar tu supervivencia en un 15%.',
        priority: 'medium',
        category: 'equipment'
      },
      {
        id: '4',
        type: 'warning',
        title: 'Patrón de Juego Detectado',
        description: 'Tiendes a ser muy agresivo en early game. Considera un enfoque más conservador para mejorar tu ranking.',
        priority: 'high',
        category: 'strategy'
      }
    ];
    
    setPerformanceData(mockData);
    setAiInsights(mockInsights);
    setIsLoading(false);
  };

  const handleUpgradeToPremium = () => {
    Alert.alert(
      'Funciones Premium',
      'Desbloquea estadísticas avanzadas y coaching AI con una suscripción premium.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Planes', onPress: () => {/* Navigate to subscription */ } }
      ]
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return '📈';
      case 'strength': return '💪';
      case 'warning': return '⚠️';
      case 'tip': return '💡';
      default: return '📊';
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#3498db';
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#f8f9fa',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#667eea'
    }
  };

  if (!visible) return null;

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.premiumHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.premiumTitle}>Estadísticas Premium</Text>
        </LinearGradient>
        
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeIcon}>📊</Text>
          <Text style={styles.upgradeTitle}>Desbloquea Análisis Avanzado</Text>
          <Text style={styles.upgradeDescription}>
            Accede a estadísticas detalladas, análisis de tendencias y coaching AI personalizado para mejorar tu rendimiento.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={20} color="#667eea" />
              <Text style={styles.featureText}>Gráficos de rendimiento detallados</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={20} color="#667eea" />
              <Text style={styles.featureText}>Análisis de tendencias</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bulb" size={20} color="#667eea" />
              <Text style={styles.featureText}>Coaching AI personalizado</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trophy" size={20} color="#667eea" />
              <Text style={styles.featureText}>Predicciones de ranking</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeToPremium}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.upgradeButtonGradient}>
              <Text style={styles.upgradeButtonText}>Actualizar a Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estadísticas Premium</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        </View>
        
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.activeTimeRange]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.activeTimeRangeText]}>
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {[
            { id: 'overview', name: 'Resumen', icon: 'analytics' },
            { id: 'detailed', name: 'Detallado', icon: 'bar-chart' },
            { id: 'ai-coach', name: 'AI Coach', icon: 'bulb' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? '#667eea' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analizando datos...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && performanceData && (
              <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Rendimiento General</Text>
                
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Kills por Día</Text>
                  <LineChart
                    data={{
                      labels: performanceData.dates,
                      datasets: [{ data: performanceData.kills }]
                    }}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>15.2</Text>
                    <Text style={styles.statLabel}>Kills Promedio</Text>
                    <Text style={styles.statChange}>+12%</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>2,847</Text>
                    <Text style={styles.statLabel}>Daño Promedio</Text>
                    <Text style={styles.statChange}>+8%</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>19.7m</Text>
                    <Text style={styles.statLabel}>Supervivencia</Text>
                    <Text style={styles.statChange}>+23%</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>#3.2</Text>
                    <Text style={styles.statLabel}>Posición Promedio</Text>
                    <Text style={styles.statChange}>-15%</Text>
                  </View>
                </View>
              </View>
            )}
            
            {activeTab === 'detailed' && performanceData && (
              <View style={styles.detailedSection}>
                <Text style={styles.sectionTitle}>Análisis Detallado</Text>
                
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Daño por Partida</Text>
                  <BarChart
                    data={{
                      labels: performanceData.dates,
                      datasets: [{ data: performanceData.damage }]
                    }}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                </View>
                
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Distribución de Posiciones</Text>
                  <PieChart
                    data={[
                      { name: 'Top 1', population: 15, color: '#f39c12', legendFontColor: '#7F7F7F' },
                      { name: 'Top 5', population: 35, color: '#e74c3c', legendFontColor: '#7F7F7F' },
                      { name: 'Top 10', population: 30, color: '#3498db', legendFontColor: '#7F7F7F' },
                      { name: 'Otros', population: 20, color: '#95a5a6', legendFontColor: '#7F7F7F' }
                    ]}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                  />
                </View>
              </View>
            )}
            
            {activeTab === 'ai-coach' && (
              <View style={styles.aiCoachSection}>
                <Text style={styles.sectionTitle}>Coaching AI Personalizado</Text>
                <Text style={styles.sectionSubtitle}>
                  Análisis inteligente de tu rendimiento con recomendaciones personalizadas
                </Text>
                
                {aiInsights.map((insight) => (
                  <View key={insight.id} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <View style={styles.insightIconContainer}>
                        <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
                      </View>
                      <View style={styles.insightTitleContainer}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: getInsightColor(insight.priority) }]}>
                          <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                    <View style={styles.insightFooter}>
                      <Text style={styles.categoryText}>#{insight.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa'
    },
    header: {
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20
    },
    premiumHeader: {
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center'
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    },
    closeButton: {
      padding: 8,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20
    },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center'
  },
  premiumBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16
  },
  activeTimeRange: {
    backgroundColor: 'white'
  },
  timeRangeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600'
  },
  activeTimeRangeText: {
    color: '#667eea'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20
  },
  activeTab: {
    backgroundColor: 'white'
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4
  },
  activeTabText: {
    color: '#667eea'
  },
  content: {
    flex: 1,
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d'
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  chart: {
    borderRadius: 16
  },
  statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10
    },
    statCard: {
      width: (width - 50) / 2,
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 15,
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 100
    },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 5
  },
  statChange: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: 'bold'
  },
  overviewSection: {
    marginBottom: 20
  },
  detailedSection: {
    marginBottom: 20
  },
  aiCoachSection: {
    marginBottom: 20
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    },
    insightIconContainer: {
      marginRight: 12,
      width: 32,
      alignItems: 'center'
    },
    insightIcon: {
      fontSize: 20
    },
    insightTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  insightDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 10
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  categoryText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600'
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  upgradeIcon: {
    fontSize: 80,
    marginBottom: 20
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15
  },
  upgradeDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30
  },
  featuresList: {
    width: '100%',
    marginBottom: 30
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  featureText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15
  },
  upgradeButton: {
    borderRadius: 25,
    overflow: 'hidden'
  },
  upgradeButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default PremiumStats;