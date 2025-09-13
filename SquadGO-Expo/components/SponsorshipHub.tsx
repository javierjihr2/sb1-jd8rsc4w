import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContextSimple';
import { monetizationService, SponsorshipDeal } from '../lib/monetization-service';
import { analyticsManager } from '../lib/analytics';

const { width, height } = Dimensions.get('window');

interface SponsorshipHubProps {
  visible: boolean;
  onClose: () => void;
}

interface SponsorshipTier {
  id: string;
  name: string;
  price: number;
  duration: number; // días
  features: string[];
  color: string;
  popular?: boolean;
}

const SPONSORSHIP_TIERS: SponsorshipTier[] = [
  {
    id: 'bronze',
    name: 'Patrocinio Bronce',
    price: 99,
    duration: 7,
    features: [
      'Logo en perfil del creador por 7 días',
      'Mención en 2 publicaciones',
      'Acceso a estadísticas básicas',
      'Badge de patrocinador'
    ],
    color: '#CD7F32'
  },
  {
    id: 'silver',
    name: 'Patrocinio Plata',
    price: 299,
    duration: 15,
    features: [
      'Logo destacado en perfil por 15 días',
      'Mención en 5 publicaciones',
      'Video promocional personalizado',
      'Estadísticas detalladas de alcance',
      'Colaboración en stream',
      'Badge premium de patrocinador'
    ],
    color: '#C0C0C0',
    popular: true
  },
  {
    id: 'gold',
    name: 'Patrocinio Oro',
    price: 599,
    duration: 30,
    features: [
      'Logo premium en perfil por 30 días',
      'Mención en 10 publicaciones',
      'Serie de videos promocionales',
      'Análisis completo de audiencia',
      'Múltiples colaboraciones en stream',
      'Torneo patrocinado exclusivo',
      'Badge dorado de patrocinador',
      'Reporte mensual detallado'
    ],
    color: '#FFD700'
  },
  {
    id: 'diamond',
    name: 'Patrocinio Diamante',
    price: 1299,
    duration: 60,
    features: [
      'Presencia premium por 60 días',
      'Contenido ilimitado personalizado',
      'Campaña de marketing completa',
      'Análisis avanzado de ROI',
      'Eventos exclusivos patrocinados',
      'Integración de marca personalizada',
      'Badge diamante único',
      'Soporte dedicado 24/7',
      'Reportes semanales ejecutivos'
    ],
    color: '#B9F2FF'
  }
];

const PREMIUM_FEATURES = [
  {
    id: 'ai_coaching_plus',
    name: 'AI Coaching Avanzado',
    description: 'Análisis de gameplay con IA, recomendaciones personalizadas y coaching en tiempo real',
    icon: 'brain',
    color: '#9B59B6',
    value: 'Mejora tu rendimiento hasta 40% más rápido'
  },
  {
    id: 'tournament_creator',
    name: 'Creador de Torneos Pro',
    description: 'Herramientas avanzadas para crear, gestionar y monetizar torneos profesionales',
    icon: 'trophy',
    color: '#F39C12',
    value: 'Organiza eventos para hasta 1000 participantes'
  },
  {
    id: 'analytics_suite',
    name: 'Suite de Analytics',
    description: 'Análisis profundo de audiencia, engagement y rendimiento de contenido',
    icon: 'analytics',
    color: '#3498DB',
    value: 'Incrementa tu audiencia con datos precisos'
  },
  {
    id: 'brand_tools',
    name: 'Herramientas de Marca',
    description: 'Personalización avanzada, temas exclusivos y herramientas de branding',
    icon: 'brush',
    color: '#E74C3C',
    value: 'Destaca con una identidad visual única'
  },
  {
    id: 'monetization_tools',
    name: 'Herramientas de Monetización',
    description: 'Donaciones, suscripciones de fans, venta de contenido y más',
    icon: 'cash',
    color: '#27AE60',
    value: 'Múltiples fuentes de ingresos integradas'
  },
  {
    id: 'collaboration_hub',
    name: 'Hub de Colaboraciones',
    description: 'Conecta con marcas, otros creadores y oportunidades de patrocinio',
    icon: 'people',
    color: '#8E44AD',
    value: 'Acceso a red exclusiva de colaboradores'
  }
];

