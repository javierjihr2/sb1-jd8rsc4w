import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableModal } from './EnhancedGestures';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

const { width, height } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'pubg-strategy',
    title: 'PUBG Strategy',
    icon: 'game-controller-outline',
    route: '/pubg-strategy',
    description: 'Generador de estrategias con IA'
  },
  {
    id: 'friends',
    title: 'Amigos',
    icon: 'people-outline',
    route: '/friends',
    description: 'Lista de amigos y conexiones'
  },
  {
    id: 'news',
    title: 'Noticias',
    icon: 'newspaper-outline',
    route: '/news',
    description: 'Últimas noticias del gaming'
  },
  {
    id: 'sensitivities',
    title: 'Sensibilidades',
    icon: 'settings-outline',
    route: '/sensitivities',
    description: 'Configuración de controles'
  },
  {
    id: 'maps',
    title: 'Mapas',
    icon: 'map-outline',
    route: '/maps',
    description: 'Explorar mapas del Battle Royale'
  },
  {
    id: 'tournament-chat',
    title: 'Chat Torneos',
    icon: 'trophy-outline',
    route: '/tournament-chat',
    description: 'Chat específico de torneos'
  },
  {
    id: 'creators',
    title: 'Creadores',
    icon: 'people-outline',
    route: '/creators',
    description: 'Comunidad de creadores'
  },
  {
    id: 'admin',
    title: 'Admin',
    icon: 'shield-checkmark-outline',
    route: '/admin',
    description: 'Panel de administración'
  },
  {
    id: 'controls-generator',
    title: 'Controles',
    icon: 'game-controller-outline',
    route: '/controls-generator',
    description: 'Generador de controles'
  },
  {
    id: 'duo-comparison',
    title: 'Dúos',
    icon: 'people-outline',
    route: '/duo-comparison',
    description: 'Comparación de dúos'
  },
  {
    id: 'creator-portal',
    title: 'Portal',
    icon: 'briefcase-outline',
    route: '/creator-portal',
    description: 'Portal de creadores'
  },
  {
    id: 'services',
    title: 'Servicios',
    icon: 'briefcase-outline',
    route: '/services',
    description: 'Servicios adicionales'
  }
];

interface DropdownMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DropdownMenu({ isVisible, onClose }: DropdownMenuProps) {
  const router = useRouter();
  const { isTablet } = useDeviceInfo();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-300)); // Desliza desde la izquierda

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const handleItemPress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <SwipeableModal
      visible={isVisible}
      onClose={onClose}
      swipeDirection="left"
      swipeThreshold={isTablet ? 150 : 100}
      animationType="none"
      presentationStyle="overFullScreen"
    >
      <Animated.View 
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Más Opciones</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
              scrollEventThrottle={16}
            >
              {menuItems.map((item, index) => {
                // Colores diferentes para cada categoría
                const getIconColor = (id: string) => {
                  const colors = {
                    'pubg-strategy': '#ff6b35',
                    'friends': '#06b6d4',
                    'news': '#ef4444',
                    'sensitivities': '#8b5cf6',
                    'maps': '#10b981',
                    'tournament-chat': '#f59e0b',
                    'creators': '#ec4899',
                    'admin': '#dc2626',
                    'controls-generator': '#06b6d4',
                    'duo-comparison': '#84cc16',
                    'creator-portal': '#f97316',
                    'services': '#6366f1'
                  };
                  return colors[id as keyof typeof colors] || '#3b82f6';
                };
                
                const getContainerColor = (id: string) => {
                  const color = getIconColor(id);
                  return color + '20'; // Añade transparencia
                };
                
                const getBorderColor = (id: string) => {
                  const color = getIconColor(id);
                  return color + '40'; // Añade transparencia
                };
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      index === menuItems.length - 1 && styles.lastMenuItem
                    ]}
                    onPress={() => handleItemPress(item.route)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    accessibilityHint={item.description || `Navega a ${item.title}`}
                  >
                    <View style={[
                      styles.iconContainer,
                      {
                        backgroundColor: getContainerColor(item.id),
                        borderColor: getBorderColor(item.id),
                        shadowColor: getIconColor(item.id),
                      }
                    ]}>
                      <Ionicons 
                        name={item.icon as any} 
                        size={26} 
                        color={getIconColor(item.id)} 
                     />
                     </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      )}
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={22} 
                      color="#94a3b8" 
                      style={{
                        textShadowColor: 'rgba(148, 163, 184, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </SwipeableModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  overlayTouch: {
    flex: 1,
  },
  menuContainer: {
    width: 300,
    height: height * 0.75, // Altura fija para evitar problemas de scroll
    position: 'absolute',
    top: 60, // Posición fija desde arriba
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lastMenuItem: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
});