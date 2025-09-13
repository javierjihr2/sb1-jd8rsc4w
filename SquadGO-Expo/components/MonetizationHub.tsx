import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { usePayment } from '../contexts/PaymentContext';
import VirtualStore from './VirtualStore';
import PremiumStats from './PremiumStats';
import { RewardedAdButton } from './AdSystem';
import { PaymentMethods } from './PaymentMethods';

const { width } = Dimensions.get('window');

interface MonetizationHubProps {
  visible: boolean;
  onClose: () => void;
}

const MonetizationHub: React.FC<MonetizationHubProps> = ({ visible, onClose }) => {
  const { 
    currentSubscription, 
    subscribeToPlan, 
    cancelSubscription, 
    hasFeature,
    availablePlans 
  } = useSubscription();
  const { balance, transactions } = useCurrency();
  const { paymentMethods, processPayment } = usePayment();
  
  const [activeSection, setActiveSection] = useState<'overview' | 'store' | 'premium' | 'stats'>('overview');
  const [showStore, setShowStore] = useState(false);
  const [showPremiumStats, setShowPremiumStats] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const handleSubscribe = async (planId: string) => {
    Alert.alert(
      'Confirmar Suscripción',
      `¿Deseas suscribirte al plan ${availablePlans.find(p => p.id === planId)?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Suscribirse', 
          onPress: async () => {
            const success = await subscribeToPlan(planId);
            if (success) {
              Alert.alert('¡Éxito!', 'Te has suscrito exitosamente.');
            }
          }
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium.',
      [
        { text: 'No Cancelar', style: 'cancel' },
        { 
          text: 'Cancelar Suscripción', 
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            Alert.alert('Suscripción Cancelada', 'Tu suscripción ha sido cancelada.');
          }
        }
      ]
    );
  };

  const getPlanBadgeColor = (planId: string) => {
    switch (planId) {
      case 'pro_monthly': return ['#3498db', '#2980b9'] as const;
      case 'pro_yearly': return ['#e74c3c', '#c0392b'] as const;
      case 'elite_yearly': return ['#f39c12', '#e67e22'] as const;
      default: return ['#95a5a6', '#7f8c8d'] as const;
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro_monthly': return '⭐';
      case 'pro_yearly': return '🏆';
      case 'elite_yearly': return '👑';
      default: return '📱';
    }
  };

  const OverviewSection = () => (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      {/* Current Status */}
      <View style={styles.statusCard}>
        <LinearGradient 
          colors={currentSubscription ? getPlanBadgeColor(currentSubscription.planId) : ['#95a5a6', '#7f8c8d'] as const}
          style={styles.statusHeader}
        >
          <Text style={styles.statusIcon}>
            {currentSubscription ? getPlanIcon(currentSubscription.planId) : '📱'}
          </Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {currentSubscription ? availablePlans.find(p => p.id === currentSubscription.planId)?.name || 'Plan Premium' : 'Plan Básico'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {currentSubscription ? 'Suscripción Activa' : 'Plan Gratuito'}
            </Text>
          </View>
          {currentSubscription && (
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.manageButtonText}>Gestionar</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
        
        <View style={styles.statusBody}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>SquadCoins:</Text>
            <Text style={styles.balanceValue}>🪙 {balance.toLocaleString()}</Text>
          </View>
          
          {currentSubscription && (
            <View style={styles.featuresPreview}>
              <Text style={styles.featuresTitle}>Funciones Activas:</Text>
              <View style={styles.featuresList}>
                {hasFeature('advanced_stats') && (
                  <View style={styles.featureItem}>
                    <Ionicons name="analytics" size={16} color="#27ae60" />
                    <Text style={styles.featureText}>Estadísticas Avanzadas</Text>
                  </View>
                )}
                {hasFeature('ai_coaching') && (
                  <View style={styles.featureItem}>
                    <Ionicons name="bulb" size={16} color="#27ae60" />
                    <Text style={styles.featureText}>Coaching AI</Text>
                  </View>
                )}
                {hasFeature('ad_free') && (
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
                    <Text style={styles.featureText}>Sin Anuncios</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowStore(true)}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
              <Text style={styles.actionIcon}>🛍️</Text>
              <Text style={styles.actionTitle}>Tienda</Text>
              <Text style={styles.actionSubtitle}>SquadCoins y artículos</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowPremiumStats(true)}
          >
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.actionGradient}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Estadísticas</Text>
              <Text style={styles.actionSubtitle}>Análisis premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowPaymentMethods(true)}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionGradient}>
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionTitle}>Métodos de Pago</Text>
              <Text style={styles.actionSubtitle}>
                {paymentMethods.length} método{paymentMethods.length !== 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {!hasFeature('ad_free') && (
          <View style={styles.rewardedAdContainer}>
            <Text style={styles.rewardedAdTitle}>Gana SquadCoins Gratis</Text>
            <RewardedAdButton style={styles.rewardedAdButton} />
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
          {transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Text>
                  {transaction.type === 'purchase' ? '💰' : 
                   transaction.type === 'earn' ? '🎁' : 
                   transaction.type === 'spend' ? '🛒' : '💸'}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {transaction.timestamp.toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount > 0 ? '#27ae60' : '#e74c3c' }
              ]}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const PremiumSection = () => (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Planes Premium</Text>
      <Text style={styles.sectionSubtitle}>
        Desbloquea todo el potencial de SquadGO con funciones premium
      </Text>
      
      <View style={styles.planCard}>
        <LinearGradient 
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.planHeader}
        >
          <Text style={styles.planIcon}>👑</Text>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>Creador</Text>
            <Text style={styles.planPrice}>$9.99/mes</Text>
          </View>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.planBody}>
          <Text style={styles.planDescription}>
            La única suscripción que necesitas como creador
          </Text>
          
          <View style={styles.planFeatures}>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Acceso completo a todas las funciones</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Estadísticas avanzadas y análisis detallados</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Creación de contenido ilimitado</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Herramientas de streaming profesionales</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Monetización de contenido</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Torneos exclusivos para creadores</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Badge de creador verificado</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Coaching AI personalizado</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Temas exclusivos y personalización</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Soporte prioritario 24/7</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Acceso anticipado a nuevas funciones</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Colaboraciones con marcas</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Analytics de audiencia avanzados</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.planFeatureText}>Herramientas de comunidad</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.subscribeButton,
              currentSubscription?.planId === 'creator' && styles.currentPlanButton
            ]}
            onPress={() => currentSubscription?.planId === 'creator' ? handleCancelSubscription() : handleSubscribe('creator')}
            disabled={currentSubscription?.planId === 'creator'}
          >
            <Text style={[
              styles.subscribeButtonText,
              currentSubscription?.planId === 'creator' && styles.currentPlanButtonText
            ]}>
              {currentSubscription?.planId === 'creator' ? 'Plan Actual' : 'Suscribirse'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>SquadGO Premium</Text>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceText}>🪙 {balance.toLocaleString()}</Text>
            </View>
          </View>
          
          {/* Navigation Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeSection === 'overview' && styles.activeTab]}
              onPress={() => setActiveSection('overview')}
            >
              <Ionicons 
                name="home" 
                size={16} 
                color={activeSection === 'overview' ? '#667eea' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[styles.tabText, activeSection === 'overview' && styles.activeTabText]}>
                Inicio
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeSection === 'premium' && styles.activeTab]}
              onPress={() => setActiveSection('premium')}
            >
              <Ionicons 
                name="star" 
                size={16} 
                color={activeSection === 'premium' ? '#667eea' : 'rgba(255, 255, 255, 0.7)'} 
              />
              <Text style={[styles.tabText, activeSection === 'premium' && styles.activeTabText]}>
                Premium
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Content */}
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'premium' && <PremiumSection />}
        
        {/* Modals */}
        <VirtualStore 
          visible={showStore} 
          onClose={() => setShowStore(false)} 
        />
        
        <PremiumStats 
          visible={showPremiumStats} 
          onClose={() => setShowPremiumStats(false)} 
        />
        
        <PaymentMethods
          visible={showPaymentMethods}
          onClose={() => setShowPaymentMethods(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20
  },
  closeButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: 'white'
  },
  balanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  balanceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 20
  },
  activeTab: {
    backgroundColor: 'white'
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6
  },
  activeTabText: {
    color: '#667eea'
  },
  sectionContent: {
    flex: 1,
    padding: 20
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20
  },
  
  // Status Card
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20
  },
  statusIcon: {
    fontSize: 30,
    marginRight: 15
  },
  statusInfo: {
    flex: 1
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15
  },
  manageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  statusBody: {
    padding: 20
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  balanceLabel: {
    fontSize: 16,
    color: '#2c3e50'
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  featuresPreview: {
    marginTop: 10
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5
  },
  featureText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 5
  },
  
  // Quick Actions
  quickActions: {
    marginBottom: 20
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionCard: {
    width: (width - 60) / 2,
    borderRadius: 15,
    overflow: 'hidden'
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center'
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },
  rewardedAdContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  rewardedAdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  rewardedAdButton: {
    width: '100%'
  },
  
  // Transactions
  transactionsSection: {
    marginBottom: 20
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  transactionInfo: {
    flex: 1
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  transactionDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Plan Cards
  planCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative'
  },
  planIcon: {
    fontSize: 30,
    marginRight: 15
  },
  planInfo: {
    flex: 1
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  planPrice: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  planBody: {
    padding: 20
  },
  planDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    lineHeight: 20
  },
  planFeatures: {
    marginBottom: 20
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  planFeatureText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10
  },
  subscribeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center'
  },
  currentPlanButton: {
    backgroundColor: '#95a5a6'
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  currentPlanButtonText: {
    color: 'white'
  }
});

export default MonetizationHub;