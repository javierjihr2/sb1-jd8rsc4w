import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContextSimple';
import { Poll, PollOption } from '../lib/types';

interface PollComponentProps {
  poll: Poll;
  postId: string;
  onPollUpdate?: (updatedPoll: Poll) => void;
}

export default function PollComponent({ poll, postId, onPollUpdate }: PollComponentProps) {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Verificar si el usuario ya votó
  const hasUserVoted = poll.options.some(option => 
    option.votes.includes(user?.uid || '')
  );

  // Calcular total de votos
  const totalVotes = poll.options.reduce((total, option) => total + option.votes.length, 0);

  // Verificar si la encuesta ha expirado
  const isExpired = poll.expiresAt ? new Date() > poll.expiresAt : false;

  const handleOptionPress = (optionId: string) => {
    if (hasUserVoted || isExpired || voting) return;

    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const submitVote = async () => {
    if (!user || selectedOptions.length === 0 || hasUserVoted || isExpired) return;

    setVoting(true);
    try {
      // Actualizar las opciones con los nuevos votos
      const updatedOptions = poll.options.map(option => {
        if (selectedOptions.includes(option.id)) {
          return {
            ...option,
            votes: [...option.votes, user.uid]
          };
        }
        return option;
      });

      const updatedPoll = {
        ...poll,
        options: updatedOptions
      };

      // Actualizar en Firebase
      await updateDoc(doc(db, 'posts', postId), {
        poll: updatedPoll
      });

      // Notificar al componente padre
      onPollUpdate?.(updatedPoll);
      
      setSelectedOptions([]);
      Alert.alert('¡Voto registrado!', 'Tu voto ha sido registrado exitosamente');
    } catch (error) {
      console.error('Error votando en encuesta:', error);
      Alert.alert('Error', 'No se pudo registrar tu voto');
    } finally {
      setVoting(false);
    }
  };

  const getOptionPercentage = (option: PollOption) => {
    if (totalVotes === 0) return 0;
    return Math.round((option.votes.length / totalVotes) * 100);
  };

  const formatTimeRemaining = () => {
    if (!poll.expiresAt) return null;
    
    const now = new Date();
    const timeLeft = poll.expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expirada';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={20} color="#3b82f6" />
        <Text style={styles.question}>{poll.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {poll.options.map((option) => {
          const percentage = getOptionPercentage(option);
          const isSelected = selectedOptions.includes(option.id);
          const userVotedThis = option.votes.includes(user?.uid || '');

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                isSelected && styles.selectedOption,
                userVotedThis && styles.votedOption,
                (hasUserVoted || isExpired) && styles.disabledOption
              ]}
              onPress={() => handleOptionPress(option.id)}
              disabled={hasUserVoted || isExpired || voting}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  (isSelected || userVotedThis) && styles.selectedOptionText
                ]}>
                  {option.text}
                </Text>
                
                {(hasUserVoted || isExpired) && (
                  <View style={styles.voteInfo}>
                    <Text style={styles.voteCount}>{option.votes.length}</Text>
                    <Text style={styles.percentage}>{percentage}%</Text>
                  </View>
                )}
              </View>
              
              {(hasUserVoted || isExpired) && (
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={userVotedThis ? ['#3b82f6', '#1d4ed8'] : ['#374151', '#4b5563']}
                    style={[styles.progressFill, { width: `${percentage}%` }]}
                  />
                </View>
              )}
              
              {userVotedThis && (
                <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {!hasUserVoted && !isExpired && selectedOptions.length > 0 && (
        <TouchableOpacity
          style={[styles.voteButton, voting && styles.disabledButton]}
          onPress={submitVote}
          disabled={voting}
        >
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.voteButtonGradient}
          >
            {voting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.voteButtonText}>Votar</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.totalVotes}>
          {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        </Text>
        
        {poll.expiresAt && (
          <Text style={[
            styles.timeRemaining,
            isExpired && styles.expiredText
          ]}>
            {formatTimeRemaining()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  votedOption: {
    borderColor: '#10b981',
  },
  disabledOption: {
    opacity: 0.8,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  optionText: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    zIndex: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 3,
  },
  voteButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  voteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  voteButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalVotes: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#f59e0b',
  },
  expiredText: {
    color: '#ef4444',
  },
});