import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

export interface FeedbackData {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  category: 'app' | 'feature' | 'bug' | 'suggestion';
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  targetType?: 'user' | 'event' | 'app';
  targetId?: string;
}

export interface Review {
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

export interface FeedbackStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  recentFeedback: number;
  responseRate: number;
  improvementRate: number;
  participationRate: number;
  topCategories: Array<{
    name: string;
    count: number;
  }>;
}

export const useFeedback = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Submit feedback
  const submitFeedback = useCallback(async (
    feedbackData: Omit<FeedbackData, 'id' | 'userId' | 'timestamp' | 'status'>
  ): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para enviar feedback');
      return false;
    }

    setSubmitting(true);
    try {
      const feedback: Omit<FeedbackData, 'id'> = {
        ...feedbackData,
        userId: user.uid,
        timestamp: new Date(),
        status: 'pending',
      };

      // Simular envío a Firebase Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una implementación real, aquí enviarías a Firestore:
      // const docRef = await addDoc(collection(db, 'feedback'), feedback);
      
      // Track analytics
      await analyticsManager.trackEvent('feedback_submitted', {
        category: feedback.category,
        rating: feedback.rating,
        targetType: feedback.targetType,
        targetId: feedback.targetId,
        commentLength: feedback.comment.length,
      });

      // Enviar notificación push a admins si es crítico
      if (feedback.rating <= 2 || feedback.category === 'bug') {
        await notifyAdmins(feedback);
      }

      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'No se pudo enviar el feedback. Inténtalo de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  // Submit review
  const submitReview = useCallback(async (
    reviewData: Omit<Review, 'id' | 'userId' | 'userName' | 'userAvatar' | 'timestamp' | 'helpful' | 'reported'>
  ): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes estar autenticado para escribir una reseña');
      return false;
    }

    setSubmitting(true);
    try {
      const review: Omit<Review, 'id'> = {
        ...reviewData,
        userId: user.uid,
        userName: user.displayName || 'Usuario Anónimo',
        userAvatar: user.photoURL || undefined,
        timestamp: new Date(),
        helpful: 0,
        reported: false,
      };

      // Simular envío a Firebase Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una implementación real:
      // const docRef = await addDoc(collection(db, 'reviews'), review);
      
      // Track analytics
      await analyticsManager.trackEvent('review_submitted', {
        rating: review.rating,
        targetType: review.targetType,
        targetId: review.targetId,
        commentLength: review.comment.length,
      });

      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'No se pudo enviar la reseña. Inténtalo de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  // Load reviews for a target
  const loadReviews = useCallback(async (
    targetType: 'user' | 'event' | 'app',
    targetId: string
  ): Promise<Review[]> => {
    setLoading(true);
    try {
      // Simular carga desde Firebase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En una implementación real:
      // const q = query(
      //   collection(db, 'reviews'),
      //   where('targetType', '==', targetType),
      //   where('targetId', '==', targetId),
      //   orderBy('timestamp', 'desc')
      // );
      // const querySnapshot = await getDocs(q);
      // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      
      // Mock data
      const mockReviews: Review[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'María García',
          userAvatar: 'https://i.pravatar.cc/150?img=1',
          rating: 5,
          comment: 'Excelente experiencia! Muy recomendado.',
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
          comment: 'Muy buena experiencia, aunque podría mejorar en algunos aspectos.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          helpful: 8,
          reported: false,
          targetType,
          targetId,
        },
      ];
      
      return mockReviews;
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark review as helpful
  const markReviewHelpful = useCallback(async (reviewId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Simular actualización en Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // En una implementación real:
      // await updateDoc(doc(db, 'reviews', reviewId), {
      //   helpful: increment(1)
      // });
      // await setDoc(doc(db, 'helpful_reviews', `${user.uid}_${reviewId}`), {
      //   userId: user.uid,
      //   reviewId,
      //   timestamp: new Date()
      // });
      
      await analyticsManager.trackEvent('review_marked_helpful', {
        reviewId,
        userId: user.uid,
      });
      
      return true;
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      return false;
    }
  }, [user]);

  // Report review
  const reportReview = useCallback(async (
    reviewId: string,
    reason: string
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Simular reporte en Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // En una implementación real:
      // await addDoc(collection(db, 'review_reports'), {
      //   reviewId,
      //   reportedBy: user.uid,
      //   reason,
      //   timestamp: new Date(),
      //   status: 'pending'
      // });
      
      await analyticsManager.trackEvent('review_reported', {
        reviewId,
        reason,
        reportedBy: user.uid,
      });
      
      return true;
    } catch (error) {
      console.error('Error reporting review:', error);
      return false;
    }
  }, [user]);

  // Get feedback statistics
  const getFeedbackStats = useCallback(async (
    targetType?: 'user' | 'event' | 'app',
    targetId?: string
  ): Promise<FeedbackStats> => {
    setLoading(true);
    try {
      // Simular carga de estadísticas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const stats: FeedbackStats = {
        totalReviews: 1247,
        averageRating: 4.3,
        ratingDistribution: {
          5: 523,
          4: 412,
          3: 201,
          2: 78,
          1: 33
        },
        recentFeedback: 89,
        responseRate: 92,
        improvementRate: 15,
        participationRate: 78,
        topCategories: [
          { name: 'Matchmaking', count: 156 },
          { name: 'Interfaz de Usuario', count: 134 },
          { name: 'Rendimiento', count: 98 },
          { name: 'Notificaciones', count: 76 },
          { name: 'Funciones Sociales', count: 65 }
        ]
      };
      
      return stats;
    } catch (error) {
      console.error('Error loading feedback stats:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {},
        recentFeedback: 0,
        responseRate: 0,
        improvementRate: 0,
        participationRate: 0,
        topCategories: [],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user can leave feedback/review
  const canUserLeaveFeedback = useCallback((
    targetType: 'user' | 'event' | 'app',
    targetId: string
  ): boolean => {
    if (!user) return false;
    
    // Users can't review themselves
    if (targetType === 'user' && targetId === user.uid) {
      return false;
    }
    
    // Add more business logic here
    // For example, check if user participated in the event
    
    return true;
  }, [user]);

  return {
    loading,
    submitting,
    submitFeedback,
    submitReview,
    loadReviews,
    markReviewHelpful,
    reportReview,
    getFeedbackStats,
    canUserLeaveFeedback,
  };
};

// Helper function to notify admins
const notifyAdmins = async (feedback: Omit<FeedbackData, 'id'>) => {
  try {
    // En una implementación real, enviarías notificaciones push a admins
    console.log('Notifying admins about critical feedback:', feedback);
    
    // Ejemplo con Firebase Cloud Functions:
    // await httpsCallable(functions, 'notifyAdminsCriticalFeedback')({
    //   feedback,
    //   priority: 'high'
    // });
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};