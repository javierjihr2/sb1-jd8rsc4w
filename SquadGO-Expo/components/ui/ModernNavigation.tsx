import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface NavigationItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  color?: string;
}

interface ModernNavigationProps {
  items: NavigationItem[];
  activeIndex: number;
  onItemPress: (index: number, item: NavigationItem) => void;
  variant?: 'floating' | 'glass' | 'neon' | 'minimal';
  position?: 'bottom' | 'top';
  showLabels?: boolean;
}

export const ModernNavigation: React.FC<ModernNavigationProps> = ({
  items,
  activeIndex,
  onItemPress,
  variant = 'floating',
  position = 'bottom',
  showLabels = true,
}) => {
  const animatedValue = useRef(new Animated.Value(activeIndex)).current;
  const scaleValues = useRef(items.map(() => new Animated.Value(1))).current;
  const glowValue = useRef(new Animated.Value(0)).current;
  const [dimensions, setDimensions] = useState({ width: screenWidth, height: 0 });

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: activeIndex,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [activeIndex]);

  const handleItemPress = (index: number, item: NavigationItem) => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleValues[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onItemPress(index, item);
  };

  const getVariantStyles = () => {
    const itemWidth = dimensions.width / items.length;
    
    const configs = {
      floating: {
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: theme.borderRadius['2xl'],
          marginHorizontal: theme.spacing.lg,
          marginBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        },
        indicator: {
          backgroundColor: theme.colors.primary[400],
          borderRadius: theme.borderRadius.xl,
        },
      },
      glass: {
        container: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: theme.borderRadius['2xl'],
          marginHorizontal: theme.spacing.lg,
          marginBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        indicator: {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: theme.borderRadius.xl,
        },
      },
      neon: {
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: theme.borderRadius['2xl'],
          marginHorizontal: theme.spacing.lg,
          marginBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
          borderWidth: 2,
          borderColor: theme.colors.accent.cyan,
          shadowColor: theme.colors.accent.cyan,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
          elevation: 15,
        },
        indicator: {
          backgroundColor: theme.colors.accent.cyan,
          borderRadius: theme.borderRadius.xl,
          shadowColor: theme.colors.accent.cyan,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 10,
          elevation: 10,
        },
      },
      minimal: {
        container: {
          backgroundColor: theme.colors.background.elevated,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.primary,
        },
        indicator: {
          backgroundColor: theme.colors.primary[400],
          borderRadius: theme.borderRadius.sm,
        },
      },
    };

    return configs[variant];
  };

  const styles = getVariantStyles();
  const itemWidth = dimensions.width / items.length;

  const indicatorTranslateX = animatedValue.interpolate({
    inputRange: items.map((_, index) => index),
    outputRange: items.map((_, index) => index * itemWidth + itemWidth * 0.2),
    extrapolate: 'clamp',
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const NavigationContainer = variant === 'glass' ? BlurView : View;
  const containerProps = variant === 'glass' 
    ? { intensity: 20, tint: 'dark' as const }
    : {};

  return (
    <View
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setDimensions({ width, height: 0 });
      }}
    >
      {/* Glow Effect for Neon variant */}
      {variant === 'neon' && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -5,
            left: theme.spacing.lg - 5,
            right: theme.spacing.lg - 5,
            bottom: -5,
            borderRadius: theme.borderRadius['2xl'] + 5,
            backgroundColor: theme.colors.accent.cyan,
            opacity: glowOpacity,
          }}
        />
      )}

      <NavigationContainer
        {...containerProps}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.md,
            position: 'relative',
          },
          styles.container,
        ]}
      >
        {/* Active Indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: itemWidth * 0.6,
              height: showLabels ? 50 : 40,
              transform: [{ translateX: indicatorTranslateX }],
            },
            styles.indicator,
          ]}
        />

        {/* Navigation Items */}
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          
          return (
            <Animated.View
              key={item.id}
              style={{
                flex: 1,
                alignItems: 'center',
                transform: [{ scale: scaleValues[index] }],
              }}
            >
              <TouchableOpacity
                onPress={() => handleItemPress(index, item)}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: theme.spacing.sm,
                  position: 'relative',
                }}
                activeOpacity={0.7}
              >
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -8,
                      backgroundColor: theme.colors.accent.red,
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}

                {/* Icon */}
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={
                    isActive
                      ? variant === 'neon'
                        ? '#000'
                        : '#fff'
                      : item.color || theme.colors.text.secondary
                  }
                />

                {/* Label */}
                {showLabels && (
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive
                        ? variant === 'neon'
                          ? '#000'
                          : '#fff'
                        : theme.colors.text.secondary,
                      marginTop: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </NavigationContainer>
    </View>
  );
};

export default ModernNavigation;