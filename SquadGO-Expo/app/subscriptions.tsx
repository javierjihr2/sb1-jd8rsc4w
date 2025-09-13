import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { useRouter } from 'expo-router';
import { analyticsManager } from '../lib/analytics';
import SubscriptionManager from '../components/SubscriptionManager';
import PremiumFeatureManager from '../components/PremiumFeatureManager';
import PremiumFeatureGate, { PREMIUM_FEATURES } from '../components/PremiumFeatureGate';

const { width, height } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  monthlyPrice: string;
  description: string;
  features: string[];
  color: string;
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'creator',
    name: 'Creador',
    price: '$9.99',
    monthlyPrice: '/mes',
    description: 'La única suscripción que necesitas como creador',
    color: '#8B5CF6',
    popular: true,
    features: [
      'Acceso completo a todas las funciones',
      'Estadísticas avanzadas y análisis detallados',
      'Creación de contenido ilimitado',
      'Herramientas de streaming profesionales',
      'Monetización de contenido',
      'Torneos exclusivos para creadores',
      'Badge de creador verificado',
      'Coaching AI personalizado',
      'Temas exclusivos y personalización',
      'Soporte prioritario 24/7',
      'Acceso anticipado a nuevas funciones',
      'Colaboraciones con marcas',
      'Analytics de audiencia avanzados',
      'Herramientas de comunidad'
    ]
  }
];

const creatorBenefits = [
  {
    icon: 'trophy-outline',
    title: 'Torneos Exclusivos',
    description: 'Organiza torneos privados para tus suscriptores'
  },
  {
    icon: 'analytics-outline',
    title: 'Analytics Avanzados',
    description: 'Estadísticas detalladas de tu audiencia y contenido'
  },
  {
    icon: 'cash-outline',
    title: 'Monetización',
    description: 'Genera ingresos con tu contenido y suscripciones'
  },
  {
    icon: 'people-outline',
    title: 'Comunidad VIP',
    description: 'Acceso a grupos exclusivos de creadores'
  },
  {
    icon: 'videocam-outline',
    title: 'Streaming Pro',
    description: 'Herramientas avanzadas para streaming en vivo'
  },
  {
    icon: 'star-outline',
    title: 'Badge Verificado',
    description: 'Destaca como creador oficial verificado'
  }
];

export default function SubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState<'plans' | 'features' | 'usage'>('plans');
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await analyticsManager.trackEvent('subscription_screen_viewed', {
          user_id: user?.id,
          current_plan: subscription?.planId || 'free'
        });
      } catch (error) {
        console.error('Error tracking subscription screen view:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeScreen();
  }, [user, subscription]);

  const handleTabChange = async (tab: 'plans' | 'features' | 'usage') => {
    setActiveTab(tab);
    await analyticsManager.trackEvent('subscription_tab_changed', {
      tab,
      user_id: user?.id
    });
  };

  if (isLoading || subscriptionLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando suscripciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubscribe = (planId: string) => {
    // Handle subscription logic through SubscriptionManager
    console.log('Subscribing to plan:', planId);
  };

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <View
      key={plan.id}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: plan.popular ? 2 : 1,
        borderColor: plan.popular ? plan.color : '#374151'
      }}
    >
      {plan.popular && (
        <View style={{
          position: 'absolute',
          top: -10,
          left: 20,
          backgroundColor: plan.color,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600'
          }}>
            MÁS POPULAR
          </Text>
        </View>
      )}
      
      <View style={{
        alignItems: 'center',
        marginBottom: 20
      }}>
        <Text style={{
          color: 'white',
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 4
        }}>
          {plan.name}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          marginBottom: 8
        }}>
          <Text style={{
            color: plan.color,
            fontSize: 36,
            fontWeight: 'bold'
          }}>
            {plan.price}
          </Text>
          <Text style={{
            color: '#9ca3af',
            fontSize: 16,
            marginLeft: 4
          }}>
            {plan.monthlyPrice}
          </Text>
        </View>
        
        <Text style={{
          color: '#9ca3af',
          fontSize: 14,
          textAlign: 'center'
        }}>
          {plan.description}
        </Text>
      </View>
      
      <View style={{ marginBottom: 20 }}>
        {plan.features.map((feature, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={plan.color}
              style={{ marginRight: 12 }}
            />
            <Text style={{
              color: 'white',
              fontSize: 14,
              flex: 1
            }}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        onPress={() => handleSubscribe(plan.id)}
        style={{
          backgroundColor: plan.color,
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{
          color: 'white',
          fontSize: 16,
          fontWeight: '600'
        }}>
          Suscribirse Ahora
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBenefitCard = (benefit: any, index: number) => (
    <View
      key={index}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        width: 200,
        alignItems: 'center'
      }}
    >
      <View style={{
        backgroundColor: '#3b82f6',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
      }}>
        <Ionicons name={benefit.icon as any} size={28} color="white" />
      </View>
      
      <Text style={{
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center'
      }}>
        {benefit.title}
      </Text>
      
      <Text style={{
        color: '#9ca3af',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16
      }}>
        {benefit.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suscripciones</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
          onPress={() => handleTabChange('plans')}
        >
          <Ionicons 
            name="card-outline" 
            size={20} 
            color={activeTab === 'plans' ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
            Planes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.activeTab]}
          onPress={() => handleTabChange('features')}
        >
          <Ionicons 
            name="star-outline" 
            size={20} 
            color={activeTab === 'features' ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'features' && styles.activeTabText]}>
            Características
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'usage' && styles.activeTab]}
          onPress={() => handleTabChange('usage')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={activeTab === 'usage' ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'usage' && styles.activeTabText]}>
            Uso
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'plans' && (
          <SubscriptionManager />
        )}
        
        {activeTab === 'features' && (
          <View style={styles.featuresTab}>
            <Text style={styles.sectionTitle}>Características Premium</Text>
            <Text style={styles.sectionDescription}>
              Descubre todas las funcionalidades disponibles con tu suscripción
            </Text>
            
            {Object.entries(PREMIUM_FEATURES).map(([key, feature]) => (
              <PremiumFeatureGate
                key={key}
                feature={key as keyof typeof PREMIUM_FEATURES}
                showUpgradePrompt={false}
              >
                <View style={styles.featureCard}>
                  <View style={styles.featureHeader}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                    <Text style={styles.featureTitle}>{feature.name}</Text>
                  </View>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                  <Text style={styles.featurePlan}>Plan: {feature.requiredPlan}</Text>
                </View>
              </PremiumFeatureGate>
            ))}
          </View>
        )}
        
        {activeTab === 'usage' && (
          <PremiumFeatureManager />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
  },
  featuresTab: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  featureDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 8,
  },
  featurePlan: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});