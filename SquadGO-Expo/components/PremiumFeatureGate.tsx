import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';
import { useRouter } from 'expo-router';

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredPlan: string;
  benefits: string[];
  comingSoon?: boolean;
}

interface PremiumFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  customMessage?: string;
  onUpgrade?: () => void;
}

const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  advanced_stats: {
    id: 'advanced_stats',
    name: 'Estadísticas Avanzadas',
    description: 'Análisis detallado de tu rendimiento con métricas profesionales',
    icon: 'analytics',
    color: '#3B82F6',
    requiredPlan: 'creator',
    benefits: [
      'Análisis de K/D ratio por mapa',
      'Estadísticas de supervivencia',
      'Comparación con jugadores similares',
      'Tendencias de mejora',
      'Reportes exportables'
    ]
  },
  ai_coaching: {
    id: 'ai_coaching',
    name: 'Coaching con IA',
    description: 'Entrenamiento personalizado con inteligencia artificial',
    icon: 'brain',
    color: '#8B5CF6',
    requiredPlan: 'creator',
    benefits: [
      'Análisis automático de gameplay',
      'Recomendaciones personalizadas',
      'Planes de entrenamiento adaptativos',
      'Feedback en tiempo real',
      'Seguimiento de progreso'
    ]
  },
  exclusive_themes: {
    id: 'exclusive_themes',
    name: 'Temas Exclusivos',
    description: 'Personaliza tu experiencia con temas únicos',
    icon: 'color-palette',
    color: '#F59E0B',
    requiredPlan: 'creator',
    benefits: [
      'Más de 20 temas exclusivos',
      'Personalización de colores',
      'Iconos animados',
      'Fondos dinámicos',
      'Efectos visuales únicos'
    ]
  },
  priority_tournaments: {
    id: 'priority_tournaments',
    name: 'Torneos Prioritarios',
    description: 'Acceso prioritario a torneos exclusivos',
    icon: 'trophy',
    color: '#EF4444',
    requiredPlan: 'creator',
    benefits: [
      'Registro prioritario en torneos',
      'Torneos exclusivos para premium',
      'Premios aumentados',
      'Acceso a torneos profesionales',
      'Invitaciones especiales'
    ]
  },
  content_creation: {
    id: 'content_creation',
    name: 'Herramientas de Creación',
    description: 'Crea contenido profesional para tus redes',
    icon: 'camera',
    color: '#10B981',
    requiredPlan: 'creator',
    benefits: [
      'Editor de clips avanzado',
      'Plantillas profesionales',
      'Efectos y filtros exclusivos',
      'Exportación en alta calidad',
      'Integración con redes sociales'
    ]
  },
  streaming_tools: {
    id: 'streaming_tools',
    name: 'Herramientas de Streaming',
    description: 'Todo lo que necesitas para hacer streaming profesional',
    icon: 'videocam',
    color: '#EC4899',
    requiredPlan: 'creator',
    benefits: [
      'Overlays personalizados',
      'Chat integrado',
      'Alertas de donaciones',
      'Estadísticas en vivo',
      'Grabación automática'
    ]
  },
  monetization: {
    id: 'monetization',
    name: 'Monetización',
    description: 'Genera ingresos con tu contenido y habilidades',
    icon: 'cash',
    color: '#059669',
    requiredPlan: 'creator',
    benefits: [
      'Donaciones de seguidores',
      'Suscripciones de pago',
      'Venta de coaching',
      'Marketplace de servicios',
      'Comisiones por referidos'
    ]
  },
  verified_profile: {
    id: 'verified_profile',
    name: 'Perfil Verificado',
    description: 'Badge de verificación y perfil destacado',
    icon: 'checkmark-circle',
    color: '#3B82F6',
    requiredPlan: 'creator',
    benefits: [
      'Badge de verificación azul',
      'Perfil destacado en búsquedas',
      'Mayor credibilidad',
      'Acceso a funciones beta',
      'Soporte prioritario'
    ]
  }
};

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  customMessage,
  onUpgrade
}) => {
  const { hasFeature, isPremium, currentSubscription } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const featureData = PREMIUM_FEATURES[feature];
  const hasAccess = hasFeature(feature);

  // Si el usuario tiene acceso, mostrar el contenido
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no se debe mostrar el prompt de upgrade, no mostrar nada
  if (!showUpgradePrompt) {
    return null;
  }

  const handleUpgradePress = () => {
    analyticsManager.trackEvent('premium_feature_gate_clicked', {
      userId: user?.uid,
      feature,
      currentPlan: currentSubscription?.planId || 'free'
    });
    
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleSubscribePress = () => {
    setShowUpgradeModal(false);
    router.push('/subscriptions');
    
    analyticsManager.trackEvent('premium_upgrade_initiated', {
      userId: user?.uid,
      feature,
      source: 'feature_gate'
    });
  };

  const renderUpgradePrompt = () => (
    <View style={styles.upgradePrompt}>
      <LinearGradient
        colors={['#8B5CF6', '#3B82F6']}
        style={styles.upgradeGradient}
      >
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={32} color="white" />
        </View>
        
        <Text style={styles.upgradeTitle}>
          {customMessage || `${featureData?.name || 'Función Premium'} Bloqueada`}
        </Text>
        
        <Text style={styles.upgradeDescription}>
          {featureData?.description || 'Esta función requiere una suscripción premium'}
        </Text>
        
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
        >
          <Ionicons name="diamond" size={20} color="#8B5CF6" style={styles.upgradeButtonIcon} />
          <Text style={styles.upgradeButtonText}>Desbloquear Premium</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
    >
      <BlurView intensity={50} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Función Premium</Text>
              <TouchableOpacity
                onPress={() => setShowUpgradeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {featureData && (
                <>
                  <View style={styles.featureHeader}>
                    <View style={[styles.featureIcon, { backgroundColor: featureData.color }]}>
                      <Ionicons name={featureData.icon as any} size={32} color="white" />
                    </View>
                    
                    <Text style={styles.featureName}>{featureData.name}</Text>
                    <Text style={styles.featureDescription}>{featureData.description}</Text>
                  </View>
                  
                  <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>¿Qué incluye?</Text>
                    
                    {featureData.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>Plan Requerido</Text>
                    <View style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>SquadGO Creador</Text>
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.planPrice}>$4.99<Text style={styles.planPeriod}>/mes</Text></Text>
                      <Text style={styles.planDescription}>
                        Acceso completo a todas las funciones premium
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={handleSubscribePress}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#3B82F6']}
                  style={styles.subscribeGradient}
                >
                  <Text style={styles.subscribeButtonText}>Suscribirse Ahora</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Tal vez después</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );

  return (
    <>
      {renderUpgradePrompt()}
      {renderUpgradeModal()}
    </>
  );
};

const styles = StyleSheet.create({
  upgradePrompt: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButtonIcon: {
    marginRight: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  featureHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#D1D5DB',
    marginLeft: 12,
    flex: 1,
  },
  planInfo: {
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  popularBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  planDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default PremiumFeatureGate;
export { PREMIUM_FEATURES };
export type { PremiumFeature };