export const SponsorshipHub: React.FC<SponsorshipHubProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sponsor' | 'creator' | 'features'>('sponsor');
  const [selectedTier, setSelectedTier] = useState<SponsorshipTier | null>(null);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    companyName: '',
    contactEmail: '',
    budget: '',
    goals: '',
    targetAudience: ''
  });
  const [myDeals, setMyDeals] = useState<SponsorshipDeal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadMyDeals();
    }
  }, [visible, user]);

  const loadMyDeals = async () => {
    // Cargar deals del usuario (como patrocinador o creador)
    // Implementar según la estructura de datos
  };

  const handleSponsorSubmit = async () => {
    if (!selectedTier || !user) return;

    setLoading(true);
    try {
      // Procesar pago de patrocinio
      const result = await monetizationService.processSponsorshipPayment(
        user.uid,
        'target_creator_id', // Esto vendría del contexto
        selectedTier.price,
        `campaign_${Date.now()}`
      );

      if (result) {
        Alert.alert(
          '¡Patrocinio Exitoso!',
          `Tu patrocinio ${selectedTier.name} ha sido procesado. El creador será notificado.`,
          [{ text: 'OK', onPress: () => {
            setShowSponsorForm(false);
            setSelectedTier(null);
            analyticsManager.trackEvent('sponsorship_created', {
              tier: selectedTier.id,
              amount: selectedTier.price
            });
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el patrocinio. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderSponsorTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <Ionicons name="business" size={40} color="white" />
          <Text style={styles.headerTitle}>Conviértete en Patrocinador</Text>
          <Text style={styles.headerSubtitle}>
            Conecta con creadores de contenido y amplifica tu marca
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.tiersContainer}>
        <Text style={styles.sectionTitle}>Planes de Patrocinio</Text>
        {SPONSORSHIP_TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierCard,
              tier.popular && styles.popularTier,
              selectedTier?.id === tier.id && styles.selectedTier
            ]}
            onPress={() => setSelectedTier(tier)}
          >
            {tier.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MÁS POPULAR</Text>
              </View>
            )}
            
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
                <Ionicons name="diamond" size={24} color="white" />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPrice}>${tier.price}</Text>
                <Text style={styles.tierDuration}>{tier.duration} días</Text>
              </View>
            </View>

            <View style={styles.tierFeatures}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={tier.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTier && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setShowSponsorForm(true)}
        >
          <LinearGradient
            colors={[selectedTier.color, '#667eea']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continuar con {selectedTier.name}</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderCreatorTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          style={styles.headerGradient}
        >
          <Ionicons name="star" size={40} color="white" />
          <Text style={styles.headerTitle}>Para Creadores</Text>
          <Text style={styles.headerSubtitle}>
            Monetiza tu contenido y conecta con marcas
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.creatorStats}>
        <View style={styles.statCard}>
          <Ionicons name="eye" size={24} color="#3498DB" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Vistas Totales</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart" size={24} color="#E74C3C" />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Engagement</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#27AE60" />
          <Text style={styles.statNumber}>$0</Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>
      </View>

      <View style={styles.opportunitiesSection}>
        <Text style={styles.sectionTitle}>Oportunidades Disponibles</Text>
        <View style={styles.opportunityCard}>
          <View style={styles.opportunityHeader}>
            <Ionicons name="business" size={32} color="#667eea" />
            <View style={styles.opportunityInfo}>
              <Text style={styles.opportunityTitle}>Marcas Buscando Creadores</Text>
              <Text style={styles.opportunitySubtitle}>3 oportunidades activas</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.opportunityButton}>
            <Text style={styles.opportunityButtonText}>Ver Oportunidades</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderFeaturesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.headerGradient}
        >
          <Ionicons name="rocket" size={40} color="white" />
          <Text style={styles.headerTitle}>Funciones Premium</Text>
          <Text style={styles.headerSubtitle}>
            Potencia tu experiencia con herramientas avanzadas
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.featuresGrid}>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.id} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
              <Ionicons name={feature.icon as any} size={28} color="white" />
            </View>
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <View style={styles.featureValue}>
              <Ionicons name="trending-up" size={16} color={feature.color} />
              <Text style={[styles.featureValueText, { color: feature.color }]}>
                {feature.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.upgradeButton}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Ionicons name="star" size={20} color="white" />
          <Text style={styles.buttonText}>Actualizar a Premium</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hub de Patrocinios</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sponsor' && styles.activeTab]}
              onPress={() => setActiveTab('sponsor')}
            >
              <Ionicons 
                name="business" 
                size={20} 
                color={activeTab === 'sponsor' ? 'white' : Colors.light.tabIconDefault} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'sponsor' && styles.activeTabText
              ]}>Patrocinar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'creator' && styles.activeTab]}
              onPress={() => setActiveTab('creator')}
            >
              <Ionicons 
                name="star" 
                size={20} 
                color={activeTab === 'creator' ? 'white' : Colors.light.tabIconDefault} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'creator' && styles.activeTabText
              ]}>Creador</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'features' && styles.activeTab]}
              onPress={() => setActiveTab('features')}
            >
              <Ionicons 
                name="rocket" 
                size={20} 
                color={activeTab === 'features' ? 'white' : Colors.light.tabIconDefault} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'features' && styles.activeTabText
              ]}>Premium</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'sponsor' && renderSponsorTab()}
          {activeTab === 'creator' && renderCreatorTab()}
          {activeTab === 'features' && renderFeaturesTab()}
        </View>
      </View>

      {/* Sponsor Form Modal */}
      <Modal visible={showSponsorForm} animationType="slide" transparent={true}>
        <View style={styles.formModalOverlay}>
          <BlurView intensity={20} style={styles.formModalContainer}>
            <View style={styles.formContent}>
              <Text style={styles.formTitle}>Información de Patrocinio</Text>
              
              <TextInput
                style={styles.formInput}
                placeholder="Nombre de la empresa"
                value={sponsorForm.companyName}
                onChangeText={(text) => setSponsorForm({...sponsorForm, companyName: text})}
              />
              
              <TextInput
                style={styles.formInput}
                placeholder="Email de contacto"
                value={sponsorForm.contactEmail}
                onChangeText={(text) => setSponsorForm({...sponsorForm, contactEmail: text})}
                keyboardType="email-address"
              />
              
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Objetivos de la campaña"
                value={sponsorForm.goals}
                onChangeText={(text) => setSponsorForm({...sponsorForm, goals: text})}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowSponsorForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSponsorSubmit}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Procesando...' : 'Confirmar Patrocinio'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tabIconDefault + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tabIconDefault + '10',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tabIconDefault,
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
  },
  headerSection: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tiersContainer: {
    paddingBottom: 20,
  },
  tierCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularTier: {
    borderColor: '#667eea',
  },
  selectedTier: {
    borderColor: '#667eea',
    backgroundColor: '#667eea' + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  tierDuration: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  tierFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  continueButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  creatorStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  opportunitiesSection: {
    paddingHorizontal: 16,
  },
  opportunityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  opportunityInfo: {
    flex: 1,
    marginLeft: 16,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  opportunitySubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  opportunityButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  opportunityButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  featuresGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
    marginBottom: 12,
  },
  featureValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureValueText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeButton: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  formModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  formModalContainer: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  formContent: {
    backgroundColor: 'white',
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault + '30',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.tabIconDefault,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.tabIconDefault,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SponsorshipHub;