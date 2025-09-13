import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

const { width } = Dimensions.get('window');

interface FeedbackData {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  category: 'app' | 'feature' | 'bug' | 'suggestion';
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface FeedbackSystemProps {
  visible: boolean;
  onClose: () => void;
  targetType?: 'app' | 'user' | 'event';
  targetId?: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  visible,
  onClose,
  targetType = 'app',
  targetId,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<FeedbackData['category']>('app');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { key: 'app', label: 'Aplicación General', icon: 'phone-portrait-outline' },
    { key: 'feature', label: 'Nueva Funcionalidad', icon: 'bulb-outline' },
    { key: 'bug', label: 'Reportar Error', icon: 'bug-outline' },
    { key: 'suggestion', label: 'Sugerencia', icon: 'chatbubble-outline' },
  ];

  const resetForm = () => {
    setRating(0);
    setComment('');
    setCategory('app');
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'Por favor proporciona un comentario más detallado (mínimo 10 caracteres)');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: Omit<FeedbackData, 'id'> = {
        userId: user?.uid || 'anonymous',
        rating,
        comment: comment.trim(),
        category,
        timestamp: new Date(),
        status: 'pending',
      };

      // Simular envío a Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track analytics
      await analyticsManager.trackEvent('feedback_submitted', {
        rating,
        category,
        targetType,
        targetId,
        commentLength: comment.length,
      });

      Alert.alert(
        'Gracias por tu feedback',
        'Tu opinión es muy importante para nosotros. La revisaremos pronto.',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'No se pudo enviar el feedback. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#DDD'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCategories = () => {
    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categoría</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                category === cat.key && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat.key as FeedbackData['category'])}
            >
              <Ionicons
                name={cat.icon as any}
                size={24}
                color={category === cat.key ? '#007AFF' : '#666'}
              />
              <Text
                style={[
                  styles.categoryText,
                  category === cat.key && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Enviar Feedback</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cómo calificarías tu experiencia?</Text>
            {renderStars()}
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </Text>
            )}
          </View>

          {/* Category Section */}
          {renderCategories()}

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuéntanos más</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Describe tu experiencia, sugerencias o problemas..."
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 caracteres
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || comment.trim().length < 10 || isSubmitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={submitFeedback}
            disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  categoriesContainer: {
    marginVertical: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: (width - 60) / 2,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  categoryTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});