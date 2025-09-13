import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { MicroInteraction } from './MicroInteractions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Componente de FAB principal con menú expandible
interface FloatingActionMenuProps {
  mainIcon?: keyof typeof Ionicons.glyphMap;
  actions: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
  variant?: 'primary' | 'secondary' | 'neon' | 'glass';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  mainIcon = 'add',
  actions,
  variant = 'primary',
  position = 'bottom-right',
  size = 'medium',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const actionAnims = useRef(actions.map(() => new Animated.Value(0))).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { size: 48, iconSize: 20 };
      case 'large':
        return { size: 72, iconSize: 32 };
      default:
        return { size: 56, iconSize: 24 };
    }
  };

  const { size: fabSize, iconSize } = getSizeConfig();

  const getPositionStyle = () => {
    const offset = 20;
    switch (position) {
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'top-right':
        return { top: offset + 50, right: offset };
      case 'top-left':
        return { top: offset + 50, left: offset };
      default:
        return { bottom: offset, right: offset };
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary[500],
          shadowColor: theme.colors.secondary[500],
        };
      case 'neon':
        return {
          backgroundColor: theme.colors.background.card,
          borderWidth: 2,
          borderColor: theme.colors.accent.neon,
          shadowColor: theme.colors.accent.neon,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          shadowColor: theme.colors.primary[500],
        };
    }
  };

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    // Animación de rotación del icono principal
    Animated.timing(rotateAnim, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();

    // Animación de escala del FAB principal
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de las acciones
    if (isExpanded) {
      // Cerrar: animar hacia adentro
      Animated.stagger(
        50,
        actionAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        ).reverse()
      ).start();
    } else {
      // Abrir: animar hacia afuera
      Animated.stagger(
        100,
        actionAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

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
    return null;
  };

  return (
    <View style={[{ position: 'absolute', zIndex: 1000 }, getPositionStyle()]}>
      {/* Acciones del menú */}
      {actions.map((action, index) => {
        const translateY = actionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(fabSize + 16) * (index + 1)],
        });

        const opacity = actionAnims[index].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        const scale = actionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              {
                position: 'absolute',
                bottom: 0,
                right: 0,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <MicroInteraction type="scale" onPress={action.onPress}>
              <View
                style={[
                  {
                    width: fabSize - 8,
                    height: fabSize - 8,
                    borderRadius: (fabSize - 8) / 2,
                    backgroundColor: action.color || theme.colors.background.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                  theme.shadows.md,
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={iconSize - 4}
                  color={theme.colors.text.primary}
                />
              </View>
            </MicroInteraction>
            
            {/* Label */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  right: fabSize,
                  top: '50%',
                  backgroundColor: theme.colors.background.card,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                  opacity,
                },
                theme.shadows.sm,
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    textAlign: 'center',
                  },
                ]}
              >
                {action.label}
              </Text>
            </Animated.View>
          </Animated.View>
        );
      })}

      {/* FAB Principal */}
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MicroInteraction type="scale" onPress={toggleMenu}>
          <View
            style={[
              {
                width: fabSize,
                height: fabSize,
                borderRadius: fabSize / 2,
                alignItems: 'center',
                justifyContent: 'center',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 16,
                overflow: 'hidden',
              },
              getVariantStyle(),
            ]}
          >
            {renderBackground()}
            <Animated.View
              style={[
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <Ionicons
                name={mainIcon}
                size={iconSize}
                color={variant === 'glass' ? theme.colors.text.primary : '#FFFFFF'}
              />
            </Animated.View>
          </View>
        </MicroInteraction>
      </Animated.View>
    </View>
  );
};

// Componente de notificación flotante
interface FloatingNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  showIcon?: boolean;
}

export const FloatingNotification: React.FC<FloatingNotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'top',
  showIcon = true,
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.accent.green,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.accent.red,
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.accent.orange,
          icon: 'warning' as keyof typeof Ionicons.glyphMap,
        };
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const { backgroundColor, icon } = getTypeConfig();

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: position === 'top' ? 60 : undefined,
          bottom: position === 'bottom' ? 60 : undefined,
          left: 20,
          right: 20,
          zIndex: 1000,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <BlurView intensity={20} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: backgroundColor,
            },
            theme.shadows.lg,
          ]}
        >
          {showIcon && (
            <Ionicons
              name={icon}
              size={24}
              color={backgroundColor}
              style={{ marginRight: 12 }}
            />
          )}
          
          <Text
            style={[
              {
                flex: 1,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text.primary,
                lineHeight: 20,
              },
            ]}
          >
            {message}
          </Text>
          
          <TouchableOpacity onPress={dismiss} style={{ marginLeft: 12 }}>
            <Ionicons
              name="close"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};

