import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';

const { width } = Dimensions.get('window');

interface RecommendationsHubProps {
  visible: boolean;
  onClose: () => void;
}

interface Recommendation {
  id: string;
  category: 'ux' | 'engagement' | 'monetization' | 'growth' | 'technical';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  benefits: string[];
  implementation: string[];
  estimatedROI?: string;
  priority: number;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'ai_matchmaking',
    category: 'ux',
    title: 'Sistema de Matchmaking con IA',
    description: 'Algoritmo inteligente que conecta jugadores basado en habilidades, preferencias y compatibilidad',
    impact: 'high',
    effort: 'high',
    icon: 'brain',
    color: '#9B59B6',
    benefits: [
      'Partidas más equilibradas y divertidas',
      'Reducción del 60% en abandonos de partida',
      'Mayor retención de usuarios nuevos',
      'Experiencia personalizada para cada jugador'
    ],
    implementation: [
      'Análisis de datos de gameplay histórico',
      'Machine Learning para patrones de comportamiento',
      'Sistema de feedback en tiempo real',
      'Algoritmo de balanceo dinámico'
    ],
    estimatedROI: '+40% retención',
    priority: 1
  },
  {
    id: 'social_features',
    category: 'engagement',
    title: 'Funciones Sociales Avanzadas',
    description: 'Sistema completo de interacción social: clanes, eventos, chat de voz, streaming integrado',
    impact: 'high',
    effort: 'medium',
    icon: 'people',
    color: '#3498DB',
    benefits: [
      'Comunidades más fuertes y activas',
      'Tiempo de sesión 3x mayor',
      'Viral growth orgánico',
      'Mayor engagement diario'
    ],
    implementation: [
      'Sistema de clanes y guilds',
      'Chat de voz integrado',
      'Eventos comunitarios automáticos',
      'Streaming y clips compartidos'
    ],
    estimatedROI: '+200% engagement',
    priority: 2
  },
  {
    id: 'gamification_system',
    category: 'engagement',
    title: 'Sistema de Gamificación Completo',
    description: 'Logros, badges, temporadas, battle pass y sistema de progresión que mantiene a los usuarios enganchados',
    impact: 'high',
    effort: 'medium',
    icon: 'trophy',
    color: '#F39C12',
    benefits: [
      'Motivación constante para jugar',
      'Objetivos claros y recompensas',
      'Sentido de progresión y logro',
      'Competencia sana entre usuarios'
    ],
    implementation: [
      'Sistema de logros dinámicos',
      'Battle Pass estacional',
      'Ranking y ligas competitivas',
      'Recompensas diarias y semanales'
    ],
    estimatedROI: '+150% tiempo de juego',
    priority: 3
  },
  {
    id: 'creator_economy',
    category: 'monetization',
    title: 'Economía de Creadores',
    description: 'Marketplace para contenido, NFTs de gaming, skins personalizadas y economía virtual completa',
    impact: 'high',
    effort: 'high',
    icon: 'storefront',
    color: '#27AE60',
    benefits: [
      'Nueva fuente de ingresos recurrentes',
      'Creadores monetizan su contenido',
      'Economía virtual autosostenible',
      'Diferenciación competitiva única'
    ],
    implementation: [
      'Marketplace de contenido',
      'Sistema de NFTs gaming',
      'Herramientas de creación',
      'Wallet integrado y pagos'
    ],
    estimatedROI: '+300% revenue',
    priority: 4
  },
  {
    id: 'cross_platform',
    category: 'growth',
    title: 'Compatibilidad Cross-Platform',
    description: 'Juego cruzado entre móvil, PC y consolas con sincronización de progreso',
    impact: 'high',
    effort: 'high',
    icon: 'phone-portrait',
    color: '#E74C3C',
    benefits: [
      'Base de usuarios 5x mayor',
      'Flexibilidad total para jugadores',
      'Sesiones más largas y frecuentes',
      'Ventaja competitiva significativa'
    ],
    implementation: [
      'Arquitectura cloud escalable',
      'Sincronización en tiempo real',
      'UI adaptativa por plataforma',
      'Sistema de cuentas unificado'
    ],
    estimatedROI: '+500% user base',
    priority: 5
  },
  {
    id: 'ai_coaching',
    category: 'ux',
    title: 'Coach Personal con IA',
    description: 'Asistente inteligente que analiza gameplay y ofrece consejos personalizados para mejorar',
    impact: 'medium',
    effort: 'medium',
    icon: 'school',
    color: '#8E44AD',
    benefits: [
      'Mejora rápida de habilidades',
      'Análisis detallado de rendimiento',
      'Consejos personalizados en tiempo real',
      'Progresión acelerada para nuevos usuarios'
    ],
    implementation: [
      'Análisis de video gameplay',
      'Machine Learning para patrones',
      'Feedback contextual inteligente',
      'Sistema de entrenamiento adaptativo'
    ],
    estimatedROI: '+80% skill improvement',
    priority: 6
  },
  {
    id: 'esports_integration',
    category: 'growth',
    title: 'Integración Esports Completa',
    description: 'Torneos automatizados, broadcasting, sponsors y path profesional para jugadores',
    impact: 'medium',
    effort: 'high',
    icon: 'medal',
    color: '#FF6B6B',
    benefits: [
      'Atrae jugadores competitivos serios',
      'Oportunidades de patrocinio',
      'Contenido viral y marketing orgánico',
      'Legitimidad en la industria gaming'
    ],
    implementation: [
      'Sistema de torneos automatizado',
      'Herramientas de broadcasting',
      'Gestión de sponsors y premios',
      'Rankings y estadísticas profesionales'
    ],
    estimatedROI: '+250% brand value',
    priority: 7
  },
  {
    id: 'ar_features',
    category: 'technical',
    title: 'Realidad Aumentada Gaming',
    description: 'Experiencias AR inmersivas que mezclan el mundo real con elementos del juego',
    impact: 'medium',
    effort: 'high',
    icon: 'camera',
    color: '#FF9500',
    benefits: [
      'Experiencia única e innovadora',
      'Viral potential muy alto',
      'Diferenciación tecnológica',
      'Engagement físico y digital'
    ],
    implementation: [
      'SDK de AR avanzado',
      'Reconocimiento de entorno',
      'Overlays de información contextual',
      'Interacciones gestuales'
    ],
    estimatedROI: '+400% viral reach',
    priority: 8
  }
];

