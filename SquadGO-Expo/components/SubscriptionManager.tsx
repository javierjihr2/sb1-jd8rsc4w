import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';
import PaymentManager from './PaymentManager';
import { PREMIUM_FEATURES } from './PremiumFeatureGate';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice?: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  color: string;
  popular?: boolean;
  savings?: string;
  badge?: string;
}

interface SubscriptionManagerProps {
  onSubscriptionSuccess?: (planId: string) => void;
  onSubscriptionError?: (error: string) => void;
  showCurrentPlan?: boolean;
  allowDowngrade?: boolean;
}

const { width } = Dimensions.get('window');

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Gratuito',
    price: 0,
    period: 'month',
    description: 'Perfecto para empezar tu journey gaming',
    features: [
      'Estadísticas básicas',
      'Búsqueda de equipos',
      'Chat básico',
      'Perfil público',
      'Hasta 3 equipos'
    ],
    color: '#6B7280'
  },
  {
    id: 'creator_monthly',
    name: 'creator',
    displayName: 'Creador',
    price: 4.99,
    period: 'month',
    description: 'Para gamers serios que buscan destacar',
    features: [
      'Todas las funciones gratuitas',
      'Estadísticas avanzadas con IA',
      'Coaching personalizado',
      'Temas exclusivos',
      'Perfil verificado',
      'Torneos prioritarios',
      'Herramientas de streaming',
      'Monetización de contenido',
      'Soporte prioritario'
    ],
    color: '#8B5CF6',
    popular: true,
    badge: 'MÁS POPULAR'
  },
  {
    id: 'creator_yearly',
    name: 'creator',
    displayName: 'Creador Anual',
    price: 39.99,
    originalPrice: 59.88,
    period: 'year',
    description: 'El mejor valor para creadores comprometidos',
    features: [
      'Todas las funciones del plan Creador',
      'Acceso beta a nuevas funciones',
      'Sesiones de coaching 1-a-1',
      'Análisis de mercado exclusivos',
      'Networking con pros',
      'Certificación SquadGO',
      'API personalizada',
      'Soporte VIP 24/7'
    ],
    color: '#F59E0B',
    savings: 'Ahorra 33%',
    badge: 'MEJOR VALOR'
  },
  {
    id: 'pro_team',
    name: 'pro_team',
    displayName: 'Equipo Pro',
    price: 19.99,
    period: 'month',
    description: 'Para equipos profesionales y organizaciones',
    features: [
      'Hasta 10 miembros incluidos',
      'Dashboard de equipo avanzado',
      'Análisis de rendimiento grupal',
      'Gestión de torneos',
      'Branding personalizado',
      'Integración con sponsors',
      'Manager dedicado',
      'Reportes ejecutivos'
    ],
    color: '#EF4444',
    badge: 'EQUIPOS'
  }
];

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  onSubscriptionSuccess,
  onSubscriptionError,
  showCurrentPlan = true,
  allowDowngrade = false
}) => {
  const { currentSubscription, isLoading, subscribeToPlan, cancelSubscription } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    analyticsManager.trackEvent('subscription_manager_viewed', {
      userId: user?.uid,
      currentPlan: currentSubscription?.planId || 'free'
    });
  }, []);

  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => {
    if (billingCycle === 'monthly') {
      return plan.period === 'month';
    } else {
      return plan.period === 'year' || plan.id === 'free' || plan.id === 'pro_team';
    }
  });

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      handleFreePlan();
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    analyticsManager.trackEvent('subscription_plan_selected', {
      userId: user?.uid,
      planId,
      planName: plan.name,
      price: plan.price,
      currentPlan: currentSubscription?.planId || 'free'
    });

    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handleFreePlan = async () => {
    if (currentSubscription && currentSubscription.planId !== 'free') {
      Alert.alert(
        'Cancelar Suscripción',
        '¿Estás seguro de que quieres cancelar tu suscripción premium? Perderás acceso a todas las funciones premium.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              try {
                setProcessing(true);
                await cancelSubscription();
                
                analyticsManager.trackEvent('subscription_cancelled', {
                  userId: user?.uid,
                  previousPlan: currentSubscription.planId,
                  reason: 'downgrade_to_free'
                });
                
                Alert.alert('Éxito', 'Tu suscripción ha sido cancelada.');
              } catch (error) {
                console.error('Error cancelling subscription:', error);
                Alert.alert('Error', 'No se pudo cancelar la suscripción.');
                onSubscriptionError?.('Error al cancelar suscripción');
              } finally {
                setProcessing(false);
              }
            }
          }
        ]
      );
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!selectedPlan) return;

    try {
      setProcessing(true);
      await subscribeToPlan(selectedPlan, paymentMethodId);
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
      
      analyticsManager.trackEvent('subscription_completed', {
        userId: user?.uid,
        planId: selectedPlan,
        planName: plan?.name,
        price: plan?.price,
        paymentMethod: 'stripe'
      });
      
      setShowPayment(false);
      setSelectedPlan(null);
      
      Alert.alert(
        '¡Bienvenido a Premium!',
        `Tu suscripción a ${plan?.displayName} está activa. ¡Disfruta de todas las funciones premium!`
      );
      
      onSubscriptionSuccess?.(selectedPlan);
    } catch (error) {
      console.error('Error processing subscription:', error);
      Alert.alert('Error', 'No se pudo procesar la suscripción. Inténtalo de nuevo.');
      onSubscriptionError?.('Error al procesar suscripción');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Error de Pago', error);
    onSubscriptionError?.(error);
  };

  const renderCurrentPlan = () => {
    if (!showCurrentPlan || !currentSubscription) return null;

    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.name === currentSubscription.planId);
    if (!currentPlan) return null;

    return (
      <View style={styles.currentPlanContainer}>
        <Text style={styles.currentPlanTitle}>Plan Actual</Text>
        <View style={[styles.currentPlanCard, { borderColor: currentPlan.color }]}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanName}>{currentPlan.displayName}</Text>
            <View style={[styles.currentPlanBadge, { backgroundColor: currentPlan.color }]}>
              <Text style={styles.currentPlanBadgeText}>ACTIVO</Text>
            </View>
          </View>
          
          <Text style={styles.currentPlanPrice}>
            ${currentPlan.price}<Text style={styles.currentPlanPeriod}>/{currentPlan.period === 'month' ? 'mes' : 'año'}</Text>
          </Text>
          
          {currentSubscription.expiresAt && (
            <Text style={styles.currentPlanExpiry}>
              Renovación: {new Date(currentSubscription.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderBillingToggle = () => (
    <View style={styles.billingToggleContainer}>
      <Text style={styles.billingToggleTitle}>Ciclo de Facturación</Text>
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[
            styles.billingOption,
            billingCycle === 'monthly' && styles.billingOptionActive
          ]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[
            styles.billingOptionText,
            billingCycle === 'monthly' && styles.billingOptionTextActive
          ]}>Mensual</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.billingOption,
            billingCycle === 'yearly' && styles.billingOptionActive
          ]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={[
            styles.billingOptionText,
            billingCycle === 'yearly' && styles.billingOptionTextActive
          ]}>Anual</Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>-33%</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentSubscription?.planId === plan.name;
    const canSelect = !isCurrentPlan && (allowDowngrade || plan.price >= (currentSubscription?.price || 0));

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.planCardCurrent,
          plan.popular && styles.planCardPopular
        ]}
        onPress={() => canSelect && handlePlanSelect(plan.id)}
        disabled={!canSelect || processing}
      >
        <LinearGradient
          colors={plan.popular ? ['#8B5CF6', '#3B82F6'] : ['#1F2937', '#111827']}
          style={styles.planCardGradient}
        >
          {plan.badge && (
            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.planBadgeText}>{plan.badge}</Text>
            </View>
          )}
          
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.displayName}</Text>
            {plan.savings && (
              <Text style={styles.planSavings}>{plan.savings}</Text>
            )}
          </View>
          
          <View style={styles.planPricing}>
            <Text style={styles.planPrice}>
              ${plan.price}
              <Text style={styles.planPeriod}>/{plan.period === 'month' ? 'mes' : 'año'}</Text>
            </Text>
            {plan.originalPrice && (
              <Text style={styles.planOriginalPrice}>${plan.originalPrice}</Text>
            )}
          </View>
          
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.planFeatures}>
            {plan.features.slice(0, 5).map((feature, index) => (
              <View key={index} style={styles.planFeature}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
            {plan.features.length > 5 && (
              <Text style={styles.planMoreFeatures}>
                +{plan.features.length - 5} funciones más
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.planButton,
              isCurrentPlan && styles.planButtonCurrent,
              !canSelect && styles.planButtonDisabled
            ]}
            onPress={() => canSelect && handlePlanSelect(plan.id)}
            disabled={!canSelect || processing}
          >
            {processing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={[
                styles.planButtonText,
                isCurrentPlan && styles.planButtonTextCurrent
              ]}>
                {isCurrentPlan ? 'Plan Actual' : plan.price === 0 ? 'Gratis' : 'Suscribirse'}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando planes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderCurrentPlan()}
      {renderBillingToggle()}
      
      <View style={styles.plansContainer}>
        {filteredPlans.map(renderPlanCard)}
      </View>
      
      <View style={styles.featuresPreview}>
        <Text style={styles.featuresTitle}>Funciones Premium Destacadas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(PREMIUM_FEATURES).slice(0, 4).map((feature, index) => (
            <View key={index} style={[styles.featureCard, { borderColor: feature.color }]}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      
      {showPayment && selectedPlan && (
        <PaymentManager
          visible={showPayment}
          amount={SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price || 0}
          description={`Suscripción ${SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.displayName}`}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={() => {
            setShowPayment(false);
            setSelectedPlan(null);
          }}
        />
      )}
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
  currentPlanContainer: {
    padding: 16,
    marginBottom: 16,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  currentPlanCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  currentPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentPlanBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  currentPlanPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  currentPlanPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  currentPlanExpiry: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  billingToggleContainer: {
    padding: 16,
    marginBottom: 16,
  },
  billingToggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  billingOptionActive: {
    backgroundColor: '#8B5CF6',
  },
  billingOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  billingOptionTextActive: {
    color: 'white',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  planCardCurrent: {
    opacity: 0.7,
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  planCardGradient: {
    padding: 20,
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  planOriginalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 16,
    lineHeight: 22,
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 8,
    flex: 1,
  },
  planMoreFeatures: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
    marginTop: 4,
  },
  planButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonCurrent: {
    backgroundColor: '#374151',
  },
  planButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  planButtonTextCurrent: {
    color: '#9CA3AF',
  },
  featuresPreview: {
    padding: 16,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  featureCard: {
    width: width * 0.7,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});

export default SubscriptionManager;
export { SUBSCRIPTION_PLANS };
export type { SubscriptionPlan };