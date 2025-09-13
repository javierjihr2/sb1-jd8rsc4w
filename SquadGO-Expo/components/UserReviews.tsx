import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  timestamp: Date;
  helpful: number;
  reported: boolean;
  targetType: 'user' | 'event' | 'app';
  targetId: string;
}

interface UserReviewsProps {
  targetType: 'user' | 'event' | 'app';
  targetId: string;
  showAddReview?: boolean;
  onAddReview?: () => void;
}

export const UserReviews: React.FC<UserReviewsProps> = ({
  targetType,
  targetId,
  showAddReview = true,
  onAddReview,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Simular carga de reseñas desde Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReviews: Review[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'María García',
          userAvatar: 'https://i.pravatar.cc/150?img=1',
          rating: 5,
          comment: 'Excelente experiencia! La aplicación es muy fácil de usar y me ha ayudado a encontrar compañeros de entrenamiento perfectos.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          helpful: 12,
          reported: false,
          targetType,
          targetId,
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Carlos Rodríguez',
          userAvatar: 'https://i.pravatar.cc/150?img=2',
          rating: 4,
          comment: 'Muy buena app, aunque me gustaría que tuviera más opciones de filtrado para encontrar personas con intereses específicos.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          helpful: 8,
          reported: false,
          targetType,
          targetId,
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Ana López',
          userAvatar: 'https://i.pravatar.cc/150?img=3',
          rating: 5,
          comment: 'Increíble! He conocido personas geniales y hemos formado un grupo de running que se reúne todas las semanas.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          helpful: 15,
          reported: false,
          targetType,
          targetId,
        },
      ];
      
      setReviews(mockReviews);
      
      // Track analytics
      await analyticsManager.trackEvent('reviews_loaded', {
        targetType,
        targetId,
        reviewCount: mockReviews.length,
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const markAsHelpful = async (reviewId: string) => {
    if (helpfulReviews.has(reviewId)) return;
    
    try {
      setHelpfulReviews(prev => new Set([...prev, reviewId]));
      
      // Simular actualización en Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ));
      
      await analyticsManager.trackEvent('review_marked_helpful', {
        reviewId,
        targetType,
        targetId,
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      setHelpfulReviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const reportReview = async (reviewId: string) => {
    try {
      // Simular reporte en Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await analyticsManager.trackEvent('review_reported', {
        reviewId,
        targetType,
        targetId,
      });
      
      // Mostrar confirmación
      alert('Reseña reportada. Será revisada por nuestro equipo.');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Error al reportar la reseña. Inténtalo de nuevo.');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={star <= rating ? '#FFD700' : '#DDD'}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES');
  };

  const renderReview = ({ item }: { item: Review }) => {
    const isHelpful = helpfulReviews.has(item.id);
    const isOwnReview = item.userId === user?.uid;
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.userAvatar || 'https://i.pravatar.cc/150?img=0' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.userName}</Text>
              <View style={styles.ratingRow}>
                {renderStars(item.rating)}
                <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
              </View>
            </View>
          </View>
          
          {!isOwnReview && (
            <TouchableOpacity
              onPress={() => reportReview(item.id)}
              style={styles.reportButton}
            >
              <Ionicons name="flag-outline" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.comment}>{item.comment}</Text>
        
        <View style={styles.reviewFooter}>
          <TouchableOpacity
            onPress={() => markAsHelpful(item.id)}
            style={[
              styles.helpfulButton,
              isHelpful && styles.helpfulButtonActive,
            ]}
            disabled={isOwnReview || isHelpful}
          >
            <Ionicons
              name={isHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={isHelpful ? '#007AFF' : '#666'}
            />
            <Text style={[
              styles.helpfulText,
              isHelpful && styles.helpfulTextActive,
            ]}>
              Útil ({item.helpful})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderHeader = () => {
    const averageRating = calculateAverageRating();
    
    return (
      <View style={styles.header}>
        <View style={styles.summaryCard}>
          <View style={styles.ratingSummary}>
            <Text style={styles.averageRating}>{averageRating}</Text>
            {renderStars(Math.round(parseFloat(averageRating)))}
            <Text style={styles.reviewCount}>
              {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
            </Text>
          </View>
          
          {showAddReview && (
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={onAddReview}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addReviewText}>Escribir reseña</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando reseñas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No hay reseñas aún</Text>
            <Text style={styles.emptySubtitle}>
              Sé el primero en compartir tu experiencia
            </Text>
            {showAddReview && (
              <TouchableOpacity
                style={styles.firstReviewButton}
                onPress={onAddReview}
              >
                <Text style={styles.firstReviewButtonText}>Escribir primera reseña</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingSummary: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    marginHorizontal: 1,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addReviewText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  reportButton: {
    padding: 4,
  },
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  helpfulButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  helpfulTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  firstReviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  firstReviewButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});