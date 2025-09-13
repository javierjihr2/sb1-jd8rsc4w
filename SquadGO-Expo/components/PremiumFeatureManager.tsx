import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';
import { useRouter } from 'expo-router';
import PremiumFeatureGate from './PremiumFeatureGate';
import SubscriptionManager from './SubscriptionManager';

interface FeatureUsageInfo {
  feature: string;
  displayName: string;
  icon: string;
  color: string;
  currentUsage: number;
  limit: number;
  resetPeriod: 'daily' | 'monthly' | 'never';
  description: string;
}

interface PremiumFeatureManagerProps {
  showUsageStats?: boolean;
  showUpgradePrompts?: boolean;
  compactMode?: boolean;
}

const { width } = Dimensions.get('window');

const FEATURE_USAGE_CONFIG: Record<string, Omit<FeatureUsageInfo, 'currentUsage' | 'limit'>> = {
  teams: {
    feature: 'teams',
    displayName: 'Equipos',
    icon: 'people',
    color: '#3B82F6',
    resetPeriod: 'never',
    description: 'Número máximo de equipos que puedes crear'
  },
  tournaments_per_month: {
    feature: 'tournaments_per_month',
    displayName: 'Torneos Mensuales',
    icon: 'trophy',
    color: '#F59E0B',
    resetPeriod: 'monthly',
    description: 'Torneos en los que puedes participar cada mes'
  },
  stats_history_days: {
    feature: 'stats_history_days',
    displayName: 'Historial de Estadísticas',
    icon: 'analytics',
    color: '#8B5CF6',
    resetPeriod: 'never',
    description: 'Días de historial de estadísticas disponibles'
  },
  chat_messages_per_day: {
    feature: 'chat_messages_per_day',
    displayName: 'Mensajes de Chat',
    icon: 'chatbubbles',
    color: '#10B981',
    resetPeriod: 'daily',
    description: 'Mensajes de chat que puedes enviar por día'
  },
  profile_views_per_day: {
    feature: 'profile_views_per_day',
    displayName: 'Vistas de Perfil',
    icon: 'eye',
    color: '#EF4444',
    resetPeriod: 'daily',
    description: 'Perfiles que puedes ver en detalle por día'
  },
  ai_coaching_sessions: {
    feature: 'ai_coaching_sessions',
    displayName: 'Sesiones de Coaching IA',
    icon: 'brain',
    color: '#EC4899',
    resetPeriod: 'monthly',
    description: 'Sesiones de coaching con IA por mes'
  },
  content_exports_per_month: {
    feature: 'content_exports_per_month',
    displayName: 'Exportaciones de Contenido',
    icon: 'download',
    color: '#06B6D4',
    resetPeriod: 'monthly',
    description: 'Exportaciones de contenido por mes'
  }
};