// Componente de tooltip flotante
interface FloatingTooltipProps {
  text: string;
  visible: boolean;
  targetRef: React.RefObject<View>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'dark' | 'light' | 'glass';
}

export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  text,
  visible,
  targetRef,
  position = 'top',
  variant = 'dark',
}) => {
  const [tooltipLayout, setTooltipLayout] = useState({ width: 0, height: 0 });
  const [targetLayout, setTargetLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Medir la posición del target
      targetRef.current?.measureInWindow((x, y, width, height) => {
        setTargetLayout({ x, y, width, height });
      });

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTooltipPosition = () => {
    const offset = 8;
    const arrowSize = 6;
    
    switch (position) {
      case 'bottom':
        return {
          top: targetLayout.y + targetLayout.height + offset,
          left: targetLayout.x + targetLayout.width / 2 - tooltipLayout.width / 2,
        };
      case 'left':
        return {
          top: targetLayout.y + targetLayout.height / 2 - tooltipLayout.height / 2,
          left: targetLayout.x - tooltipLayout.width - offset,
        };
      case 'right':
        return {
          top: targetLayout.y + targetLayout.height / 2 - tooltipLayout.height / 2,
          left: targetLayout.x + targetLayout.width + offset,
        };
      default: // top
        return {
          top: targetLayout.y - tooltipLayout.height - offset,
          left: targetLayout.x + targetLayout.width / 2 - tooltipLayout.width / 2,
        };
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'light':
        return {
          backgroundColor: theme.colors.background.card,
          borderWidth: 1,
          borderColor: theme.colors.border.primary,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      default:
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        };
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          zIndex: 1000,
          opacity,
          transform: [{ scale }],
        },
        getTooltipPosition(),
      ]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setTooltipLayout({ width, height });
      }}
    >
      <View
        style={[
          {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            maxWidth: 200,
          },
          getVariantStyle(),
          theme.shadows.md,
        ]}
      >
        {variant === 'glass' && (
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <Text
          style={[
            {
              fontSize: 12,
              fontWeight: '500',
              color: variant === 'light' ? theme.colors.text.primary : '#FFFFFF',
              textAlign: 'center',
              lineHeight: 16,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
};

// Componente de badge flotante
interface FloatingBadgeProps {
  count: number;
  maxCount?: number;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  offset?: { x: number; y: number };
  showZero?: boolean;
  animated?: boolean;
}

export const FloatingBadge: React.FC<FloatingBadgeProps> = ({
  count,
  maxCount = 99,
  variant = 'primary',
  size = 'medium',
  position = 'top-right',
  offset = { x: 0, y: 0 },
  showZero = false,
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count > 0 || showZero) {
      if (animated) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();

        // Animación de pulso para nuevas notificaciones
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        scaleAnim.setValue(1);
      }
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [count, showZero, animated]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { size: 16, fontSize: 10 };
      case 'large':
        return { size: 28, fontSize: 14 };
      default:
        return { size: 20, fontSize: 12 };
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary[500];
      case 'danger':
        return theme.colors.accent.red;
      case 'success':
        return theme.colors.accent.green;
      default:
        return theme.colors.primary[500];
    }
  };

  const getPositionStyle = () => {
    const { size: badgeSize } = getSizeConfig();
    const halfSize = badgeSize / 2;
    
    switch (position) {
      case 'top-left':
        return {
          top: -halfSize + offset.y,
          left: -halfSize + offset.x,
        };
      case 'bottom-right':
        return {
          bottom: -halfSize + offset.y,
          right: -halfSize + offset.x,
        };
      case 'bottom-left':
        return {
          bottom: -halfSize + offset.y,
          left: -halfSize + offset.x,
        };
      default: // top-right
        return {
          top: -halfSize + offset.y,
          right: -halfSize + offset.x,
        };
    }
  };

  const { size: badgeSize, fontSize } = getSizeConfig();
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  if (count === 0 && !showZero) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          backgroundColor: getVariantColor(),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: theme.colors.background.primary,
          zIndex: 1,
          transform: [
            { scale: scaleAnim },
            { scale: animated ? pulseAnim : 1 },
          ],
        },
        getPositionStyle(),
        theme.shadows.sm,
      ]}
    >
      <Text
        style={[
          {
            fontSize,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
          },
        ]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
};

export default {
  FloatingActionMenu,
  FloatingNotification,
  FloatingTooltip,
  FloatingBadge,
};