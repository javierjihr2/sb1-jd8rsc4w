import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface CreatorFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isPremium: boolean;
  category: 'streaming' | 'analytics' | 'community' | 'monetization' | 'tournaments';
  benefits: string[];
}

const creatorFeatures: CreatorFeature[] = [
  {
    id: 'advanced-streaming',
    title: 'Streaming Avanzado',
    description: 'Herramientas profesionales para streaming de PUBG Mobile',
    icon: 'videocam',
    color: '#ef4444',
    isPremium: true,
    category: 'streaming',
    benefits: [
      'Overlays personalizados para PUBG Mobile',
      'Integración con OBS y XSplit',
      'Chat moderado automáticamente',
      'Alertas de donaciones y suscripciones',
      'Estadísticas en tiempo real en pantalla'
    ]
  },
  {
    id: 'tournament-organizer',
    title: 'Organizador de Torneos',
    description: 'Crea y gestiona torneos privados para tu comunidad',
    icon: 'trophy',
    color: '#f59e0b',
    isPremium: true,
    category: 'tournaments',
    benefits: [
      'Torneos privados ilimitados',
      'Sistema de brackets automático',
      'Gestión de premios y recompensas',
      'Transmisión en vivo integrada',
      'Estadísticas detalladas de participantes'
    ]
  },
  {
    id: 'audience-analytics',
    title: 'Analytics de Audiencia',
    description: 'Comprende mejor a tu audiencia con datos detallados',
    icon: 'analytics',
    color: '#3b82f6',
    isPremium: true,
    category: 'analytics',
    benefits: [
      'Demografía detallada de seguidores',
      'Horarios de mayor actividad',
      'Análisis de engagement por contenido',
      'Métricas de crecimiento',
      'Reportes exportables'
    ]
  },
  {
    id: 'monetization-tools',
    title: 'Herramientas de Monetización',
    description: 'Genera ingresos con tu contenido de PUBG Mobile',
    icon: 'cash',
    color: '#10b981',
    isPremium: true,
    category: 'monetization',
    benefits: [
      'Suscripciones de pago para fans',
      'Contenido exclusivo para suscriptores',
      'Donaciones integradas',
      'Marketplace de coaching',
      'Comisiones por referidos'
    ]
  },
  {
    id: 'community-management',
    title: 'Gestión de Comunidad',
    description: 'Administra tu comunidad de forma eficiente',
    icon: 'people',
    color: '#8b5cf6',
    isPremium: false,
    category: 'community',
    benefits: [
      'Moderación automática de chat',
      'Roles y permisos personalizados',
      'Eventos programados',
      'Encuestas y votaciones',
      'Sistema de reputación'
    ]
  },
  {
    id: 'content-scheduler',
    title: 'Programador de Contenido',
    description: 'Programa y automatiza tu contenido',
    icon: 'calendar',
    color: '#06b6d4',
    isPremium: true,
    category: 'streaming',
    benefits: [
      'Programación automática de streams',
      'Publicaciones en redes sociales',
      'Recordatorios para seguidores',
      'Análisis de mejores horarios',
      'Integración con calendarios'
    ]
  }
];

