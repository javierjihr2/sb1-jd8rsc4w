import React, { useEffect, useRef } from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface GlassmorphismCardProps {
  children: React.ReactNode;
  variant?: 'ultra' | 'premium' | 'neon' | 'holographic' | 'aurora';
  onPress?: () => void;
  style?: ViewStyle;
  intensity?: number;
  animated?: boolean;
  glowIntensity?: number;
  borderGradient?: boolean;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  variant = 'ultra',
  onPress,
  style,
  intensity = 30,
  animated = true,
  glowIntensity = 0.3,
  borderGradient = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantConfig = () => {
    const configs = {
      ultra: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: theme.colors.primary[400],
        gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
        borderGradientColors: [theme.colors.primary[400], theme.colors.accent.purple, theme.colors.primary[600]],
      },
      premium: {
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderColor: 'rgba(255, 215, 0, 0.3)',
        shadowColor: '#FFD700',
        gradientColors: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 165, 0, 0.05)'],
        borderGradientColors: ['#FFD700', '#FFA500', '#FF8C00'],
      },
      neon: {
        backgroundColor: 'rgba(0, 255, 255, 0.05)',
        borderColor: 'rgba(0, 255, 255, 0.3)',
        shadowColor: '#00FFFF',
        gradientColors: ['rgba(0, 255, 255, 0.1)', 'rgba(255, 0, 255, 0.05)'],
        borderGradientColors: ['#00FFFF', '#FF00FF', '#00FF00'],
      },
      holographic: {
        backgroundColor: 'rgba(138, 43, 226, 0.08)',
        borderColor: 'rgba(138, 43, 226, 0.2)',
        shadowColor: '#8A2BE2',
        gradientColors: ['rgba(138, 43, 226, 0.1)', 'rgba(75, 0, 130, 0.05)'],
        borderGradientColors: ['#8A2BE2', '#4B0082', '#9400D3'],
      },
      aurora: {
        backgroundColor: 'rgba(0, 255, 127, 0.06)',
        borderColor: 'rgba(0, 255, 127, 0.2)',
        shadowColor: '#00FF7F',
        gradientColors: ['rgba(0, 255, 127, 0.1)', 'rgba(72, 209, 204, 0.05)'],
        borderGradientColors: ['#00FF7F', '#48D1CC', '#20B2AA'],
      },
    };
    return configs[variant];
  };

  const config = getVariantConfig();

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: config.gradientColors,
  });

  const animatedShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [glowIntensity, glowIntensity * 1.5],
  });

  const renderCardContent = () => (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={{
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Gradient */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: animatedBackgroundColor,
        }}
      />

      {/* Content Container */}
      <View
        style={{
          padding: theme.spacing.lg,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </View>

      {/* Floating Particles Effect */}
      {animated && (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              top: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['10%', '80%'],
              }),
              left: '20%',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: config.shadowColor,
              opacity: 0.6,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['80%', '10%'],
              }),
              right: '25%',
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: config.shadowColor,
              opacity: 0.4,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['30%', '70%'],
              }),
              left: '70%',
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: config.shadowColor,
              opacity: 0.5,
            }}
          />
        </>
      )}
    </BlurView>
  );

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
        },
        style,
      ]}
    >
      {/* Glow Effect Background */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: theme.borderRadius['2xl'],
          backgroundColor: config.shadowColor,
          opacity: animatedShadowOpacity,
          shadowColor: config.shadowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 20,
        }}
      />

      {/* Border Gradient */}
      {borderGradient && (
        <LinearGradient
          colors={config.borderGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.xl,
            padding: 2,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: theme.borderRadius.xl - 2,
              backgroundColor: 'transparent',
            }}
          />
        </LinearGradient>
      )}

      {/* Main Card */}
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={{
            borderRadius: theme.borderRadius.xl,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {renderCardContent()}
        </TouchableOpacity>
      ) : (
        <View
          style={{
            borderRadius: theme.borderRadius.xl,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {renderCardContent()}
        </View>
      )}
    </Animated.View>
  );
};

export default GlassmorphismCard;