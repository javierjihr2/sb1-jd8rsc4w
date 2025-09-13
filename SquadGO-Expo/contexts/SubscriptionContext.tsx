import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  originalPrice?: number;
  period: 'month' | 'year';
  features: string[];
  color: string;
  popular?: boolean;
  savings?: string;
  badge?: string;
}

export interface UserSubscription {
  planId: string;
  planName: string;
  price: number;
  startDate: Date;
  expiresAt: Date;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethodId?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
}

interface SubscriptionContextType {
  // Subscription state
  currentSubscription: UserSubscription | null;
  availablePlans: SubscriptionPlan[];
  isLoading: boolean;
  isPremium: boolean;
  
  // Actions
  subscribeToPlan: (planId: string, paymentMethodId?: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  renewSubscription: () => Promise<boolean>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  
  // Premium features check
  hasFeature: (feature: string) => boolean;
  isFeatureAvailable: (feature: string) => boolean;
  getFeatureLimit: (feature: string) => number;
  trackFeatureUsage: (feature: string) => void;
  getRemainingDays: () => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Available subscription plans
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Gratuito',
    price: 0,
    period: 'month',
    features: [
      'basic_stats',
      'team_search',
      'basic_chat',
      'public_profile',
      'basic_tournaments'
    ],
    color: '#6B7280'
  },
  {
    id: 'creator_monthly',
    name: 'creator',
    displayName: 'Creador',
    price: 4.99,
    period: 'month',
    features: [
      'advanced_stats',
      'ai_coaching',
      'exclusive_themes',
      'verified_profile',
      'priority_tournaments',
      'streaming_tools',
      'monetization',
      'priority_support'
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
    features: [
      'advanced_stats',
      'ai_coaching',
      'exclusive_themes',
      'verified_profile',
      'priority_tournaments',
      'streaming_tools',
      'monetization',
      'beta_access',
      'personal_coaching',
      'market_analysis',
      'pro_networking',
      'certification',
      'custom_api',
      'vip_support'
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
    features: [
      'team_dashboard',
      'group_analytics',
      'tournament_management',
      'custom_branding',
      'sponsor_integration',
      'dedicated_manager',
      'executive_reports',
      'multi_member_access'
    ],
    color: '#EF4444',
    badge: 'EQUIPOS'
  }
];

// Feature limits and configurations
const FEATURE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    teams: 3,
    tournaments_per_month: 2,
    stats_history_days: 30,
    chat_messages_per_day: 50,
    profile_views_per_day: 10
  },
  creator: {
    teams: 10,
    tournaments_per_month: -1, // unlimited
    stats_history_days: 365,
    chat_messages_per_day: -1,
    profile_views_per_day: -1,
    ai_coaching_sessions: 5,
    content_exports_per_month: 20
  },
  pro_team: {
    teams: -1,
    tournaments_per_month: -1,
    stats_history_days: -1,
    chat_messages_per_day: -1,
    profile_views_per_day: -1,
    team_members: 10,
    custom_reports_per_month: 10
  }
};