const categories = [
  { key: 'all', label: 'Todas', icon: 'grid-outline' },
  { key: 'streaming', label: 'Streaming', icon: 'videocam-outline' },
  { key: 'tournaments', label: 'Torneos', icon: 'trophy-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
  { key: 'monetization', label: 'Monetización', icon: 'cash-outline' },
  { key: 'community', label: 'Comunidad', icon: 'people-outline' }
];

export default function CreatorFeaturesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<CreatorFeature | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  const filteredFeatures = selectedCategory === 'all' 
    ? creatorFeatures 
    : creatorFeatures.filter(feature => feature.category === selectedCategory);

  const handleFeaturePress = (feature: CreatorFeature) => {
    setSelectedFeature(feature);
    setShowFeatureModal(true);
  };

  const handleActivateFeature = (feature: CreatorFeature) => {
    if (feature.isPremium) {
      Alert.alert(
        'Función Premium',
        'Esta función requiere una suscripción Pro. ¿Deseas suscribirte ahora?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Suscribirse', 
            onPress: () => {
              setShowFeatureModal(false);
              router.push('/subscriptions');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Función Activada',
        `¡${feature.title} ha sido activada en tu cuenta!`
      );
      setShowFeatureModal(false);
    }
  };

  const renderFeatureCard = (feature: CreatorFeature) => (
    <TouchableOpacity
      key={feature.id}
      onPress={() => handleFeaturePress(feature)}
      accessibilityRole="button"
      accessibilityLabel={feature.title}
      accessibilityHint={`Ver detalles de ${feature.title}. ${feature.isPremium ? 'Función premium.' : ''}`}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#374151'
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <View style={{
          backgroundColor: feature.color,
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}>
          <Ionicons name={feature.icon as any} size={24} color="white" />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4
          }}>
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1
            }}>
              {feature.title}
            </Text>
            
            {feature.isPremium && (
              <View style={{
                backgroundColor: '#f59e0b',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 10,
                  fontWeight: '600'
                }}>
                  PRO
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{
            color: '#9ca3af',
            fontSize: 14,
            lineHeight: 20
          }}>
            {feature.description}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 16
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la pantalla anterior"
            style={{
              marginRight: 16,
              padding: 8
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 'bold',
            flex: 1
          }}>
            Funciones de Creador
          </Text>
        </View>
        
        <Text style={{
          color: '#9ca3af',
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 16
        }}>
          Herramientas profesionales para hacer crecer tu canal de PUBG Mobile y conectar con tu audiencia.
        </Text>
        
        {/* Filtros de categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              onPress={() => setSelectedCategory(category.key)}
              accessibilityRole="tab"
              accessibilityLabel={category.label}
              accessibilityHint={`Filtrar funciones por categoría ${category.label}`}
              accessibilityState={{ selected: selectedCategory === category.key }}
              style={{
                backgroundColor: selectedCategory === category.key ? '#3b82f6' : '#374151',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: selectedCategory === category.key ? '600' : '400'
              }}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
      
      {/* Lista de funciones */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {filteredFeatures.map(renderFeatureCard)}
      </ScrollView>
      
      {/* Modal de detalles de función */}
      <Modal
        visible={showFeatureModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{
          flex: 1,
          backgroundColor: '#111827',
          paddingTop: 50
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold'
            }}>
              Detalles de Función
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowFeatureModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              accessibilityHint="Cierra el modal de detalles de función"
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {selectedFeature && (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={{
                alignItems: 'center',
                marginBottom: 24
              }}>
                <View style={{
                  backgroundColor: selectedFeature.color,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Ionicons name={selectedFeature.icon as any} size={40} color="white" />
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginRight: 12
                  }}>
                    {selectedFeature.title}
                  </Text>
                  
                  {selectedFeature.isPremium && (
                    <View style={{
                      backgroundColor: '#f59e0b',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: '600'
                      }}>
                        PREMIUM
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 16,
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  {selectedFeature.description}
                </Text>
              </View>
              
              <View style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 16
                }}>
                  Beneficios Incluidos
                </Text>
                
                {selectedFeature.benefits.map((benefit, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={selectedFeature.color}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      flex: 1,
                      lineHeight: 20
                    }}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity
                onPress={() => handleActivateFeature(selectedFeature)}
                accessibilityRole="button"
                accessibilityLabel={selectedFeature.isPremium ? 'Activar con Pro' : 'Activar Función'}
                accessibilityHint={selectedFeature.isPremium ? 'Activa esta función premium' : 'Activa esta función'}
                style={{
                  backgroundColor: selectedFeature.color,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 40
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {selectedFeature.isPremium ? 'Activar con Pro' : 'Activar Función'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}