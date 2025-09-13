import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { usePayment } from '../../contexts/PaymentContext';
import MonetizationHub from '../../components/MonetizationHub';
import VirtualStore from '../../components/VirtualStore';
import PremiumStats from '../../components/PremiumStats';
import AdSystem from '../../components/AdSystem';

export default function StoreScreen() {
  const [activeTab, setActiveTab] = useState<'store' | 'premium' | 'stats' | 'hub'>('hub');
  const [showPremiumStats, setShowPremiumStats] = useState(false);
  const [showMonetizationHub, setShowMonetizationHub] = useState(false);
  const [showVirtualStore, setShowVirtualStore] = useState(false);
  const { hasFeature } = useSubscription();
  const { balance } = useCurrency();
  const { paymentMethods } = usePayment();

  const tabs = [
    {
      id: 'hub' as const,
      title: 'Hub',
      icon: 'grid-outline',
      activeIcon: 'grid',
      color: '#3b82f6'
    },
    {
      id: 'store' as const,
      title: 'Tienda',
      icon: 'storefront-outline',
      activeIcon: 'storefront',
      color: '#10b981'
    },
    {
      id: 'premium' as const,
      title: 'Premium',
      icon: 'diamond-outline',
      activeIcon: 'diamond',
      color: '#f59e0b'
    },
    {
      id: 'stats' as const,
      title: 'Estadísticas',
      icon: 'analytics-outline',
      activeIcon: 'analytics',
      color: '#8b5cf6'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hub':
        return (
          <View style={styles.hubContainer}>
            <TouchableOpacity 
              style={styles.hubButton}
              onPress={() => setShowMonetizationHub(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.hubButtonGradient}
              >
                <Ionicons name="diamond" size={32} color="white" />
                <Text style={styles.hubButtonTitle}>SquadGO Premium</Text>
                <Text style={styles.hubButtonSubtitle}>Accede a funciones premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      case 'store':
        return (
          <View style={styles.storeContainer}>
            <TouchableOpacity 
              style={styles.storeButton}
              onPress={() => setShowVirtualStore(true)}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.storeButtonGradient}
              >
                <Ionicons name="storefront" size={32} color="white" />
                <Text style={styles.storeButtonTitle}>Tienda Virtual</Text>
                <Text style={styles.storeButtonSubtitle}>Compra SquadCoins y artículos</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      case 'premium':
        return (
          <View style={styles.premiumContainer}>
            <Text style={styles.comingSoonText}>Funciones Premium</Text>
            <Text style={styles.comingSoonSubtext}>
              Accede a estadísticas avanzadas, temas exclusivos y coaching AI
            </Text>
            {hasFeature('advanced_stats') && (
              <TouchableOpacity 
                style={styles.premiumStatsButton}
                onPress={() => setShowPremiumStats(true)}
              >
                <Text style={styles.premiumStatsButtonText}>Ver Estadísticas Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'stats':
        return hasFeature('advanced_stats') ? (
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowPremiumStats(true)}
          >
            <Text style={styles.statsButtonText}>Abrir Estadísticas Premium</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedContainer}>
            <LinearGradient
              colors={['#1e293b', '#334155']}
              style={styles.lockedCard}
            >
              <Ionicons name="lock-closed" size={48} color="#64748b" />
              <Text style={styles.lockedTitle}>Estadísticas Premium</Text>
              <Text style={styles.lockedText}>
                Desbloquea análisis detallados de tu rendimiento con una suscripción Premium
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => setActiveTab('premium')}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.upgradeButtonGradient}
                >
                  <Text style={styles.upgradeButtonText}>Actualizar a Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SquadGO Store</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={16} color="#f59e0b" />
              <Text style={styles.statText}>{balance} Coins</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons 
                name={'person-outline'} 
                size={16} 
                color={'#64748b'} 
              />
              <Text style={styles.statText}>
                {'Básico'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContainer}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    isActive && { backgroundColor: `${tab.color}20` }
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={isActive ? tab.activeIcon as any : tab.icon as any}
                    size={24}
                    color={isActive ? tab.color : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isActive && { color: tab.color }
                    ]}
                  >
                    {tab.title}
                  </Text>
                  {isActive && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: tab.color }
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {renderTabContent()}
        </ScrollView>

        {/* Ad System */}
        <AdSystem adType="banner" />
      </LinearGradient>
      
      {/* Modal de Estadísticas Premium */}
      {showPremiumStats && (
        <PremiumStats 
          visible={showPremiumStats} 
          onClose={() => setShowPremiumStats(false)} 
        />
      )}
      
      {/* Modal de MonetizationHub */}
      <MonetizationHub 
        visible={showMonetizationHub} 
        onClose={() => setShowMonetizationHub(false)} 
      />
      
      {/* Modal de VirtualStore */}
      <VirtualStore 
        visible={showVirtualStore} 
        onClose={() => setShowVirtualStore(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingBottom: 120, // Espacio para el menú inferior
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerStats: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabScrollContainer: {
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    position: 'relative' as const,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120, // Space for tab bar
  },
  premiumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  comingSoonText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  comingSoonSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize['2xl'],
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  lockedCard: {
    padding: theme.spacing['3xl'],
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lockedTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  lockedText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.spacing.xl,
    marginBottom: theme.spacing['2xl'],
  },
  upgradeButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
  },
  upgradeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  premiumStatsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  premiumStatsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Nuevos estilos para los botones de Hub y Store
  hubContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hubButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hubButtonGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  hubButtonSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  storeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  storeButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  storeButtonGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  storeButtonSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});