// Premium features mapping
const PREMIUM_FEATURES: Record<string, string[]> = {
  free: [
    'basic_stats',
    'team_search',
    'basic_chat',
    'public_profile',
    'basic_tournaments'
  ],
  creator: [
    'basic_stats',
    'team_search',
    'basic_chat',
    'public_profile',
    'basic_tournaments',
    'advanced_stats',
    'ai_coaching',
    'exclusive_themes',
    'verified_profile',
    'priority_tournaments',
    'streaming_tools',
    'monetization',
    'content_creation',
    'priority_support',
    'beta_access',
    'personal_coaching',
    'market_analysis',
    'pro_networking',
    'certification',
    'custom_api',
    'vip_support'
  ],
  pro_team: [
    'basic_stats',
    'team_search',
    'basic_chat',
    'public_profile',
    'basic_tournaments',
    'advanced_stats',
    'team_dashboard',
    'group_analytics',
    'tournament_management',
    'custom_branding',
    'sponsor_integration',
    'dedicated_manager',
    'executive_reports',
    'multi_member_access'
  ]
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [featureUsage, setFeatureUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadSubscription();
      loadFeatureUsage();
    } else {
      setCurrentSubscription(null);
      setFeatureUsage({});
      setIsLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(`subscription_${user?.uid}`);
      if (stored) {
        const subscription = JSON.parse(stored);
        subscription.startDate = new Date(subscription.startDate);
        subscription.expiresAt = new Date(subscription.expiresAt);
        
        // Check if subscription is still active
        const now = new Date();
        const isExpired = subscription.expiresAt <= now;
        
        subscription.isActive = !isExpired && subscription.status === 'active';
        
        if (isExpired && subscription.status === 'active') {
          subscription.status = 'expired';
          await saveSubscription(subscription);
        }
        
        setCurrentSubscription(subscription);
        
        // Track subscription status
        analyticsManager.trackEvent('subscription_loaded', {
          userId: user?.uid,
          planId: subscription.planId,
          planName: subscription.planName,
          status: subscription.status,
          isActive: subscription.isActive
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      analyticsManager.trackEvent('subscription_load_error', {
        userId: user?.uid,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeatureUsage = async () => {
    try {
      const stored = await AsyncStorage.getItem(`feature_usage_${user?.uid}`);
      if (stored) {
        const usage = JSON.parse(stored);
        setFeatureUsage(usage);
      }
    } catch (error) {
      console.error('Error loading feature usage:', error);
    }
  };

  const saveSubscription = async (subscription: UserSubscription) => {
    try {
      await AsyncStorage.setItem(
        `subscription_${user?.uid}`,
        JSON.stringify(subscription)
      );
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const saveFeatureUsage = async (usage: Record<string, number>) => {
    try {
      await AsyncStorage.setItem(
        `feature_usage_${user?.uid}`,
        JSON.stringify(usage)
      );
    } catch (error) {
      console.error('Error saving feature usage:', error);
    }
  };



  const subscribeToPlan = async (planId: string, paymentMethodId?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Track subscription attempt
      analyticsManager.trackEvent('subscription_attempt', {
        userId: user.uid,
        planId,
        planName: plan.name,
        price: plan.price,
        period: plan.period
      });
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const startDate = new Date();
      const expiresAt = new Date();
      
      if (plan.period === 'month') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      const newSubscription: UserSubscription = {
        planId,
        planName: plan.name,
        price: plan.price,
        startDate,
        expiresAt,
        isActive: true,
        autoRenew: true,
        paymentMethodId,
        status: 'active'
      };

      setCurrentSubscription(newSubscription);
      await saveSubscription(newSubscription);
      
      // Track successful subscription
      analyticsManager.trackEvent('subscription_success', {
        userId: user.uid,
        planId,
        planName: plan.name,
        price: plan.price,
        period: plan.period
      });
      
      Alert.alert(
        '¡Suscripción Exitosa!',
        `Te has suscrito a ${plan.displayName}. ¡Disfruta de todas las funciones premium!`
      );
      
      return true;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      
      // Track subscription error
      analyticsManager.trackEvent('subscription_error', {
        userId: user?.uid,
        planId,
        error: error.message
      });
      
      Alert.alert(
        'Error de Suscripción',
        'No se pudo procesar tu suscripción. Inténtalo de nuevo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }
      
      // Track cancellation attempt
      analyticsManager.trackEvent('subscription_cancel_attempt', {
        userId: user?.uid,
        planId: currentSubscription.planId,
        planName: currentSubscription.planName
      });
      
      // Simulate cancellation process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSubscription = {
        ...currentSubscription,
        autoRenew: false,
        status: 'cancelled' as const
      };
      
      setCurrentSubscription(updatedSubscription);
      await saveSubscription(updatedSubscription);
      
      // Track successful cancellation
      analyticsManager.trackEvent('subscription_cancelled', {
        userId: user?.uid,
        planId: currentSubscription.planId,
        planName: currentSubscription.planName
      });
      
      Alert.alert(
        'Suscripción Cancelada',
        'Tu suscripción se cancelará al final del período actual.'
      );
      
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      
      analyticsManager.trackEvent('subscription_cancel_error', {
        userId: user?.uid,
        error: error.message
      });
      
      Alert.alert(
        'Error',
        'No se pudo cancelar tu suscripción. Inténtalo de nuevo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const renewSubscription = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!currentSubscription) {
        throw new Error('No subscription found');
      }
      
      // Track renewal attempt
      analyticsManager.trackEvent('subscription_renew_attempt', {
        userId: user?.uid,
        planId: currentSubscription.planId,
        planName: currentSubscription.planName
      });
      
      // Simulate renewal process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId);
      if (!plan) {
        throw new Error('Plan not found');
      }
      
      const newExpiresAt = new Date();
      if (plan.period === 'month') {
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
      } else {
        newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
      }
      
      const renewedSubscription = {
        ...currentSubscription,
        expiresAt: newExpiresAt,
        isActive: true,
        autoRenew: true,
        status: 'active' as const
      };
      
      setCurrentSubscription(renewedSubscription);
      await saveSubscription(renewedSubscription);
      
      // Track successful renewal
      analyticsManager.trackEvent('subscription_renewed', {
        userId: user?.uid,
        planId: currentSubscription.planId,
        planName: currentSubscription.planName
      });
      
      Alert.alert(
        'Suscripción Renovada',
        'Tu suscripción ha sido renovada exitosamente.'
      );
      
      return true;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      
      analyticsManager.trackEvent('subscription_renew_error', {
        userId: user?.uid,
        error: error.message
      });
      
      Alert.alert(
        'Error de Renovación',
        'No se pudo renovar tu suscripción. Inténtalo de nuevo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }
      
      // Simulate payment method update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSubscription = {
        ...currentSubscription,
        paymentMethodId
      };
      
      setCurrentSubscription(updatedSubscription);
      await saveSubscription(updatedSubscription);
      
      analyticsManager.trackEvent('payment_method_updated', {
        userId: user?.uid,
        planId: currentSubscription.planId
      });
      
      Alert.alert(
        'Método de Pago Actualizado',
        'Tu método de pago ha sido actualizado exitosamente.'
      );
      
      return true;
    } catch (error) {
      console.error('Error updating payment method:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar tu método de pago. Inténtalo de nuevo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      analyticsManager.trackEvent('restore_purchases_attempt', {
        userId: user?.uid
      });
      
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would check with the app store
      analyticsManager.trackEvent('restore_purchases_success', {
        userId: user?.uid
      });
      
      Alert.alert(
        'Compras Restauradas',
        'Se han verificado tus compras anteriores.'
      );
      
      return true;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      
      analyticsManager.trackEvent('restore_purchases_error', {
        userId: user?.uid,
        error: error.message
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async (): Promise<void> => {
    if (currentSubscription) {
      const now = new Date();
      const isExpired = currentSubscription.expiresAt <= now;
      const shouldBeActive = !isExpired && currentSubscription.status === 'active';
      
      if (currentSubscription.isActive !== shouldBeActive) {
        const updatedSubscription = {
          ...currentSubscription,
          isActive: shouldBeActive,
          status: isExpired ? 'expired' as const : currentSubscription.status
        };
        
        setCurrentSubscription(updatedSubscription);
        await saveSubscription(updatedSubscription);
        
        if (isExpired) {
          analyticsManager.trackEvent('subscription_expired', {
            userId: user?.uid,
            planId: currentSubscription.planId,
            planName: currentSubscription.planName
          });
          
          Alert.alert(
            'Suscripción Expirada',
            'Tu suscripción premium ha expirado. Renueva para seguir disfrutando de las funciones premium.'
          );
        }
      }
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!currentSubscription || !currentSubscription.isActive) {
      // Check if it's a free feature
      return PREMIUM_FEATURES.free?.includes(feature) || false;
    }
    
    const planFeatures = PREMIUM_FEATURES[currentSubscription.planName];
    return planFeatures ? planFeatures.includes(feature) : false;
  };

  const isFeatureAvailable = (feature: string): boolean => {
    return hasFeature(feature);
  };

  const getFeatureLimit = (feature: string): number => {
    if (!currentSubscription || !currentSubscription.isActive) {
      return FEATURE_LIMITS.free[feature] || 0;
    }
    
    const planLimits = FEATURE_LIMITS[currentSubscription.planName];
    return planLimits ? (planLimits[feature] || 0) : 0;
  };

  const trackFeatureUsage = (feature: string): void => {
    if (!user) return;
    
    const currentUsage = featureUsage[feature] || 0;
    const newUsage = { ...featureUsage, [feature]: currentUsage + 1 };
    
    setFeatureUsage(newUsage);
    saveFeatureUsage(newUsage);
    
    // Track analytics
    analyticsManager.trackEvent('feature_used', {
      userId: user.uid,
      feature,
      usage: currentUsage + 1,
      planName: currentSubscription?.planName || 'free'
    });
  };

  const getRemainingDays = (): number => {
    if (!currentSubscription || !currentSubscription.isActive) {
      return 0;
    }
    
    const now = new Date();
    const diffTime = currentSubscription.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isPremium = currentSubscription?.isActive || false;

  const value: SubscriptionContextType = {
    currentSubscription,
    availablePlans: SUBSCRIPTION_PLANS,
    isLoading,
    isPremium,
    subscribeToPlan,
    cancelSubscription,
    renewSubscription,
    updatePaymentMethod,
    restorePurchases,
    checkSubscriptionStatus,
    hasFeature,
    isFeatureAvailable,
    getFeatureLimit,
    trackFeatureUsage,
    getRemainingDays
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;