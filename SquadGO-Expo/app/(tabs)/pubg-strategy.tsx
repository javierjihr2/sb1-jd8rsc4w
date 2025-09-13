import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Importar el sistema de estrategias
import { PUBGMap, StrategyRequest, GeneratedStrategy, PlaneRoute } from '../../lib/pubg-strategy';
import { ALL_MAPS } from '../../lib/pubg-maps-data';
import { aiStrategyGenerator, AdvancedStrategy, quickStrategyAnalysis, getCircleRecommendations } from '../../lib/pubg-ai-strategy';
import { analyzeZoneWeaponAvailability, getMapWeaponData } from '../../lib/pubg-weapons-data';

const { width, height } = Dimensions.get('window');

interface MapSelectionProps {
  selectedMap: string;
  onMapSelect: (mapId: string) => void;
}

const MapSelection: React.FC<MapSelectionProps> = ({ selectedMap, onMapSelect }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>🗺️ Seleccionar Mapa</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mapScrollView}>
        {ALL_MAPS.map((map) => (
          <TouchableOpacity
            key={map.id}
            style={[
              styles.mapCard,
              selectedMap === map.id && styles.selectedMapCard
            ]}
            onPress={() => onMapSelect(map.id)}
          >
            <LinearGradient
              colors={selectedMap === map.id ? ['#4CAF50', '#45a049'] : ['#2196F3', '#1976D2']}
              style={styles.mapGradient}
            >
              <Text style={styles.mapName}>{map.name}</Text>
              <Text style={styles.mapSize}>{map.size}</Text>
              <Text style={styles.mapTerrain}>{map.terrain}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

interface PlaneRouteConfigProps {
  onRouteChange: (route: PlaneRoute) => void;
}

const PlaneRouteConfig: React.FC<PlaneRouteConfigProps> = ({ onRouteChange }) => {
  const [selectedRoute, setSelectedRoute] = useState<string>('random');

  const predefinedRoutes = {
    'north-south': {
      startPoint: { x: 400, y: 100 },
      endPoint: { x: 400, y: 700 },
      angle: 90
    },
    'east-west': {
      startPoint: { x: 100, y: 400 },
      endPoint: { x: 700, y: 400 },
      angle: 0
    },
    'diagonal-ne': {
      startPoint: { x: 100, y: 100 },
      endPoint: { x: 700, y: 700 },
      angle: 45
    },
    'diagonal-nw': {
      startPoint: { x: 700, y: 100 },
      endPoint: { x: 100, y: 700 },
      angle: 135
    }
  };

  const handleRouteSelect = (routeKey: string) => {
    setSelectedRoute(routeKey);
    if (routeKey === 'random') {
      // Generar ruta aleatoria
      const randomRoute = {
        startPoint: {
          x: Math.random() * 800,
          y: Math.random() * 800
        },
        endPoint: {
          x: Math.random() * 800,
          y: Math.random() * 800
        },
        angle: Math.random() * 360
      };
      onRouteChange(randomRoute);
    } else {
      onRouteChange(predefinedRoutes[routeKey as keyof typeof predefinedRoutes]);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>✈️ Ruta del Avión</Text>
      <View style={styles.routeButtonsContainer}>
        {[
          { key: 'random', label: '🎲 Aleatoria', icon: 'shuffle' },
          { key: 'north-south', label: '⬇️ Norte-Sur', icon: 'arrow-down' },
          { key: 'east-west', label: '➡️ Este-Oeste', icon: 'arrow-forward' },
          { key: 'diagonal-ne', label: '↗️ Diagonal NE', icon: 'arrow-up-outline' },
          { key: 'diagonal-nw', label: '↖️ Diagonal NW', icon: 'arrow-up-outline' }
        ].map((route) => (
          <TouchableOpacity
            key={route.key}
            style={[
              styles.routeButton,
              selectedRoute === route.key && styles.selectedRouteButton
            ]}
            onPress={() => handleRouteSelect(route.key)}
          >
            <Ionicons 
              name={route.icon as any} 
              size={20} 
              color={selectedRoute === route.key ? '#fff' : '#333'} 
            />
            <Text style={[
              styles.routeButtonText,
              selectedRoute === route.key && styles.selectedRouteButtonText
            ]}>
              {route.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface StrategyConfigProps {
  config: Partial<StrategyRequest>;
  onConfigChange: (config: Partial<StrategyRequest>) => void;
}

const StrategyConfig: React.FC<StrategyConfigProps> = ({ config, onConfigChange }) => {
  const updateConfig = (key: keyof StrategyRequest, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>⚙️ Configuración de Estrategia</Text>
      
      {/* Estilo de Juego */}
      <View style={styles.configGroup}>
        <Text style={styles.configLabel}>🎮 Estilo de Juego</Text>
        <View style={styles.optionButtonsContainer}>
          {[
            { key: 'aggressive', label: '⚔️ Agresivo', color: '#f44336' },
            { key: 'balanced', label: '⚖️ Balanceado', color: '#ff9800' },
            { key: 'passive', label: '🛡️ Pasivo', color: '#4caf50' }
          ].map((style) => (
            <TouchableOpacity
              key={style.key}
              style={[
                styles.optionButton,
                { borderColor: style.color },
                config.playStyle === style.key && { backgroundColor: style.color }
              ]}
              onPress={() => updateConfig('playStyle', style.key)}
            >
              <Text style={[
                styles.optionButtonText,
                config.playStyle === style.key && { color: '#fff' }
              ]}>
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tamaño del Equipo */}
      <View style={styles.configGroup}>
        <Text style={styles.configLabel}>👥 Tamaño del Equipo</Text>
        <View style={styles.optionButtonsContainer}>
          {[
            { key: 1, label: '👤 Solo' },
            { key: 2, label: '👥 Dúo' },
            { key: 4, label: '👨‍👩‍👧‍👦 Squad' }
          ].map((team) => (
            <TouchableOpacity
              key={team.key}
              style={[
                styles.optionButton,
                config.teamSize === team.key && styles.selectedOptionButton
              ]}
              onPress={() => updateConfig('teamSize', team.key)}
            >
              <Text style={[
                styles.optionButtonText,
                config.teamSize === team.key && styles.selectedOptionButtonText
              ]}>
                {team.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nivel de Experiencia */}
      <View style={styles.configGroup}>
        <Text style={styles.configLabel}>🎯 Nivel de Experiencia</Text>
        <View style={styles.optionButtonsContainer}>
          {[
            { key: 'beginner', label: '🌱 Principiante' },
            { key: 'intermediate', label: '⭐ Intermedio' },
            { key: 'advanced', label: '🏆 Avanzado' }
          ].map((exp) => (
            <TouchableOpacity
              key={exp.key}
              style={[
                styles.optionButton,
                config.experience === exp.key && styles.selectedOptionButton
              ]}
              onPress={() => updateConfig('experience', exp.key)}
            >
              <Text style={[
                styles.optionButtonText,
                config.experience === exp.key && styles.selectedOptionButtonText
              ]}>
                {exp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

interface StrategyDisplayProps {
  strategy: AdvancedStrategy | null;
  onClose: () => void;
}

const StrategyDisplay: React.FC<StrategyDisplayProps> = ({ strategy, onClose }) => {
  if (!strategy) return null;

  return (
    <Modal
      visible={!!strategy}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🎯 Estrategia Generada</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Zona Recomendada */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>📍 Zona de Caída Recomendada</Text>
            <View style={styles.dropZoneCard}>
              <Text style={styles.dropZoneName}>{strategy.recommendedDrop.name}</Text>
              <Text style={styles.dropZoneDescription}>{strategy.recommendedDrop.description}</Text>
              <View style={styles.dropZoneStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Loot:</Text>
                  <Text style={[styles.statValue, { color: strategy.recommendedDrop.lootQuality === 'elite' ? '#4CAF50' : '#FF9800' }]}>
                    {strategy.recommendedDrop.lootQuality.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Riesgo:</Text>
                  <Text style={[styles.statValue, { color: strategy.recommendedDrop.riskLevel === 'low' ? '#4CAF50' : '#F44336' }]}>
                    {strategy.recommendedDrop.riskLevel.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Supervivencia:</Text>
                  <Text style={styles.statValue}>
                    {Math.round(strategy.estimatedSurvivalRate * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ruta de Looteo */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>🎒 Ruta de Looteo</Text>
            {strategy.lootingRoute.map((step, index) => (
              <View key={index} style={styles.lootStep}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Prioridades de Armas */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>🔫 Prioridades de Armas</Text>
            {strategy.weaponPriorities.map((weapon, index) => {
              const isMainWeapon = weapon.includes('Arma Principal:');
              const isSecondaryWeapon = weapon.includes('Arma Secundaria:');
              const isAmmoInfo = weapon.includes('balas mínimo');
              const isAttachment = weapon.includes('Accesorios prioritarios:');
              
              return (
                <View key={index} style={styles.weaponItem}>
                  <Text style={styles.weaponPriority}>{index + 1}.</Text>
                  <Text style={[
                    styles.weaponText,
                    isMainWeapon && styles.primaryWeaponText,
                    isSecondaryWeapon && styles.secondaryWeaponText,
                    isAmmoInfo && styles.ammoText,
                    isAttachment && styles.attachmentText
                  ]}>{weapon}</Text>
                </View>
              );
            })}
          </View>

          {/* Estrategia de Vehículos */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>🚗 Estrategia de Vehículos</Text>
            <Text style={styles.vehicleStrategy}>{strategy.vehicleStrategy}</Text>
          </View>

          {/* Planes de Contingencia */}
          {strategy.contingencyPlans && strategy.contingencyPlans.length > 0 && (
            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🚨 Planes de Contingencia</Text>
              {strategy.contingencyPlans.map((plan, index) => (
                <View key={index} style={styles.contingencyPlan}>
                  <Text style={styles.contingencyScenario}>{plan.scenario}</Text>
                  <Text style={styles.contingencyAction}>{plan.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Acciones por Tiempo */}
          {strategy.timeBasedActions && strategy.timeBasedActions.length > 0 && (
            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>⏰ Acciones por Tiempo</Text>
              {strategy.timeBasedActions.map((action, index) => (
                <View key={index} style={styles.timeAction}>
                  <View style={styles.timeHeader}>
                    <Text style={styles.timeRange}>{action.timeRange}</Text>
                    <Text style={[styles.timePriority, { 
                      color: action.priority === 'CRÍTICO' ? '#F44336' : 
                             action.priority === 'ALTO' ? '#FF9800' : '#4CAF50' 
                    }]}>
                      {action.priority}
                    </Text>
                  </View>
                  <Text style={styles.timeActionText}>{action.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Consejos */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>💡 Consejos Estratégicos</Text>
            {strategy.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Evaluación de Riesgo */}
          <View style={styles.strategySection}>
            <Text style={styles.strategySectionTitle}>⚠️ Evaluación de Riesgo</Text>
            <Text style={styles.riskAssessment}>{strategy.riskAssessment}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function PUBGStrategyScreen() {
  const [selectedMap, setSelectedMap] = useState<string>('erangel');
  const [planeRoute, setPlaneRoute] = useState<PlaneRoute>({
    startPoint: { x: 400, y: 100 },
    endPoint: { x: 400, y: 700 },
    angle: 90
  });
  const [strategyConfig, setStrategyConfig] = useState<Partial<StrategyRequest>>({
    playStyle: 'balanced',
    teamSize: 4,
    experience: 'intermediate'
  });
  const [generatedStrategy, setGeneratedStrategy] = useState<AdvancedStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  const [circleAnalysis, setCircleAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'analysis' | 'stats' | 'weapons'>('strategy');
  const [mapStats, setMapStats] = useState<any>(null);

  const generateStrategy = async () => {
    if (!selectedMap) {
      Alert.alert('Error', 'Por favor selecciona un mapa');
      return;
    }

    setIsGenerating(true);
    
    try {
      const request: StrategyRequest = {
        mapId: selectedMap,
        planeRoute,
        playStyle: strategyConfig.playStyle || 'balanced',
        teamSize: strategyConfig.teamSize || 4,
        experience: strategyConfig.experience || 'intermediate'
      };

      // Simular tiempo de generación para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const strategy = aiStrategyGenerator.generateAdvancedStrategy(request);
      setGeneratedStrategy(strategy);
      
      // Generar análisis de círculo
      const selectedMapData = ALL_MAPS.find(m => m.id === selectedMap);
      if (selectedMapData) {
        const analysis = aiStrategyGenerator.analyzeCircleStrategy(selectedMapData, request);
        setCircleAnalysis(analysis);
      }
      
      // Obtener estadísticas del mapa
      const stats = aiStrategyGenerator.getStrategyStats(selectedMap);
      setMapStats(stats);
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la estrategia. Inténtalo de nuevo.');
      console.error('Error generating strategy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuickAnalysis = () => {
    if (!selectedMap) {
      Alert.alert('Error', 'Por favor selecciona un mapa');
      return;
    }
    
    const quickAnalysis = quickStrategyAnalysis(selectedMap, planeRoute, strategyConfig.playStyle || 'balanced');
    setCircleAnalysis(quickAnalysis);
    setShowAdvancedAnalysis(true);
  };

  const renderTabButton = (tab: 'strategy' | 'analysis' | 'stats' | 'weapons', title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {icon} {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 PUBG Mobile Strategy</Text>
          <Text style={styles.subtitle}>Generador de Estrategias con IA</Text>
        </View>

        {/* Tabs de navegación */}
        <View style={styles.tabContainer}>
          {renderTabButton('strategy', 'Estrategia', '🎮')}
          {renderTabButton('analysis', 'Análisis', '📊')}
          {renderTabButton('stats', 'Estadísticas', '📈')}
          {renderTabButton('weapons', 'Armas', '🔫')}
        </View>

        {activeTab === 'strategy' && (
          <>
            <MapSelection 
              selectedMap={selectedMap} 
              onMapSelect={setSelectedMap} 
            />

            <PlaneRouteConfig 
              onRouteChange={setPlaneRoute} 
            />

            <StrategyConfig 
              config={strategyConfig} 
              onConfigChange={setStrategyConfig} 
            />

            <View style={styles.generateButtonContainer}>
              <TouchableOpacity 
                style={[styles.generateButton, isGenerating && styles.generatingButton]}
                onPress={generateStrategy}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={isGenerating ? ['#9E9E9E', '#757575'] : ['#4CAF50', '#45a049']}
                  style={styles.generateButtonGradient}
                >
                  {isGenerating ? (
                    <>
                      <Ionicons name="refresh" size={24} color="#fff" />
                      <Text style={styles.generateButtonText}>Generando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="flash" size={24} color="#fff" />
                      <Text style={styles.generateButtonText}>Generar Estrategia</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAnalysisButton} 
                onPress={generateQuickAnalysis}
              >
                <Text style={styles.quickAnalysisText}>⚡ Análisis Rápido</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'weapons' && generatedStrategy && (
          <View style={styles.weaponsContainer}>
            <Text style={styles.strategyTitle}>🔫 Análisis Detallado de Armas</Text>
            
            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>📊 Disponibilidad en Zona</Text>
              {(() => {
                try {
                  const analysis = analyzeZoneWeaponAvailability(selectedMap, generatedStrategy.recommendedDrop.name);
                  return (
                    <View>
                      <View style={styles.weaponStatsContainer}>
                        <View style={styles.weaponStatItem}>
                          <Text style={styles.weaponStatLabel}>Diversidad de Armas</Text>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${analysis.weaponDiversity * 100}%` }]} />
                          </View>
                          <Text style={styles.weaponStatValue}>{(analysis.weaponDiversity * 100).toFixed(0)}%</Text>
                        </View>
                        
                        <View style={styles.weaponStatItem}>
                          <Text style={styles.weaponStatLabel}>Disponibilidad de Accesorios</Text>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${analysis.attachmentAvailability * 100}%` }]} />
                          </View>
                          <Text style={styles.weaponStatValue}>{(analysis.attachmentAvailability * 100).toFixed(0)}%</Text>
                        </View>
                        
                        <View style={styles.weaponStatItem}>
                          <Text style={styles.weaponStatLabel}>Seguridad de Munición</Text>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${analysis.ammoSecurity * 100}%` }]} />
                          </View>
                          <Text style={styles.weaponStatValue}>{(analysis.ammoSecurity * 100).toFixed(0)}%</Text>
                        </View>
                      </View>
                      
                      <View style={[
                        styles.overallRatingContainer,
                        analysis.overallRating === 'Excellent' && styles.excellentRating,
                        analysis.overallRating === 'Good' && styles.goodRating,
                        analysis.overallRating === 'Fair' && styles.fairRating,
                        analysis.overallRating === 'Poor' && styles.poorRating
                      ]}>
                        <Text style={styles.overallRatingText}>Calificación General: {analysis.overallRating}</Text>
                      </View>
                      
                      <View style={styles.weaponRecommendationsContainer}>
                        <Text style={styles.weaponRecommendationsTitle}>💡 Recomendaciones Específicas</Text>
                        {analysis.recommendations.map((rec, index) => (
                          <Text key={index} style={styles.weaponRecommendationText}>• {rec}</Text>
                        ))}
                      </View>
                    </View>
                  );
                } catch (error) {
                  return (
                    <Text style={styles.strategyText}>No hay datos específicos de armas para esta zona</Text>
                  );
                }
              })()}
            </View>
            
            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🎯 Configuración Recomendada</Text>
              <View style={styles.weaponConfigContainer}>
                <Text style={styles.strategyText}>Basado en tu estilo de juego: <Text style={styles.boldText}>{strategyConfig.playStyle}</Text></Text>
                <Text style={styles.strategyText}>Tamaño del equipo: <Text style={styles.boldText}>{strategyConfig.teamSize} jugador{(strategyConfig.teamSize || 1) > 1 ? 'es' : ''}</Text></Text>
                <Text style={styles.strategyText}>Experiencia: <Text style={styles.boldText}>{strategyConfig.experience}</Text></Text>
              </View>
            </View>
          </View>
        )}
        {activeTab === 'analysis' && circleAnalysis && (
          <View style={styles.analysisContainer}>
            <Text style={styles.strategyTitle}>📊 Análisis Avanzado</Text>
            
            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🎯 Predicción de Círculo</Text>
              <Text style={styles.strategyText}>
                Centro predicho: ({circleAnalysis.likelyFirstCircle?.x || 0}, {circleAnalysis.likelyFirstCircle?.y || 0})
              </Text>
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🔥 Zonas Calientes</Text>
              {circleAnalysis.hotZones?.map((zone: any, index: number) => (
                <Text key={index} style={styles.hotZoneText}>
                  🎯 {zone.name} - Riesgo: {zone.riskLevel}
                </Text>
              )) || <Text style={styles.strategyText}>No hay zonas calientes identificadas</Text>}
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🛡️ Rutas Seguras</Text>
              {circleAnalysis.safeRotationRoutes?.map((route: any, index: number) => (
                <Text key={index} style={styles.routeText}>
                  🛣️ {route.from} → {route.to} (Seguridad: {route.safetyScore}%)
                </Text>
              )) || <Text style={styles.strategyText}>Analizando rutas...</Text>}
            </View>

            <View style={styles.strategySection}>
              <Text style={styles.strategySectionTitle}>🚗 Vehículos Prioritarios</Text>
              {circleAnalysis.vehiclePriority?.slice(0, 3).map((vehicle: any, index: number) => (
                <Text key={index} style={styles.vehicleText}>
                  🚗 {vehicle.location} - Prioridad: {vehicle.priority.toFixed(1)}
                </Text>
              )) || <Text style={styles.strategyText}>No hay vehículos analizados</Text>}
            </View>
          </View>
        )}

        {activeTab === 'stats' && mapStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.strategyTitle}>📈 Estadísticas del Mapa</Text>
            
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>📊 Rendimiento General</Text>
              <Text style={styles.statText}>Estrategias generadas: {mapStats.totalStrategies}</Text>
              <Text style={styles.statText}>Tasa de supervivencia promedio: {(mapStats.averageSurvivalRate * 100).toFixed(1)}%</Text>
              <Text style={styles.statText}>Estrategias exitosas: {mapStats.successfulStrategies}</Text>
            </View>

            {mapStats.performanceMetrics && (
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>🎯 Métricas de Rendimiento</Text>
                <Text style={styles.statText}>Tolerancia al riesgo: {mapStats.performanceMetrics.averageRiskTolerance.toFixed(1)}/4</Text>
                <Text style={styles.statText}>Estilo preferido: {mapStats.performanceMetrics.preferredPlayStyle}</Text>
                <Text style={styles.statText}>Puntuación de adaptabilidad: {mapStats.performanceMetrics.adaptabilityScore.toFixed(1)}%</Text>
              </View>
            )}

            {mapStats.trendAnalysis && (
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>📈 Análisis de Tendencias</Text>
                <Text style={styles.statText}>Tendencia: {mapStats.trendAnalysis.survivalTrend}</Text>
                <Text style={styles.statText}>Fuerza de tendencia: {(mapStats.trendAnalysis.trendStrength * 100).toFixed(1)}%</Text>
                <Text style={styles.recommendationText}>{mapStats.trendAnalysis.recommendation}</Text>
              </View>
            )}

            <View style={styles.statCard}>
              <Text style={styles.statTitle}>🎯 Zonas Más Utilizadas</Text>
              {mapStats.mostUsedDrops?.map((drop: string, index: number) => (
                <Text key={index} style={styles.statText}>
                  {index + 1}. {drop}
                </Text>
              )) || <Text style={styles.statText}>No hay datos suficientes</Text>}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Modal de análisis avanzado */}
      <Modal
        visible={showAdvancedAnalysis}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdvancedAnalysis(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚡ Análisis Rápido</Text>
            {circleAnalysis && (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalText}>Análisis completado para {selectedMap}</Text>
                <Text style={styles.modalText}>Zonas calientes detectadas: {circleAnalysis.hotZones?.length || 0}</Text>
                <Text style={styles.modalText}>Rutas seguras: {circleAnalysis.safeRotationRoutes?.length || 0}</Text>
              </ScrollView>
            )}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowAdvancedAnalysis(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StrategyDisplay 
        strategy={generatedStrategy} 
        onClose={() => setGeneratedStrategy(null)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#666'
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  mapScrollView: {
    marginTop: 10
  },
  mapCard: {
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    width: 140,
    height: 100
  },
  selectedMapCard: {
    transform: [{ scale: 1.05 }]
  },
  mapGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  mapSize: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2
  },
  mapTerrain: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center'
  },
  routeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    minWidth: 120
  },
  selectedRouteButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  routeButtonText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333'
  },
  selectedRouteButtonText: {
    color: '#fff'
  },
  configGroup: {
    marginBottom: 20
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  optionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    minWidth: 100,
    alignItems: 'center'
  },
  selectedOptionButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center'
  },
  selectedOptionButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  generateButtonContainer: {
    padding: 20
  },
  generateButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  generatingButton: {
    opacity: 0.7
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  modalContent: {
    flex: 1,
    padding: 15
  },
  strategySection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  strategySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  dropZoneCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50'
  },
  dropZoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  dropZoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  dropZoneStats: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  lootStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 15
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  weaponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6
  },
  weaponPriority: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 10,
    minWidth: 25
  },
  weaponText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  vehicleStrategy: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  contingencyPlan: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  contingencyScenario: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5
  },
  contingencyAction: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18
  },
  timeAction: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timeRange: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  timePriority: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  timeActionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  tipItem: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  tipText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 18
  },
  riskAssessment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#2196F3'
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  quickAnalysisButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    alignItems: 'center'
  },
  quickAnalysisText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  analysisContainer: {
    margin: 15
  },
  hotZoneText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 5,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6
  },
  routeText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6
  },
  vehicleText: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 5,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6
  },
  statCard: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  recommendationText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 5
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '90%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalScroll: {
    maxHeight: 300
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  modalCloseButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  strategyContainer: {
    margin: 15
  },
  strategyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  strategyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  rotationStep: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  riskBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  rotationStepContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  rotationPhase: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2
  },
  rotationTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  criticalPriority: {
    backgroundColor: '#F44336',
    color: '#fff'
  },
  highPriority: {
    backgroundColor: '#FF9800',
    color: '#fff'
  },
  mediumPriority: {
     backgroundColor: '#4CAF50',
     color: '#fff'
   },
   weaponText: {
     fontSize: 14,
     color: '#333',
     marginBottom: 6,
     padding: 8,
     backgroundColor: '#fff3e0',
     borderRadius: 6,
     borderLeftWidth: 3,
     borderLeftColor: '#FF9800'
   },
   tipText: {
     fontSize: 14,
     color: '#333',
     marginBottom: 6,
     padding: 8,
     backgroundColor: '#e8f5e8',
     borderRadius: 6,
     borderLeftWidth: 3,
     borderLeftColor: '#4CAF50'
   },
   primaryWeaponText: {
     backgroundColor: '#ffebee',
     borderLeftColor: '#f44336',
     fontWeight: 'bold'
   },
   secondaryWeaponText: {
     backgroundColor: '#e3f2fd',
     borderLeftColor: '#2196f3',
     fontWeight: 'bold'
   },
   ammoText: {
     backgroundColor: '#fff3e0',
     borderLeftColor: '#ff9800',
     fontSize: 12,
     fontStyle: 'italic'
   },
   attachmentText: {
     backgroundColor: '#f3e5f5',
     borderLeftColor: '#9c27b0',
     fontSize: 13
   },
   weaponsContainer: {
     margin: 15
   },
   weaponStatsContainer: {
     marginVertical: 10
   },
   weaponStatItem: {
     marginBottom: 15
   },
   weaponStatLabel: {
     fontSize: 14,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 5
   },
   progressBar: {
     height: 8,
     backgroundColor: '#e0e0e0',
     borderRadius: 4,
     marginBottom: 5
   },
   progressFill: {
     height: '100%',
     backgroundColor: '#4CAF50',
     borderRadius: 4
   },
   weaponStatValue: {
     fontSize: 12,
     color: '#666',
     textAlign: 'right'
   },
   overallRatingContainer: {
     padding: 12,
     borderRadius: 8,
     marginVertical: 10,
     alignItems: 'center'
   },
   excellentRating: {
     backgroundColor: '#e8f5e8',
     borderColor: '#4CAF50',
     borderWidth: 1
   },
   goodRating: {
     backgroundColor: '#e3f2fd',
     borderColor: '#2196F3',
     borderWidth: 1
   },
   fairRating: {
     backgroundColor: '#fff3e0',
     borderColor: '#FF9800',
     borderWidth: 1
   },
   poorRating: {
     backgroundColor: '#ffebee',
     borderColor: '#F44336',
     borderWidth: 1
   },
   overallRatingText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333'
   },
   weaponRecommendationsContainer: {
     marginTop: 15
   },
   weaponRecommendationsTitle: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 10
   },
   weaponRecommendationText: {
     fontSize: 14,
     color: '#666',
     marginBottom: 5,
     lineHeight: 20
   },
   weaponConfigContainer: {
     backgroundColor: '#f8f9fa',
     padding: 15,
     borderRadius: 8
   },
   boldText: {
     fontWeight: 'bold',
     color: '#2196F3'
   }
});