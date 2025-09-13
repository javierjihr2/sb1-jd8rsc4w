import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useTheme } from '../../styles/theme';

// Importar todos los componentes modernos
import { GlassmorphismCard } from '../ui/GlassmorphismCard';
import { ModernNavigation } from '../ui/ModernNavigation';
import { FloatingActionButton } from '../ui/FloatingActionButton';
import { MicroInteraction, FloatingParticles, AnimatedLoading } from '../ui/MicroInteractions';
import { AdvancedNavigation } from '../ui/AdvancedNavigation';
import {
  GradientHeader,
  HierarchyCard,
  VisualSection,
  HierarchyList,
} from '../ui/VisualHierarchy';
import {
  FloatingActionMenu,
  FloatingNotification,
  FloatingTooltip,
  FloatingBadge,
} from '../ui/FloatingElements';

interface ModernUIDemoProps {
  onNavigate?: (screen: string) => void;
}

export const ModernUIDemo: React.FC<ModernUIDemoProps> = ({ onNavigate }) => {
  const { currentTheme, toggleTheme } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const tooltipRef = useRef<TouchableOpacity>(null);

  const navigationItems = [
    { id: '1', icon: 'home' as keyof typeof Ionicons.glyphMap, label: 'Inicio' },
    { id: '2', icon: 'search' as keyof typeof Ionicons.glyphMap, label: 'Buscar' },
    { id: '3', icon: 'heart' as keyof typeof Ionicons.glyphMap, label: 'Favoritos' },
    { id: '4', icon: 'person' as keyof typeof Ionicons.glyphMap, label: 'Perfil' },
  ];

  const fabActions = [
    {
      icon: 'camera' as keyof typeof Ionicons.glyphMap,
      label: 'Cámara',
      onPress: () => setShowNotification(true),
      color: theme.colors.accent.blue,
    },
    {
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      label: 'Documento',
      onPress: () => console.log('Documento'),
      color: theme.colors.accent.green,
    },
    {
      icon: 'location' as keyof typeof Ionicons.glyphMap,
      label: 'Ubicación',
      onPress: () => console.log('Ubicación'),
      color: theme.colors.accent.orange,
    },
  ];

  const hierarchyItems = [
    {
      id: '1',
      title: 'Tarea Crítica',
      subtitle: 'Requiere atención inmediata',
      priority: 'critical' as const,
      icon: 'warning' as keyof typeof Ionicons.glyphMap,
      badge: '!',
      onPress: () => console.log('Tarea crítica'),
    },
    {
      id: '2',
      title: 'Proyecto Importante',
      subtitle: 'Deadline próximo',
      priority: 'high' as const,
      icon: 'briefcase' as keyof typeof Ionicons.glyphMap,
      badge: '3',
      onPress: () => console.log('Proyecto'),
    },
    {
      id: '3',
      title: 'Reunión Semanal',
      subtitle: 'Equipo de desarrollo',
      priority: 'medium' as const,
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      onPress: () => console.log('Reunión'),
    },
    {
      id: '4',
      title: 'Revisión de Código',
      subtitle: 'Pull request pendiente',
      priority: 'low' as const,
      icon: 'code-slash' as keyof typeof Ionicons.glyphMap,
      onPress: () => console.log('Código'),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.colors.background.primary }}>
      {/* Header con gradiente y partículas */}
      <GradientHeader
        title="SquadGO Moderno"
        subtitle="Interfaz renovada con efectos avanzados"
        variant="aurora"
        height={220}
        showParticles={true}
      >
        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
          <MicroInteraction type="scale" onPress={toggleTheme}>
            <View
              style={[
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              ]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                {currentTheme.mode === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
              </Text>
            </View>
          </MicroInteraction>
          
          <TouchableOpacity
            ref={tooltipRef}
            onPress={() => setShowTooltip(!showTooltip)}
            style={[
              {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
              💡 Tooltip
            </Text>
          </TouchableOpacity>
        </View>
      </GradientHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de Tarjetas Glassmorphism */}
        <VisualSection
          title="Efectos Glassmorphism"
          subtitle="Tarjetas con efectos de cristal y blur"
          variant="gradient"
        >
          <View style={{ paddingHorizontal: 20 }}>
            <GlassmorphismCard
              variant="ultra"
              intensity={50}
              animated={true}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="diamond"
                  size={24}
                  color={currentTheme.colors.primary[500]}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      {
                        fontSize: 16,
                        fontWeight: '600',
                        color: currentTheme.colors.text.primary,
                        marginBottom: 4,
                      },
                    ]}
                  >
                    Efecto Cristal
                  </Text>
                  <Text
                    style={[
                      {
                        fontSize: 14,
                        color: currentTheme.colors.text.secondary,
                      },
                    ]}
                  >
                    Transparencia y blur avanzado
                  </Text>
                </View>
                <FloatingBadge
                  count={5}
                  variant="primary"
                  animated={true}
                />
              </View>
            </GlassmorphismCard>

            <GlassmorphismCard
              variant="premium"
              intensity={80}
              animated={true}
            >
              <View style={{ alignItems: 'center', padding: 20 }}>
                <AnimatedLoading size={40} color={currentTheme.colors.primary[500]} />
                <Text
                  style={[
                    {
                      fontSize: 16,
                      fontWeight: '600',
                      color: currentTheme.colors.text.primary,
                      marginTop: 12,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Cargando Contenido...
                </Text>
              </View>
            </GlassmorphismCard>
          </View>
        </VisualSection>

        {/* Sección de Jerarquía Visual */}
        <VisualSection
          title="Jerarquía Visual"
          subtitle="Organización por prioridad y importancia"
          variant="default"
        >
          <View style={{ paddingHorizontal: 20 }}>
            <HierarchyList
              items={hierarchyItems}
              variant="cards"
              showPriorityIndicator={true}
            />
          </View>
        </VisualSection>

        {/* Sección de Micro-interacciones */}
        <VisualSection
          title="Micro-interacciones"
          subtitle="Animaciones y feedback visual"
          variant="minimal"
        >
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MicroInteraction type="bounce">
                <View
                  style={[
                    {
                      backgroundColor: currentTheme.colors.accent.blue,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 25,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Bounce</Text>
                </View>
              </MicroInteraction>

              <MicroInteraction type="pulse">
                <View
                  style={[
                    {
                      backgroundColor: currentTheme.colors.accent.green,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 25,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Pulse</Text>
                </View>
              </MicroInteraction>

              <MicroInteraction type="glow">
                <View
                  style={[
                    {
                      backgroundColor: currentTheme.colors.accent.purple,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 25,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Glow</Text>
                </View>
              </MicroInteraction>

              <MicroInteraction type="shake">
                <View
                  style={[
                    {
                      backgroundColor: currentTheme.colors.accent.orange,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 25,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Shake</Text>
                </View>
              </MicroInteraction>
            </View>
          </View>
        </VisualSection>

        {/* Sección de Navegación Avanzada */}
        <VisualSection
          title="Navegación Moderna"
          subtitle="Transiciones suaves y efectos avanzados"
          variant="gradient"
        >
          <View style={{ paddingHorizontal: 20 }}>
            <AdvancedNavigation
              items={navigationItems}
              activeItem={navigationItems[activeTab]?.id || '1'}
              onItemPress={(itemId: string) => {
                const index = navigationItems.findIndex(item => item.id === itemId);
                if (index !== -1) setActiveTab(index);
              }}
              variant="floating"
              style="glass"
            />
          </View>
        </VisualSection>
      </ScrollView>

      {/* Elementos Flotantes */}
      <FloatingActionMenu
        mainIcon="add"
        actions={fabActions}
        variant="neon"
        position="bottom-right"
        size="medium"
      />

      {/* Notificación Flotante */}
      {showNotification && (
        <FloatingNotification
          message="¡Funcionalidad de cámara activada! La interfaz moderna está funcionando perfectamente."
          type="success"
          duration={4000}
          position="top"
          onDismiss={() => setShowNotification(false)}
        />
      )}

      {/* Tooltip Flotante */}
      <FloatingTooltip
        text="Este es un tooltip moderno con efectos glassmorphism"
        visible={showTooltip}
        targetRef={tooltipRef}
        position="bottom"
        variant="glass"
      />

      {/* Partículas Flotantes de Fondo */}
      <FloatingParticles
        count={20}
        colors={[
          currentTheme.colors.primary[500],
          currentTheme.colors.secondary[500],
          currentTheme.colors.accent.blue,
          currentTheme.colors.accent.purple,
        ]}
      />
    </SafeAreaView>
  );
};

export default ModernUIDemo;