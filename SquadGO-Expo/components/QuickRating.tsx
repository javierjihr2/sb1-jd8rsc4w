import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeedback } from '../hooks/useFeedback';
import { analyticsManager } from '../lib/analytics';

const { width } = Dimensions.get('window');

interface QuickRatingProps {
  visible: boolean;
  onClose: () => void;
  targetType: 'user' | 'event' | 'app';
  targetId: string;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export const QuickRating: React.FC<QuickRatingProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  title = '¿Cómo fue tu experiencia?',
  subtitle = 'Tu opinión nos ayuda a mejorar',
  onSuccess,
}) => {
  const { submitReview, submitting } = useFeedback();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const resetForm = () => {
    setRating(0);
    setComment('');
    setShowCommentInput(false);
  };

  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
    
    // Si la calificación es 4 o menos, mostrar input de comentario
    if (selectedRating <= 4) {
      setShowCommentInput(true);
    } else {
      // Para 5 estrellas, enviar directamente
      submitRating(selectedRating, 'Excelente experiencia!');
    }
  };

  const submitRating = async (finalRating: number, finalComment: string) => {
    try {
      const success = await submitReview({
        rating: finalRating,
        comment: finalComment.trim() || 'Sin comentarios adicionales',
        targetType,
        targetId,
      });

      if (success) {
        await analyticsManager.trackEvent('quick_rating_submitted', {
          rating: finalRating,
          targetType,
          targetId,
          hasComment: finalComment.trim().length > 0,
        });

        Alert.alert(
          'Gracias por tu calificación',
          'Tu opinión es muy valiosa para nosotros',
          [{
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
              onSuccess?.();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Error submitting quick rating:', error);
    }
  };

  const handleSubmitWithComment = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    submitRating(rating, comment);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingSelect(star)}
            style={styles.starButton}
            disabled={submitting}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFD700' : '#DDD'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return 'Excelente';
      default: return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {renderStars()}

            {rating > 0 && (
              <Text style={styles.ratingText}>{getRatingText()}</Text>
            )}

            {showCommentInput && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  ¿Qué podríamos mejorar?
                </Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  placeholderTextColor="#999"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={styles.characterCount}>
                  {comment.length}/200
                </Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => submitRating(rating, '')}
                    disabled={submitting}
                  >
                    <Text style={styles.skipButtonText}>Omitir</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitWithComment}
                    disabled={submitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {submitting ? 'Enviando...' : 'Enviar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  commentSection: {
    width: '100%',
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 80,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});