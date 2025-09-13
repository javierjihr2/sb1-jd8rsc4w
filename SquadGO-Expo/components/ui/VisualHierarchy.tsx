import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { MicroInteraction } from './MicroInteractions';

const { width: screenWidth } = Dimensions.get('window');

// Componente de encabezado con gradiente y efectos
interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'primary' | 'secondary' | 'gaming' | 'neon' | 'aurora';
  height?: number;
  showParticles?: boolean;
  children?: React.ReactNode;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  variant = 'primary',
  height = 200,
  showParticles = false,
  children,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return theme.gradients.primary;
      case 'secondary':
        return theme.gradients.secondary;
      case 'gaming':
        return theme.gradients.gaming;
      case 'neon':
        return theme.gradients.neon;
      case 'aurora':
        return theme.gradients.aurora;
      default:
        return theme.gradients.primary;
    }
  };

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay con patrón */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            opacity: 0.8,
          },
        ]}
      />

      {/* Partículas flotantes */}
      {showParticles && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {Array.from({ length: 15 }, (_, i) => {
            const animValue = useRef(new Animated.Value(0)).current;
            
            useEffect(() => {
              const animate = () => {
                animValue.setValue(0);
                Animated.timing(animValue, {
                  toValue: 1,
                  duration: 3000 + Math.random() * 2000,
                  useNativeDriver: true,
                }).start(() => animate());
              };
              setTimeout(animate, Math.random() * 2000);
            }, []);

            const translateY = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [height + 20, -20],
            });

            const opacity = animValue.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 1, 1, 0],
            });

            return (
              <Animated.View
                key={i}
                style={[
                  {
                    position: 'absolute',
                    left: Math.random() * screenWidth,
                    width: 3 + Math.random() * 3,
                    height: 3 + Math.random() * 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 3,
                    transform: [{ translateY }],
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Contenido */}
      <Animated.View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text
          style={[
            {
              fontSize: 32,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: 8,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            },
          ]}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text
            style={[
              {
                fontSize: 16,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                opacity: 0.9,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
        
        {children}
      </Animated.View>
    </View>
  );
};

// Componente de tarjeta con jerarquía visual
interface HierarchyCardProps {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  variant?: 'elevated' | 'glass' | 'neon' | 'gradient';
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string | number;
  onPress?: () => void;
  children?: React.ReactNode;
}

export const HierarchyCard: React.FC<HierarchyCardProps> = ({
  title,
  description,
  priority = 'medium',
  variant = 'elevated',
  icon,
  badge,
  onPress,
  children,
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'low':
        return theme.colors.accent.green;
      case 'medium':
        return theme.colors.accent.yellow;
      case 'high':
        return theme.colors.accent.orange;
      case 'critical':
        return theme.colors.accent.red;
      default:
        return theme.colors.primary[500];
    }
  };

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.card,
          ...theme.shadows.lg,
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      case 'neon':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.background.card,
          borderWidth: 2,
          borderColor: getPriorityColor(),
          shadowColor: getPriorityColor(),
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 15,
        };
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const renderBackground = () => {
    if (variant === 'glass') {
      return (
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={[
            theme.colors.background.card,
            theme.colors.background.elevated,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    
    return null;
  };

  const CardComponent = onPress ? MicroInteraction : View;
  const cardProps = onPress ? { type: 'scale' as const, onPress } : {};

  return (
    <CardComponent {...cardProps}>
      <View style={getCardStyle()}>
        {renderBackground()}
        
        {/* Indicador de prioridad */}
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              backgroundColor: getPriorityColor(),
            },
          ]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Icono */}
          {icon && (
            <View
              style={[
                {
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: getPriorityColor() + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={24}
                color={getPriorityColor()}
              />
            </View>
          )}

          {/* Contenido */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text
                style={[
                  {
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    flex: 1,
                  },
                ]}
              >
                {title}
              </Text>
              
              {/* Badge */}
              {badge && (
                <View
                  style={[
                    {
                      backgroundColor: getPriorityColor(),
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginLeft: 8,
                    },
                  ]}
                >
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                      },
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              )}
            </View>
            
            {description && (
              <Text
                style={[
                  {
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    lineHeight: 20,
                    marginBottom: children ? 12 : 0,
                  },
                ]}
              >
                {description}
              </Text>
            )}
            
            {children}
          </View>
        </View>
      </View>
    </CardComponent>
  );
};

// Componente de sección con separadores visuales
interface VisualSectionProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'gradient' | 'minimal';
  showDivider?: boolean;
  children: React.ReactNode;
}

export const VisualSection: React.FC<VisualSectionProps> = ({
  title,
  subtitle,
  variant = 'default',
  showDivider = true,
  children,
}) => {
  const renderHeader = () => {
    if (variant === 'gradient') {
      return (
        <View style={{ marginBottom: 20 }}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.secondary[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              {
                height: 3,
                borderRadius: 2,
                marginBottom: 12,
                width: 60,
              },
            ]}
          />
          <Text
            style={[
              {
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.text.primary,
                marginBottom: subtitle ? 4 : 0,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                {
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 20 }}>
        <Text
          style={[
            {
              fontSize: variant === 'minimal' ? 20 : 24,
              fontWeight: variant === 'minimal' ? '600' : 'bold',
              color: theme.colors.text.primary,
              marginBottom: subtitle ? 4 : 0,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              {
                fontSize: 14,
                color: theme.colors.text.secondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
        {showDivider && variant === 'default' && (
          <View
            style={[
              {
                height: 1,
                backgroundColor: theme.colors.border.primary,
                marginTop: 12,
              },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={{ marginVertical: 16 }}>
      {renderHeader()}
      {children}
    </View>
  );
};

// Componente de lista con jerarquía visual
interface HierarchyListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    icon?: keyof typeof Ionicons.glyphMap;
    badge?: string | number;
    onPress?: () => void;
  }>;
  variant?: 'cards' | 'list' | 'grid';
  showPriorityIndicator?: boolean;
}

export const HierarchyList: React.FC<HierarchyListProps> = ({
  items,
  variant = 'cards',
  showPriorityIndicator = true,
}) => {
  if (variant === 'grid') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
        {items.map((item, index) => (
          <View key={item.id} style={{ width: '50%', paddingHorizontal: 8 }}>
            <HierarchyCard
              title={item.title}
              description={item.subtitle}
              priority={item.priority}
              variant="elevated"
              icon={item.icon}
              badge={item.badge}
              onPress={item.onPress}
            />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'cards') {
    return (
      <View>
        {items.map((item) => (
          <HierarchyCard
            key={item.id}
            title={item.title}
            description={item.subtitle}
            priority={item.priority}
            variant="elevated"
            icon={item.icon}
            badge={item.badge}
            onPress={item.onPress}
          />
        ))}
      </View>
    );
  }

  // Lista simple
  return (
    <View>
      {items.map((item, index) => (
        <MicroInteraction
          key={item.id}
          type="scale"
          onPress={item.onPress}
        >
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
                backgroundColor: theme.colors.background.card,
                borderRadius: 12,
                marginVertical: 4,
              },
              theme.shadows.sm,
            ]}
          >
            {showPriorityIndicator && (
              <View
                style={[
                  {
                    width: 4,
                    height: 40,
                    borderRadius: 2,
                    marginRight: 16,
                    backgroundColor:
                      item.priority === 'critical'
                        ? theme.colors.accent.red
                        : item.priority === 'high'
                        ? theme.colors.accent.orange
                        : item.priority === 'medium'
                        ? theme.colors.accent.yellow
                        : theme.colors.accent.green,
                  },
                ]}
              />
            )}
            
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={24}
                color={theme.colors.text.secondary}
                style={{ marginRight: 16 }}
              />
            )}
            
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  {
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: item.subtitle ? 2 : 0,
                  },
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text
                  style={[
                    {
                      fontSize: 14,
                      color: theme.colors.text.secondary,
                    },
                  ]}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>
            
            {item.badge && (
              <View
                style={[
                  {
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginLeft: 12,
                  },
                ]}
              >
                <Text
                  style={[
                    {
                      fontSize: 12,
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                    },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
            )}
          </View>
        </MicroInteraction>
      ))}
    </View>
  );
};

export default {
  GradientHeader,
  HierarchyCard,
  VisualSection,
  HierarchyList,
};