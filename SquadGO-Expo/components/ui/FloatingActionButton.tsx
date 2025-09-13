import React, { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface FloatingAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  mainIcon?: keyof typeof Ionicons.glyphMap;
  variant?: 'gradient' | 'glass' | 'neon' | 'holographic';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onMainPress?: () => void;
  draggable?: boolean;
  pulseAnimation?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = memo(({
  actions = [],
  mainIcon = 'add',
  variant = 'gradient',
  size = 'md',
  position = 'bottom-right',
  onMainPress,
  draggable = false,
  pulseAnimation = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  const rotationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const expandValue = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulseAnimation) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [pulseAnimation]);

  useEffect(() => {
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
  }, []);

  const getSizeConfig = () => {
    const configs = {
      sm: { size: 48, iconSize: 20 },
      md: { size: 56, iconSize: 24 },
      lg: { size: 64, iconSize: 28 },
    };
    return configs[size];
  };

  const getPositionStyle = () => {
    const offset = 20;
    const positions = {
      'bottom-right': { bottom: offset, right: offset },
      'bottom-left': { bottom: offset, left: offset },
      'top-right': { top: offset, right: offset },
      'top-left': { top: offset, left: offset },
    };
    return positions[position];
  };

  const getVariantConfig = () => {
    const configs = {
      gradient: {
        colors: [theme.colors.primary[400], theme.colors.primary[600]],
        shadowColor: theme.colors.primary[400],
        glowColor: theme.colors.primary[400],
      },
      glass: {
        colors: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'],
        shadowColor: 'rgba(255, 255, 255, 0.3)',
        glowColor: 'rgba(255, 255, 255, 0.5)',
      },
      neon: {
        colors: [theme.colors.accent.cyan, theme.colors.accent.purple],
        shadowColor: theme.colors.accent.cyan,
        glowColor: theme.colors.accent.cyan,
      },
      holographic: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        shadowColor: '#FF6B6B',
        glowColor: '#4ECDC4',
      },
    };
    return configs[variant];
  };

  const sizeConfig = getSizeConfig();
  const variantConfig = getVariantConfig();
  const positionStyle = getPositionStyle();

  const handleMainPress = () => {
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
      
      Animated.parallel([
        Animated.spring(rotationValue, {
          toValue: isExpanded ? 0 : 1,
          useNativeDriver: true,
        }),
        Animated.spring(expandValue, {
          toValue: isExpanded ? 0 : 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (onMainPress) {
      onMainPress();
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX, translationY: dragY } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      setDragPosition({
        x: dragPosition.x + event.nativeEvent.translationX,
        y: dragPosition.y + event.nativeEvent.translationY,
      });
      
      Animated.parallel([
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: false,
        }),
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const MainButton = () => (
    <Animated.View
      style={[
        {
          width: sizeConfig.size,
          height: sizeConfig.size,
          borderRadius: sizeConfig.size / 2,
          transform: [
            { scale: Animated.multiply(scaleValue, pulseValue) },
            { rotate: rotation },
          ],
        },
      ]}
    >
      {/* Glow Effect */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: (sizeConfig.size + 20) / 2,
          backgroundColor: variantConfig.glowColor,
          opacity: glowOpacity,
        }}
      />

      {variant === 'glass' ? (
        <BlurView
          intensity={20}
          tint="dark"
          style={{
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Ionicons
            name={mainIcon}
            size={sizeConfig.iconSize}
            color="white"
          />
        </BlurView>
      ) : (
        <LinearGradient
          colors={variantConfig.colors}
          style={{
            width: sizeConfig.size,
            height: sizeConfig.size,
            borderRadius: sizeConfig.size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: variantConfig.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons
            name={mainIcon}
            size={sizeConfig.iconSize}
            color="white"
          />
        </LinearGradient>
      )}
    </Animated.View>
  );

  const ActionButton = ({ action, index }: { action: FloatingAction; index: number }) => {
    const actionScale = expandValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const actionTranslateY = expandValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(sizeConfig.size + 10) * (index + 1)],
    });

    return (
      <Animated.View
        key={index}
        style={{
          position: 'absolute',
          transform: [
            { scale: actionScale },
            { translateY: actionTranslateY },
          ],
        }}
      >
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            setIsExpanded(false);
            Animated.parallel([
              Animated.spring(rotationValue, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.spring(expandValue, {
                toValue: 0,
                useNativeDriver: true,
              }),
            ]).start();
          }}
          style={{
            width: sizeConfig.size * 0.8,
            height: sizeConfig.size * 0.8,
            borderRadius: (sizeConfig.size * 0.8) / 2,
            backgroundColor: action.color || theme.colors.background.elevated,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons
            name={action.icon}
            size={sizeConfig.iconSize * 0.8}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ButtonContainer = draggable ? PanGestureHandler : View;
  const containerProps = draggable
    ? {
        onGestureEvent,
        onHandlerStateChange,
      }
    : {};

  return (
    <ButtonContainer {...containerProps}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { translateX: Animated.add(dragX, dragPosition.x) },
              { translateY: Animated.add(dragY, dragPosition.y) },
            ],
          },
          positionStyle,
        ]}
      >
        {/* Action Buttons */}
        {actions.map((action, index) => (
          <ActionButton key={index} action={action} index={index} />
        ))}

        {/* Main Button */}
        <TouchableOpacity
          onPress={handleMainPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <MainButton />
        </TouchableOpacity>
      </Animated.View>
    </ButtonContainer>
  );
});

export default FloatingActionButton;