const INTEGRATION_SUGGESTIONS = [
  {
    id: 'discord_integration',
    name: 'Discord Bot & Integration',
    description: 'Bot oficial que sincroniza estadísticas, organiza partidas y gestiona comunidades',
    icon: 'logo-discord',
    color: '#5865F2',
    benefits: ['Comunidad más activa', 'Organización automática', 'Notificaciones inteligentes']
  },
  {
    id: 'twitch_integration',
    name: 'Twitch Streaming Tools',
    description: 'Herramientas nativas para streamers: overlays, comandos, interacción con viewers',
    icon: 'videocam',
    color: '#9146FF',
    benefits: ['Crecimiento orgánico', 'Contenido viral', 'Monetización streaming']
  },
  {
    id: 'youtube_integration',
    name: 'YouTube Content Creator',
    description: 'Exportación automática de highlights, editor de clips y herramientas de contenido',
    icon: 'logo-youtube',
    color: '#FF0000',
    benefits: ['Contenido automático', 'Alcance masivo', 'SEO gaming']
  },
  {
    id: 'spotify_integration',
    name: 'Spotify Gaming Playlists',
    description: 'Playlists dinámicas que se adaptan al gameplay y estado de ánimo del jugador',
    icon: 'musical-notes',
    color: '#1DB954',
    benefits: ['Experiencia inmersiva', 'Personalización única', 'Partnership potential']
  },
  {
    id: 'steam_integration',
    name: 'Steam Workshop & Mods',
    description: 'Soporte para mods de comunidad, skins personalizadas y contenido generado por usuarios',
    icon: 'construct',
    color: '#1B2838',
    benefits: ['Contenido infinito', 'Comunidad creativa', 'Longevidad del juego']
  }
];

