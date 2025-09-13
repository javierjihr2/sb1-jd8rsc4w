import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ControlsInput {
  deviceType: string;
  fingerCount: number;
}

interface KeyActions {
  movement: string;
  aim: string;
  shoot: string;
  mainActions: string;
}

interface ControlsTip {
  title: string;
  description: string;
}

interface Controls {
  layoutName: string;
  imageUrl: string;
  advantages: string[];
  disadvantages: string[];
  keyActions: KeyActions;
  tips: ControlsTip[];
  description: string;
}

// Datos simulados para diferentes configuraciones
const mockControlsData: { [key: string]: Controls } = {
  'Telefono-2': {
    layoutName: 'Layout Básico de 2 Dedos',
    imageUrl: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300',
    advantages: [
      'Fácil de aprender para principiantes',
      'Cómodo para sesiones largas de juego',
      'No requiere posiciones complicadas de dedos'
    ],
    disadvantages: [
      'Limitado en velocidad de reacción',
      'Dificulta el multitasking en combate'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Pulgar derecho',
      mainActions: 'Pulgares alternando'
    },
    tips: [
      {
        title: 'Posición de Pulgares',
        description: 'Mantén los pulgares en la parte inferior de la pantalla para mayor comodidad'
      },
      {
        title: 'Tamaño de Botones',
        description: 'Usa botones grandes para facilitar el toque preciso'
      }
    ],
    description: 'Configuración ideal para jugadores casuales que buscan comodidad y facilidad de uso.'
  },
  'Telefono-3': {
    layoutName: 'Layout de 3 Dedos (Garra Básica)',
    imageUrl: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300',
    advantages: [
      'Mejor control de cámara independiente',
      'Permite disparar mientras se mueve',
      'Transición natural desde 2 dedos'
    ],
    disadvantages: [
      'Requiere práctica para dominar',
      'Puede causar fatiga inicial'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Índice derecho',
      mainActions: 'Combinación de dedos'
    },
    tips: [
      {
        title: 'Posición del Índice',
        description: 'Coloca el botón de disparo en la esquina superior derecha para fácil acceso'
      },
      {
        title: 'Práctica Gradual',
        description: 'Practica en el campo de entrenamiento antes de jugar partidas clasificatorias'
      }
    ],
    description: 'Configuración intermedia que mejora significativamente el control en combate.'
  },
  'Telefono-4': {
    layoutName: 'Layout de 4 Dedos (Garra Avanzada)',
    imageUrl: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300',
    advantages: [
      'Control completo e independiente',
      'Velocidad de reacción máxima',
      'Ideal para juego competitivo'
    ],
    disadvantages: [
      'Curva de aprendizaje pronunciada',
      'Puede causar fatiga en sesiones largas'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Índice derecho',
      mainActions: 'Índice izquierdo'
    },
    tips: [
      {
        title: 'Distribución Equilibrada',
        description: 'Distribuye las acciones principales entre ambos índices'
      },
      {
        title: 'Ergonomía',
        description: 'Ajusta la altura de los botones para evitar tensión en las muñecas'
      }
    ],
    description: 'Configuración profesional para jugadores competitivos que buscan el máximo rendimiento.'
  },
  'Telefono-5': {
    layoutName: 'Layout de 5+ Dedos (Garra Profesional)',
    imageUrl: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300',
    advantages: [
      'Control absoluto de todas las funciones',
      'Velocidad profesional de eSports',
      'Capacidad de realizar combos complejos'
    ],
    disadvantages: [
      'Extremadamente difícil de dominar',
      'Requiere dispositivos con pantalla grande'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Índice derecho',
      mainActions: 'Índices y dedos medios'
    },
    tips: [
      {
        title: 'Entrenamiento Intensivo',
        description: 'Dedica al menos 2 horas diarias de práctica para dominar esta configuración'
      },
      {
        title: 'Dispositivo Adecuado',
        description: 'Usa un teléfono de al menos 6.5 pulgadas para comodidad óptima'
      }
    ],
    description: 'Configuración de élite utilizada por jugadores profesionales en torneos internacionales.'
  },
  'Tablet-2': {
    layoutName: 'Layout de Tablet - 2 Dedos',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300',
    advantages: [
      'Máxima comodidad en pantalla grande',
      'Botones espaciados para precisión',
      'Ideal para jugadores casuales en tablet'
    ],
    disadvantages: [
      'Velocidad limitada comparado con garra',
      'Menos eficiente en combates intensos'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Pulgar derecho',
      mainActions: 'Pulgares alternando'
    },
    tips: [
      {
        title: 'Aprovecha el Espacio',
        description: 'Distribuye los botones aprovechando toda la pantalla de la tablet'
      },
      {
        title: 'Agarre Estable',
        description: 'Usa un soporte o agarre especial para tablets gaming'
      }
    ],
    description: 'Configuración optimizada para el tamaño y ergonomía de tablets.'
  },
  'Tablet-4': {
    layoutName: 'Layout de Tablet - 4 Dedos Pro',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300',
    advantages: [
      'Aprovecha completamente la pantalla grande',
      'Control profesional con comodidad',
      'Ideal para streaming y competición'
    ],
    disadvantages: [
      'Requiere accesorios de agarre',
      'Puede ser pesado para sesiones largas'
    ],
    keyActions: {
      movement: 'Pulgar izquierdo',
      aim: 'Pulgar derecho',
      shoot: 'Índice derecho',
      mainActions: 'Índice izquierdo'
    },
    tips: [
      {
        title: 'Triggers Físicos',
        description: 'Considera usar triggers físicos para mayor precisión'
      },
      {
        title: 'Cooling Pad',
        description: 'Usa un cooling pad para evitar sobrecalentamiento'
      }
    ],
    description: 'Configuración profesional que combina la comodidad de tablet con control avanzado.'
  }
};

