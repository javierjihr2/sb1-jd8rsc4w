import * as React from 'react';
import { memo, useMemo } from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient' | 'glass' | 'neon';
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
  borderRadius?: keyof typeof theme.borderRadius;
  glowColor?: string;
}

export const ModernCard: React.FC<ModernCardProps> = memo(({
  children,
  variant = 'default',
  onPress,
  style,
  padding = 'lg',
  borderRadius = 'xl',
  glowColor = theme.colors.primary[400],
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius[borderRadius],
      padding: theme.spacing[padding],
      overflow: 'hidden',
    };

    const variantStyles = {
      default: {
        backgroundColor: theme.colors.background.card,
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
      },
      elevated: {
        backgroundColor: theme.colors.background.elevated,
        ...theme.shadows.lg,
      },
      gradient: {
        // El gradiente se aplicará como LinearGradient
      },
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      },
      neon: {
        backgroundColor: theme.colors.background.card,
        borderWidth: 2,
        borderColor: glowColor,
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 15,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const cardStyle = getCardStyle();

  if (variant === 'gradient') {
    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          style={[{ borderRadius: theme.borderRadius[borderRadius] }, style]}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#2a2a2a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                borderRadius: theme.borderRadius[borderRadius],
                padding: theme.spacing[padding],
              },
            ]}
          >
            {children}
          </LinearGradient>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={[{ borderRadius: theme.borderRadius[borderRadius] }, style]}>
          <LinearGradient
            colors={['#1a1a1a', '#2a2a2a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                borderRadius: theme.borderRadius[borderRadius],
                padding: theme.spacing[padding],
              },
            ]}
          >
            {children}
          </LinearGradient>
        </View>
      );
    }
  }

  if (variant === 'glass') {
    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          style={[{ borderRadius: theme.borderRadius[borderRadius] }, style]}
          activeOpacity={0.9}
        >
          {/* @ts-ignore */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[
              {
                borderRadius: theme.borderRadius[borderRadius],
                padding: theme.spacing[padding],
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            {children}
          </BlurView>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={[{ borderRadius: theme.borderRadius[borderRadius] }, style]}>
          {/* @ts-ignore */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[
              {
                borderRadius: theme.borderRadius[borderRadius],
                padding: theme.spacing[padding],
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            {children}
          </BlurView>
        </View>
      );
    }
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[cardStyle, style]}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  } else {
    return (
      <View style={[cardStyle, style]}>
        {children}
      </View>
    );
  }
});

// Componente especializado para posts del feed
export const FeedCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  isLiked?: boolean;
  style?: ViewStyle;
}> = ({ children, onPress, isLiked = false, style }) => {
  return (
    <ModernCard
      variant="elevated"
      onPress={onPress}
      style={StyleSheet.flatten([
        {
          marginHorizontal: theme.spacing.lg,
          marginVertical: theme.spacing.sm,
        },
        isLiked && {
          borderColor: theme.colors.accent.red,
          borderWidth: 1,
        },
        style,
      ])}
    >
      {children}
    </ModernCard>
  );
};

// Componente especializado para elementos de chat
export const ChatCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  hasUnread?: boolean;
  style?: ViewStyle;
}> = ({ children, onPress, isActive = false, hasUnread = false, style }) => {
  return (
    <ModernCard
      variant={isActive ? 'neon' : 'default'}
      onPress={onPress}
      glowColor={theme.colors.primary[400]}
      style={StyleSheet.flatten([
        {
          marginHorizontal: theme.spacing.lg,
          marginVertical: theme.spacing[1],
        },
        hasUnread && {
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.accent.green,
        },
        style,
      ])}
    >
      {children}
    </ModernCard>
  );
};

export default ModernCard;