const PremiumFeatureManager: React.FC<PremiumFeatureManagerProps> = ({
  showUsageStats = true,
  showUpgradePrompts = true,
  compactMode = false
}) => {
  const {
    currentSubscription,
    isPremium,
    hasFeature,
    getFeatureLimit,
    trackFeatureUsage,
    isLoading
  } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [featureUsage, setFeatureUsage] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeatureUsage();
  }, [user]);

  useEffect(() => {
    if (user) {
      analyticsManager.trackEvent('premium_feature_manager_viewed', {
        userId: user.uid,
        planName: currentSubscription?.planName || 'free',
        isPremium
      });
    }
  }, [user, currentSubscription, isPremium]);

  const loadFeatureUsage = async () => {
    try {
      // In a real app, this would load from AsyncStorage or API
      // For now, we'll simulate some usage data
      const mockUsage = {
        teams: 2,
        tournaments_per_month: 1,
        chat_messages_per_day: 25,
        profile_views_per_day: 5,
        ai_coaching_sessions: 0,
        content_exports_per_month: 0
      };
      setFeatureUsage(mockUsage);
    } catch (error) {
      console.error('Error loading feature usage:', error);
    }
  };

  const refreshUsageData = async () => {
    setRefreshing(true);
    await loadFeatureUsage();
    setRefreshing(false);
  };

  const getUsageInfo = (featureKey: string): FeatureUsageInfo => {
    const config = FEATURE_USAGE_CONFIG[featureKey];
    const currentUsage = featureUsage[featureKey] || 0;
    const limit = getFeatureLimit(featureKey);
    
    return {
      ...config,
      currentUsage,
      limit
    };
  };

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 50) return '#10B981';
    if (percentage < 80) return '#F59E0B';
    return '#EF4444';
  };

  const handleFeatureUse = (feature: string) => {
    const usageInfo = getUsageInfo(feature);
    
    if (usageInfo.limit !== -1 && usageInfo.currentUsage >= usageInfo.limit) {
      if (showUpgradePrompts) {
        Alert.alert(
          'Límite Alcanzado',
          `Has alcanzado el límite de ${usageInfo.displayName}. Actualiza a premium para obtener más.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Actualizar',
              onPress: () => setShowUpgradeModal(true)
            }
          ]
        );
      }
      return false;
    }
    
    trackFeatureUsage(feature);
    
    // Update local usage
    setFeatureUsage(prev => ({
      ...prev,
      [feature]: (prev[feature] || 0) + 1
    }));
    
    return true;
  };

  const renderUsageCard = (featureKey: string) => {
    const usageInfo = getUsageInfo(featureKey);
    const percentage = getUsagePercentage(usageInfo.currentUsage, usageInfo.limit);
    const usageColor = getUsageColor(percentage);
    const isUnlimited = usageInfo.limit === -1;
    
    return (
      <View key={featureKey} style={[styles.usageCard, compactMode && styles.usageCardCompact]}>
        <View style={styles.usageHeader}>
          <View style={[styles.usageIcon, { backgroundColor: usageInfo.color }]}>
            <Ionicons name={usageInfo.icon as any} size={compactMode ? 16 : 20} color="white" />
          </View>
          
          <View style={styles.usageInfo}>
            <Text style={[styles.usageName, compactMode && styles.usageNameCompact]}>
              {usageInfo.displayName}
            </Text>
            
            <Text style={[styles.usageDescription, compactMode && styles.usageDescriptionCompact]}>
              {usageInfo.description}
            </Text>
          </View>
          
          <View style={styles.usageStats}>
            <Text style={[styles.usageNumbers, compactMode && styles.usageNumbersCompact]}>
              {usageInfo.currentUsage}{isUnlimited ? '' : `/${usageInfo.limit}`}
            </Text>
            
            {isUnlimited && (
              <View style={styles.unlimitedBadge}>
                <Text style={styles.unlimitedText}>∞</Text>
              </View>
            )}
          </View>
        </View>
        
        {!isUnlimited && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: usageColor
                  }
                ]}
              />
            </View>
            
            <Text style={[styles.progressText, { color: usageColor }]}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
        )}
        
        {usageInfo.resetPeriod !== 'never' && (
          <Text style={styles.resetInfo}>
            Se restablece {usageInfo.resetPeriod === 'daily' ? 'diariamente' : 'mensualmente'}
          </Text>
        )}
      </View>
    );
  };

  const renderPremiumPrompt = () => {
    if (isPremium || !showUpgradePrompts) return null;
    
    return (
      <TouchableOpacity
        style={styles.premiumPrompt}
        onPress={() => setShowUpgradeModal(true)}
      >
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          style={styles.premiumGradient}
        >
          <View style={styles.premiumContent}>
            <Ionicons name="diamond" size={32} color="white" />
            
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>Desbloquea Todo el Potencial</Text>
              <Text style={styles.premiumSubtitle}>
                Obtén acceso ilimitado a todas las funciones premium
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={24} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Actualizar Plan</Text>
          <TouchableOpacity
            onPress={() => setShowUpgradeModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <SubscriptionManager
          onSubscriptionSuccess={() => {
            setShowUpgradeModal(false);
            refreshUsageData();
          }}
          onSubscriptionError={(error) => {
            console.error('Subscription error:', error);
          }}
          showCurrentPlan={false}
        />
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando funciones...</Text>
      </View>
    );
  }

  const relevantFeatures = Object.keys(FEATURE_USAGE_CONFIG).filter(feature => {
    const limit = getFeatureLimit(feature);
    return limit > 0 || limit === -1; // Show features that have limits or are unlimited
  });

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        refreshing ? (
          <ActivityIndicator color="#8B5CF6" />
        ) : undefined
      }
    >
      {renderPremiumPrompt()}
      
      {showUsageStats && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Uso de Funciones</Text>
            
            <TouchableOpacity
              onPress={refreshUsageData}
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? '#9CA3AF' : '#8B5CF6'} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.usageGrid}>
            {relevantFeatures.map(renderUsageCard)}
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Suscripción</Text>
        
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionPlan}>
              {currentSubscription?.planName === 'creator' ? 'SquadGO Creador' : 
               currentSubscription?.planName === 'pro_team' ? 'Equipo Pro' : 'Plan Gratuito'}
            </Text>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: isPremium ? '#10B981' : '#6B7280' }
            ]}>
              <Text style={styles.statusText}>
                {isPremium ? 'PREMIUM' : 'GRATUITO'}
              </Text>
            </View>
          </View>
          
          {currentSubscription && (
            <Text style={styles.subscriptionExpiry}>
              {currentSubscription.isActive 
                ? `Renovación: ${new Date(currentSubscription.expiresAt).toLocaleDateString()}`
                : 'Suscripción expirada'
              }
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push('/settings/notifications')}
          >
            <Text style={styles.manageButtonText}>Gestionar Suscripción</Text>
            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderUpgradeModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  premiumPrompt: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
    marginLeft: 16,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  usageGrid: {
    gap: 12,
  },
  usageCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  usageCardCompact: {
    padding: 12,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  usageInfo: {
    flex: 1,
  },
  usageName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  usageNameCompact: {
    fontSize: 14,
  },
  usageDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  usageDescriptionCompact: {
    fontSize: 11,
  },
  usageStats: {
    alignItems: 'flex-end',
  },
  usageNumbers: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  usageNumbersCompact: {
    fontSize: 16,
  },
  unlimitedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  unlimitedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  resetInfo: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  subscriptionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  subscriptionExpiry: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
});

export default PremiumFeatureManager;
export { FEATURE_USAGE_CONFIG };
export type { FeatureUsageInfo };