export default function ControlsGenerator() {
  const [controlsInput, setControlsInput] = useState<ControlsInput>({
    deviceType: '',
    fingerCount: 0
  });
  const [controls, setControls] = useState<Controls | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState<ControlsTip | null>(null);

  const deviceTypes = [
    { value: 'Telefono', label: 'Teléfono', icon: 'phone-portrait' },
    { value: 'Tablet', label: 'Tablet', icon: 'tablet-portrait' }
  ];

  const fingerCounts = [
    { value: 2, label: '2 Dedos (Pulgares)', description: 'Básico y cómodo' },
    { value: 3, label: '3 Dedos (Garra)', description: 'Intermedio' },
    { value: 4, label: '4 Dedos (Garra)', description: 'Avanzado' },
    { value: 5, label: '5+ Dedos (Garra Pro)', description: 'Profesional' }
  ];

  const handleGenerateControls = async () => {
    if (!controlsInput.deviceType || !controlsInput.fingerCount) {
      Alert.alert('Error', 'Por favor selecciona todos los campos');
      return;
    }

    setIsLoading(true);
    
    // Simular llamada a API
    setTimeout(() => {
      const key = `${controlsInput.deviceType}-${controlsInput.fingerCount}`;
      const result = mockControlsData[key] || mockControlsData['Telefono-2'];
      setControls(result);
      setIsLoading(false);
    }, 2000);
  };

  const handleShareLayout = async () => {
    if (!controls) return;
    
    try {
      await Share.share({
        message: `Mi configuración de controles PUBG Mobile: ${controls.layoutName}\n\nVentajas:\n${controls.advantages.join('\n')}\n\nDescripción: ${controls.description}`,
        title: 'Configuración de Controles PUBG Mobile'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const resetForm = () => {
    setControlsInput({ deviceType: '', fingerCount: 0 });
    setControls(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="game-controller" size={28} color="#f97316" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Generador de Controles</Text>
              <Text style={styles.headerSubtitle}>Optimiza tu HUD para máximo rendimiento</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Configuration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            
            {/* Device Type Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo de Dispositivo</Text>
              <View style={styles.optionsGrid}>
                {deviceTypes.map((device) => (
                  <TouchableOpacity
                    key={device.value}
                    style={[
                      styles.optionCard,
                      controlsInput.deviceType === device.value && styles.optionCardSelected
                    ]}
                    onPress={() => setControlsInput(prev => ({ ...prev, deviceType: device.value }))}
                  >
                    <Ionicons 
                      name={device.icon as any} 
                      size={32} 
                      color={controlsInput.deviceType === device.value ? '#f97316' : '#64748b'} 
                    />
                    <Text style={[
                      styles.optionLabel,
                      controlsInput.deviceType === device.value && styles.optionLabelSelected
                    ]}>
                      {device.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Finger Count Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Número de Dedos</Text>
              <View style={styles.fingerOptions}>
                {fingerCounts.map((finger) => (
                  <TouchableOpacity
                    key={finger.value}
                    style={[
                      styles.fingerCard,
                      controlsInput.fingerCount === finger.value && styles.fingerCardSelected
                    ]}
                    onPress={() => setControlsInput(prev => ({ ...prev, fingerCount: finger.value }))}
                  >
                    <Text style={[
                      styles.fingerNumber,
                      controlsInput.fingerCount === finger.value && styles.fingerNumberSelected
                    ]}>
                      {finger.value}
                    </Text>
                    <Text style={[
                      styles.fingerLabel,
                      controlsInput.fingerCount === finger.value && styles.fingerLabelSelected
                    ]}>
                      {finger.label}
                    </Text>
                    <Text style={[
                      styles.fingerDescription,
                      controlsInput.fingerCount === finger.value && styles.fingerDescriptionSelected
                    ]}>
                      {finger.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!controlsInput.deviceType || !controlsInput.fingerCount) && styles.generateButtonDisabled
              ]}
              onPress={handleGenerateControls}
              disabled={!controlsInput.deviceType || !controlsInput.fingerCount || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="sparkles" size={20} color="white" />
              )}
              <Text style={styles.generateButtonText}>
                {isLoading ? 'Generando...' : 'Generar Controles'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {controls && !isLoading && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>{controls.layoutName}</Text>
                <View style={styles.resultsActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleShareLayout}>
                    <Ionicons name="share" size={20} color="#f97316" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={resetForm}>
                    <Ionicons name="refresh" size={20} color="#f97316" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.resultsDescription}>{controls.description}</Text>

              {/* Layout Image */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: controls.imageUrl }} style={styles.layoutImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="eye" size={24} color="white" />
                  <Text style={styles.imageOverlayText}>Vista Previa del Layout</Text>
                </View>
              </View>

              {/* Key Actions */}
              <View style={styles.keyActionsContainer}>
                <Text style={styles.sectionSubtitle}>Acciones Clave</Text>
                <View style={styles.keyActionsList}>
                  {Object.entries(controls.keyActions).map(([action, description]) => (
                    <View key={action} style={styles.keyActionItem}>
                      <View style={styles.keyActionIcon}>
                        <Ionicons 
                          name={
                            action === 'movement' ? 'walk' :
                            action === 'aim' ? 'eye' :
                            action === 'shoot' ? 'radio-button-on' :
                            'hand-left'
                          } 
                          size={16} 
                          color="#f97316" 
                        />
                      </View>
                      <View style={styles.keyActionContent}>
                        <Text style={styles.keyActionTitle}>
                          {action === 'movement' ? 'Movimiento' :
                           action === 'aim' ? 'Apuntar' :
                           action === 'shoot' ? 'Disparar' :
                           'Acciones Principales'}
                        </Text>
                        <Text style={styles.keyActionDescription}>{description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Advantages & Disadvantages */}
              <View style={styles.prosConsContainer}>
                <View style={styles.prosContainer}>
                  <Text style={styles.prosTitle}>Ventajas</Text>
                  {controls.advantages.map((advantage, index) => (
                    <View key={index} style={styles.prosItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.prosText}>{advantage}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.consContainer}>
                  <Text style={styles.consTitle}>Desafíos</Text>
                  {controls.disadvantages.map((disadvantage, index) => (
                    <View key={index} style={styles.consItem}>
                      <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                      <Text style={styles.consText}>{disadvantage}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.sectionSubtitle}>Consejos Profesionales</Text>
                <View style={styles.tipsList}>
                  {controls.tips.map((tip, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tipCard}
                      onPress={() => {
                        setSelectedTip(tip);
                        setShowTipsModal(true);
                      }}
                    >
                      <View style={styles.tipIcon}>
                        <Ionicons name="bulb" size={20} color="#f97316" />
                      </View>
                      <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipPreview} numberOfLines={2}>{tip.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#64748b" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!controls && !isLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="game-controller-outline" size={64} color="#64748b" />
              </View>
              <Text style={styles.emptyStateTitle}>Tu Layout Ideal te Espera</Text>
              <Text style={styles.emptyStateDescription}>
                Selecciona tu dispositivo y estilo de juego para generar una configuración de controles optimizada
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Tips Modal */}
        <Modal
          visible={showTipsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowTipsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedTip?.title}</Text>
                <TouchableOpacity onPress={() => setShowTipsModal(false)}>
                  <Ionicons name="close" size={24} color="#f97316" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDescription}>{selectedTip?.description}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowTipsModal(false)}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#f97316',
    backgroundColor: '#451a03',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
  },
  optionLabelSelected: {
    color: '#f97316',
  },
  fingerOptions: {
    gap: 12,
  },
  fingerCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fingerCardSelected: {
    borderColor: '#f97316',
    backgroundColor: '#451a03',
  },
  fingerNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  fingerNumberSelected: {
    color: '#f97316',
  },
  fingerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  fingerLabelSelected: {
    color: 'white',
  },
  fingerDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  fingerDescriptionSelected: {
    color: '#94a3b8',
  },
  generateButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#64748b',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  layoutImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  keyActionsContainer: {
    marginBottom: 20,
  },
  keyActionsList: {
    gap: 12,
  },
  keyActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  keyActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#451a03',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  keyActionContent: {
    flex: 1,
  },
  keyActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  keyActionDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  prosConsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  prosContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  prosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  prosItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prosText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
  },
  consContainer: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  consTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
  },
  consItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipsList: {
    gap: 8,
  },
  tipCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#451a03',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  tipPreview: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});