export const RecommendationsHub: React.FC<RecommendationsHubProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const categories = [
    { id: 'all', name: 'Todas', icon: 'apps', color: '#667eea' },
    { id: 'ux', name: 'UX/UI', icon: 'color-palette', color: '#9B59B6' },
    { id: 'engagement', name: 'Engagement', icon: 'heart', color: '#3498DB' },
    { id: 'monetization', name: 'Monetización', icon: 'cash', color: '#27AE60' },
    { id: 'growth', name: 'Crecimiento', icon: 'trending-up', color: '#E74C3C' },
    { id: 'technical', name: 'Técnico', icon: 'code', color: '#FF9500' }
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? RECOMMENDATIONS.sort((a, b) => a.priority - b.priority)
    : RECOMMENDATIONS.filter(r => r.category === selectedCategory).sort((a, b) => a.priority - b.priority);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#27AE60';
      case 'medium': return '#F39C12';
      case 'low': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return '#E74C3C';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      default: return '#95A5A6';
    }
  };

  const handleRecommendationPress = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetails(true);
    analyticsManager.trackEvent('recommendation_viewed', {
      recommendation_id: recommendation.id,
      category: recommendation.category
    });
  };

  const handleImplement = (recommendation: Recommendation) => {
    Alert.alert(
      'Implementar Recomendación',
      `¿Te interesa implementar "${recommendation.title}"? Esto se agregará a tu roadmap de desarrollo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Agregar al Roadmap', 
          onPress: () => {
            analyticsManager.trackEvent('recommendation_added_to_roadmap', {
              recommendation_id: recommendation.id,
              category: recommendation.category,
              impact: recommendation.impact,
              effort: recommendation.effort
            });
            Alert.alert('¡Agregado!', 'La recomendación se ha agregado a tu roadmap de desarrollo.');
            setShowDetails(false);
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recomendaciones de Crecimiento</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && { backgroundColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? 'white' : category.color} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && { color: 'white' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recommendations List */}
          <ScrollView style={styles.recommendationsList} showsVerticalScrollIndicator={false}>
            <View style={styles.statsHeader}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{filteredRecommendations.length}</Text>
                <Text style={styles.statLabel}>Recomendaciones</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {filteredRecommendations.filter(r => r.impact === 'high').length}
                </Text>
                <Text style={styles.statLabel}>Alto Impacto</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {filteredRecommendations.filter(r => r.effort === 'low').length}
                </Text>
                <Text style={styles.statLabel}>Fácil Implementación</Text>
              </View>
            </View>

            {filteredRecommendations.map((recommendation) => (
              <TouchableOpacity
                key={recommendation.id}
                style={styles.recommendationCard}
                onPress={() => handleRecommendationPress(recommendation)}
              >
                <View style={styles.recommendationHeader}>
                  <View style={[styles.recommendationIcon, { backgroundColor: recommendation.color }]}>
                    <Ionicons name={recommendation.icon as any} size={24} color="white" />
                  </View>
                  <View style={styles.recommendationInfo}>
                    <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                    <Text style={styles.recommendationDescription} numberOfLines={2}>
                      {recommendation.description}
                    </Text>
                  </View>
                  <View style={styles.recommendationMetrics}>
                    <View style={styles.metricBadge}>
                      <View style={[styles.metricDot, { backgroundColor: getImpactColor(recommendation.impact) }]} />
                      <Text style={styles.metricText}>Impacto {recommendation.impact}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <View style={[styles.metricDot, { backgroundColor: getEffortColor(recommendation.effort) }]} />
                      <Text style={styles.metricText}>Esfuerzo {recommendation.effort}</Text>
                    </View>
                  </View>
                </View>
                
                {recommendation.estimatedROI && (
                  <View style={styles.roiContainer}>
                    <Ionicons name="trending-up" size={16} color={recommendation.color} />
                    <Text style={[styles.roiText, { color: recommendation.color }]}>
                      ROI Estimado: {recommendation.estimatedROI}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Integration Suggestions */}
            <View style={styles.integrationsSection}>
              <Text style={styles.sectionTitle}>Integraciones Recomendadas</Text>
              {INTEGRATION_SUGGESTIONS.map((integration) => (
                <View key={integration.id} style={styles.integrationCard}>
                  <View style={styles.integrationHeader}>
                    <View style={[styles.integrationIcon, { backgroundColor: integration.color }]}>
                      <Ionicons name={integration.icon as any} size={20} color="white" />
                    </View>
                    <View style={styles.integrationInfo}>
                      <Text style={styles.integrationName}>{integration.name}</Text>
                      <Text style={styles.integrationDescription}>{integration.description}</Text>
                    </View>
                  </View>
                  <View style={styles.integrationBenefits}>
                    {integration.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={14} color={integration.color} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Recommendation Details Modal */}
      <Modal visible={showDetails} animationType="slide" transparent={true}>
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsContainer}>
            {selectedRecommendation && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={[styles.detailsIcon, { backgroundColor: selectedRecommendation.color }]}>
                    <Ionicons name={selectedRecommendation.icon as any} size={32} color="white" />
                  </View>
                  <View style={styles.detailsHeaderInfo}>
                    <Text style={styles.detailsTitle}>{selectedRecommendation.title}</Text>
                    <Text style={styles.detailsDescription}>{selectedRecommendation.description}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.detailsCloseButton} 
                    onPress={() => setShowDetails(false)}
                  >
                    <Ionicons name="close" size={24} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                  {/* Metrics */}
                  <View style={styles.detailsMetrics}>
                    <View style={styles.detailsMetricItem}>
                      <Text style={styles.detailsMetricLabel}>Impacto</Text>
                      <View style={[styles.detailsMetricValue, { backgroundColor: getImpactColor(selectedRecommendation.impact) }]}>
                        <Text style={styles.detailsMetricText}>{selectedRecommendation.impact.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.detailsMetricItem}>
                      <Text style={styles.detailsMetricLabel}>Esfuerzo</Text>
                      <View style={[styles.detailsMetricValue, { backgroundColor: getEffortColor(selectedRecommendation.effort) }]}>
                        <Text style={styles.detailsMetricText}>{selectedRecommendation.effort.toUpperCase()}</Text>
                      </View>
                    </View>
                    {selectedRecommendation.estimatedROI && (
                      <View style={styles.detailsMetricItem}>
                        <Text style={styles.detailsMetricLabel}>ROI Estimado</Text>
                        <View style={[styles.detailsMetricValue, { backgroundColor: selectedRecommendation.color }]}>
                          <Text style={styles.detailsMetricText}>{selectedRecommendation.estimatedROI}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Benefits */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Beneficios</Text>
                    {selectedRecommendation.benefits.map((benefit, index) => (
                      <View key={index} style={styles.detailsBenefitItem}>
                        <Ionicons name="checkmark-circle" size={20} color={selectedRecommendation.color} />
                        <Text style={styles.detailsBenefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Implementation */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Plan de Implementación</Text>
                    {selectedRecommendation.implementation.map((step, index) => (
                      <View key={index} style={styles.detailsImplementationItem}>
                        <View style={[styles.stepNumber, { backgroundColor: selectedRecommendation.color }]}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.detailsImplementationText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity 
                    style={styles.implementButton}
                    onPress={() => handleImplement(selectedRecommendation)}
                  >
                    <LinearGradient
                      colors={[selectedRecommendation.color, '#667eea']}
                      style={styles.implementButtonGradient}
                    >
                      <Ionicons name="rocket" size={20} color="white" />
                      <Text style={styles.implementButtonText}>Agregar al Roadmap</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
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
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.tabIconDefault + '10',
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  recommendationsList: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  recommendationCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationInfo: {
    flex: 1,
    marginRight: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  recommendationMetrics: {
    gap: 4,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricText: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    textTransform: 'capitalize',
  },
  roiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabIconDefault + '20',
  },
  roiText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  integrationsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  integrationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  integrationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 18,
  },
  integrationBenefits: {
    gap: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
  },
  detailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: width * 0.95,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault + '20',
  },
  detailsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsHeaderInfo: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  detailsDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  detailsCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tabIconDefault + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailsMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  detailsMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailsMetricLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  detailsMetricValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailsMetricText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailsBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailsBenefitText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 20,
  },
  detailsImplementationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsImplementationText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 20,
  },
  implementButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  implementButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  implementButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecommendationsHub;