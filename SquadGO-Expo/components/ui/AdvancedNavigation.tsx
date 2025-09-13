import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { MicroInteraction } from './MicroInteractions';

interface NavigationItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  color?: string;
}

interface AdvancedNavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemPress: (itemId: string) => void;
  variant?: 'bottom' | 'top' | 'floating' | 'sidebar';
  style?: 'glass' | 'gradient' | 'neon' | 'minimal';
  showLabels?: boolean;
  animated?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AdvancedNavigation: React.FC<AdvancedNavigationProps> = ({
  items,
  activeItem,
  onItemPress,
  variant = 'bottom',
  style = 'glass',
  showLabels = true,
  animated = true,
}) => {
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: screenHeight });
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const activeIndex = items.findIndex(item => item.id === activeItem);

  useEffect(() => {
    if (animated) {
      // Animación del indicador
      Animated.spring(indicatorAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Efecto de glow para el estilo neon
      if (style === 'neon') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    }
  }, [activeIndex, animated, style]);

  const getContainerStyle = () => {
    const baseStyle = {
      flexDirection: variant === 'sidebar' ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: variant === 'sidebar' ? 'flex-start' : 'space-around',
      paddingHorizontal: variant === 'sidebar' ? 0 : 16,
      paddingVertical: variant === 'sidebar' ? 20 : 12,
    };

    switch (variant) {
      case 'bottom':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        };
      case 'top':
        return {
          ...baseStyle,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: Platform.OS === 'ios' ? 44 : 12,
        };
      case 'floating':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          borderRadius: 25,
          marginHorizontal: 20,
        };
      case 'sidebar':
        return {
          ...baseStyle,
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
        };
      default:
        return baseStyle;
    }
  };

  const getBackgroundComponent = () => {
    switch (style) {
      case 'glass':
        return (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        );
      case 'gradient':
        return (
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        );
      case 'neon':
        return (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: theme.colors.background.card,
                shadowColor: theme.colors.accent.cyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                shadowRadius: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 20],
                }),
                elevation: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 20],
                }),
              },
            ]}
          />
        );
      case 'minimal':
        return (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: theme.colors.background.card,
                opacity: 0.95,
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  const renderIndicator = () => {
    if (!animated || variant === 'sidebar') return null;

    const itemWidth = (screenWidth - 32) / items.length;
    const translateX = indicatorAnim.interpolate({
      inputRange: [0, items.length - 1],
      outputRange: [0, itemWidth * (items.length - 1)],
    });

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: variant === 'bottom' ? -2 : undefined,
            bottom: variant === 'top' ? -2 : undefined,
            left: 16,
            width: itemWidth,
            height: 3,
            backgroundColor: theme.colors.primary[500],
            borderRadius: 2,
            transform: [{ translateX }],
          },
          style === 'neon' && {
            shadowColor: theme.colors.primary[500],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          },
        ]}
      />
    );
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => {
    const isActive = item.id === activeItem;
    const itemColor = isActive
      ? item.color || theme.colors.primary[500]
      : theme.colors.text.tertiary;

    return (
      <MicroInteraction
        key={item.id}
        type="scale"
        intensity="light"
        onPress={() => onItemPress(item.id)}
        style={[
          {
            flex: variant === 'sidebar' ? 0 : 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: variant === 'sidebar' ? 16 : 8,
            paddingHorizontal: variant === 'sidebar' ? 0 : 4,
            marginVertical: variant === 'sidebar' ? 4 : 0,
          },
          variant === 'sidebar' && isActive && {
            backgroundColor: theme.colors.primary[500] + '20',
            borderRadius: 12,
            marginHorizontal: 8,
          },
        ]}
      >
        <View style={{ alignItems: 'center', position: 'relative' }}>
          {/* Icono con efecto de glow si está activo */}
          <Animated.View
            style={[
              {
                padding: 8,
                borderRadius: 12,
              },
              isActive && style === 'neon' && {
                shadowColor: itemColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 15,
                elevation: 15,
              },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={variant === 'sidebar' ? 28 : 24}
              color={itemColor}
            />
          </Animated.View>

          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: theme.colors.accent.red,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                },
                theme.shadows.sm,
              ]}
            >
              <Text
                style={[
                  {
                    color: theme.colors.text.primary,
                    fontSize: 10,
                    fontWeight: 'bold',
                  },
                ]}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Text>
            </View>
          )}

          {/* Label */}
          {showLabels && (
            <Text
              style={[
                {
                  fontSize: variant === 'sidebar' ? 10 : 11,
                  color: itemColor,
                  marginTop: 4,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {item.label}
            </Text>
          )}

          {/* Indicador para sidebar */}
          {variant === 'sidebar' && isActive && (
            <View
              style={[
                {
                  position: 'absolute',
                  left: -8,
                  top: '50%',
                  width: 4,
                  height: 24,
                  backgroundColor: theme.colors.primary[500],
                  borderRadius: 2,
                  transform: [{ translateY: -12 }],
                },
                style === 'neon' && {
                  shadowColor: theme.colors.primary[500],
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                },
              ]}
            />
          )}
        </View>
      </MicroInteraction>
    );
  };

  return (
    <View
      style={[
        getContainerStyle(),
        {
          borderWidth: style === 'minimal' ? 1 : 0,
          borderColor: theme.colors.border.primary,
          borderRadius: variant === 'floating' ? 25 : variant === 'sidebar' ? 0 : 0,
          overflow: 'hidden',
        },
        theme.shadows[variant === 'floating' ? 'lg' : 'sm'],
      ]}
    >
      {getBackgroundComponent()}
      {renderIndicator()}
      {items.map(renderNavigationItem)}
    </View>
  );
};

// Componente de navegación con tabs deslizantes
interface SlidingTabsProps {
  tabs: { id: string; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'background';
  scrollable?: boolean;
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
  variant = 'pills',
  scrollable = false,
}) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  useEffect(() => {
    if (activeIndex >= 0 && tabLayouts[activeTab]) {
      Animated.spring(indicatorAnim, {
        toValue: tabLayouts[activeTab].x,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [activeTab, tabLayouts]);

  const handleTabLayout = (tabId: string, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({ ...prev, [tabId]: { x, width } }));
  };

  const renderIndicator = () => {
    if (variant === 'background' || !tabLayouts[activeTab]) return null;

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            height: variant === 'underline' ? 3 : '100%',
            width: tabLayouts[activeTab]?.width || 0,
            backgroundColor: theme.colors.primary[500],
            borderRadius: variant === 'pills' ? 20 : 0,
            bottom: variant === 'underline' ? 0 : undefined,
            transform: [{ translateX: indicatorAnim }],
          },
          variant === 'pills' && theme.shadows.sm,
        ]}
      />
    );
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: variant === 'background' ? theme.colors.background.secondary : 'transparent',
          borderRadius: variant === 'pills' ? 25 : 0,
          padding: variant === 'pills' ? 4 : 0,
          position: 'relative',
        },
        variant === 'background' && theme.shadows.sm,
      ]}
    >
      {renderIndicator()}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        return (
          <MicroInteraction
            key={tab.id}
            type="scale"
            intensity="light"
            onPress={() => onTabPress(tab.id)}
          >
            <View
              style={[
                {
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                variant === 'background' && isActive && {
                  backgroundColor: theme.colors.primary[500],
                },
              ]}
              onLayout={(event) => handleTabLayout(tab.id, event)}
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={
                    isActive
                      ? variant === 'background'
                        ? theme.colors.text.primary
                        : theme.colors.primary[500]
                      : theme.colors.text.tertiary
                  }
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={[
                  {
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive
                      ? variant === 'background'
                        ? theme.colors.text.primary
                        : theme.colors.primary[500]
                      : theme.colors.text.tertiary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </MicroInteraction>
        );
      })}
    </View>
  );
};

export default AdvancedNavigation;