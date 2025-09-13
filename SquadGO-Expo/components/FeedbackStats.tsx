import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeedback } from '../hooks/useFeedback';
import { FeedbackStats as FeedbackStatsType } from '../hooks/useFeedback';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

interface RatingBarProps {
  rating: number;
  count: number;
  total: number;
  color: string;
}

const RatingBar: React.FC<RatingBarProps> = ({ rating, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <View style={styles.ratingBarContainer}>
      <View style={styles.ratingBarHeader}>
        <View style={styles.ratingStars}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < rating ? 'star' : 'star-outline'}
              size={16}
              color={i < rating ? '#FFD700' : '#DDD'}
            />
          ))}
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>{percentage.toFixed(1)}%</Text>
      </View>
    </View>
  );
};

export const FeedbackStats: React.FC = () => {
  const { getFeedbackStats } = useFeedback();
  const [stats, setStats] = useState<FeedbackStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const feedbackStats = await getFeedbackStats();
      setStats(feedbackStats);
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Error al cargar estadísticas</Text>
      </View>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 3.5) return '#FF9800';
    return '#FF5722';
  };

  const totalReviews = Object.values(stats.ratingDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Estadísticas principales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Calificación Promedio"
            value={stats.averageRating.toFixed(1)}
            icon="star"
            color={getRatingColor(stats.averageRating)}
            subtitle="de 5.0 estrellas"
          />
          <StatCard
            title="Total de Reseñas"
            value={stats.totalReviews.toLocaleString()}
            icon="chatbubbles"
            color="#007AFF"
            subtitle="reseñas recibidas"
          />
          <StatCard
            title="Feedback Reciente"
            value={stats.recentFeedback}
            icon="time"
            color="#FF9800"
            subtitle="últimos 7 días"
          />
          <StatCard
            title="Tasa de Respuesta"
            value={`${stats.responseRate}%`}
            icon="checkmark-circle"
            color="#4CAF50"
            subtitle="feedback respondido"
          />
        </View>
      </View>

      {/* Distribución de calificaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución de Calificaciones</Text>
        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <RatingBar
              key={rating}
              rating={rating}
              count={stats.ratingDistribution[rating] || 0}
              total={totalReviews}
              color={getRatingColor(rating)}
            />
          ))}
        </View>
      </View>

      {/* Tendencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tendencias</Text>
        <View style={styles.trendsContainer}>
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.trendTitle}>Mejora Continua</Text>
            </View>
            <Text style={styles.trendValue}>+{stats.improvementRate}%</Text>
            <Text style={styles.trendSubtitle}>vs. mes anterior</Text>
          </View>
          
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Ionicons name="people" size={20} color="#007AFF" />
              <Text style={styles.trendTitle}>Participación</Text>
            </View>
            <Text style={styles.trendValue}>{stats.participationRate}%</Text>
            <Text style={styles.trendSubtitle}>usuarios activos</Text>
          </View>
        </View>
      </View>

      {/* Categorías más comentadas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías Populares</Text>
        <View style={styles.categoriesContainer}>
          {stats.topCategories.map((category, index) => (
            <View key={category.name} style={styles.categoryItem}>
              <View style={styles.categoryRank}>
                <Text style={styles.categoryRankText}>{index + 1}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} menciones</Text>
              </View>
              <View style={styles.categoryProgress}>
                <View
                  style={[
                    styles.categoryProgressFill,
                    {
                      width: `${(category.count / stats.topCategories[0].count) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightsContainer}>
          <View style={styles.insightCard}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <Text style={styles.insightText}>
              Los usuarios valoran especialmente la facilidad de uso y la velocidad de conexión.
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <Ionicons name="target" size={24} color="#9C27B0" />
            <Text style={styles.insightText}>
              El 78% de las sugerencias se enfocan en mejorar el sistema de matchmaking.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  ratingDistribution: {
    gap: 12,
  },
  ratingBarContainer: {
    gap: 8,
  },
  ratingBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  trendSubtitle: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  categoryProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
});