import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'scale' | 'bounce' | 'pulse' | 'shake' | 'glow' | 'ripple' | 'float';
  intensity?: 'light' | 'medium' | 'strong';
  duration?: number;
  delay?: number;
  autoPlay?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = 'scale',
  intensity = 'medium',
  duration = 300,
  delay = 0,
  autoPlay = false,
  onPress,
  disabled = false,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  const intensityConfig = {
    light: { scale: 0.98, bounce: 1.05, pulse: 0.95, shake: 2, glow: 0.3 },
    medium: { scale: 0.95, bounce: 1.1, pulse: 0.9, shake: 4, glow: 0.6 },
    strong: { scale: 0.9, bounce: 1.15, pulse: 0.85, shake: 6, glow: 1.0 },
  };

  const config = intensityConfig[intensity];

  useEffect(() => {
    if (autoPlay) {
      setTimeout(() => {
        startAnimation();
      }, delay);
    }
  }, [autoPlay, delay]);

  const startAnimation = () => {
    if (disabled) return;

    switch (type) {
      case 'scale':
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: config.scale,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'bounce':
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: config.bounce,
            duration: duration / 3,
            easing: Easing.out(Easing.back(1.7)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: (duration * 2) / 3,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'pulse':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: config.pulse,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start();
        break;

      case 'shake':
        Animated.sequence([
          Animated.timing(rotateValue, {
            toValue: config.shake,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: -config.shake,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: config.shake,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: -config.shake,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: 0,
            duration: duration / 8,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'glow':
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowValue, {
              toValue: config.glow,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowValue, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
          { iterations: 3 }
        ).start();
        break;

      case 'float':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -10,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ).start();
        break;

      case 'ripple':
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  const handlePress = () => {
    startAnimation();
    if (onPress) {
      setTimeout(onPress, duration / 2);
    }
  };

  const getAnimatedStyle = () => {
    const baseStyle = {
      transform: [
        { scale: scaleValue },
        {
          rotate: rotateValue.interpolate({
            inputRange: [-10, 10],
            outputRange: ['-10deg', '10deg'],
          }),
        },
        { translateY },
      ],
    };

    if (type === 'glow') {
      return {
        ...baseStyle,
        shadowOpacity: glowValue,
        shadowRadius: glowValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
        shadowColor: theme.colors.primary[500],
        elevation: glowValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      };
    }

    return baseStyle;
  };

  const renderRipple = () => {
    if (type !== 'ripple') return null;

    const rippleScale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    });

    const rippleOpacity = animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.4, 0],
    });

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme.colors.primary[500],
            borderRadius: 1000,
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          },
        ]}
      />
    );
  };

  const renderContent = () => (
    <Animated.View style={[getAnimatedStyle(), style]}>
      {renderRipple()}
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
        {renderContent()}
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View>
      {renderContent()}
    </View>
  );
};

// Componente de partículas flotantes
interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  size?: number;
  speed?: number;
  style?: any;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  colors = [theme.colors.primary[500], theme.colors.secondary[500], theme.colors.accent.cyan],
  size = 4,
  speed = 2000,
  style,
}) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      animatedValue: new Animated.Value(0),
      x: Math.random() * screenWidth,
      delay: Math.random() * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: size + Math.random() * size,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle) => {
      const animate = () => {
        particle.animatedValue.setValue(0);
        Animated.timing(particle.animatedValue, {
          toValue: 1,
          duration: speed + Math.random() * speed,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          animate();
        });
      };

      setTimeout(animate, particle.delay);
    });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      {particles.map((particle) => {
        const translateY = particle.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [600, -100],
        });

        const opacity = particle.animatedValue.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              {
                position: 'absolute',
                left: particle.x,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Hook para animaciones de entrada
export const useEntranceAnimation = (delay: number = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, [delay]);

  return {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  };
};

// Componente de loading con micro-animaciones
interface AnimatedLoadingProps {
  type?: 'dots' | 'pulse' | 'wave' | 'spinner';
  color?: string;
  size?: number;
}

export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  type = 'dots',
  color = theme.colors.primary[500],
  size = 8,
}) => {
  const animValues = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel(
      animValues.map((animValue, index) =>
        createAnimation(animValue, index * 200)
      )
    ).start();
  }, []);

  if (type === 'dots') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {animValues.map((animValue, index) => {
          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.2],
          });

          const opacity = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: color,
                  marginHorizontal: 2,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  return null;
};

export default MicroInteraction;