import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
  transparent?: boolean;
  color?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  size = 'large',
  overlay = false,
  transparent = false,
  color = '#00D4FF',
  style
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    transparent && styles.transparent,
    style
  ];

  if (overlay) {
    return (
      <View style={containerStyle}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size={size} color={color} />
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

// Componente de loading con gradiente para pantallas principales
export const GradientLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  size = 'large'
}) => {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradientContainer}
    >
      <View style={styles.gradientContent}>
        <ActivityIndicator size={size} color="#00D4FF" />
        <Text style={styles.gradientMessage}>{message}</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </LinearGradient>
  );
};

// Componente de skeleton loading para listas
export const SkeletonLoader: React.FC<{
  count?: number;
  height?: number;
  style?: ViewStyle;
}> = ({ count = 3, height = 60, style }) => {
  return (
    <View style={[styles.skeletonContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.skeletonItem, { height }]}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Hook para estados de carga
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setLoadingError = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  loadingCard: {
    backgroundColor: '#1a1a2e',
    padding: theme.spacing['3xl'],
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContent: {
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  gradientMessage: {
    marginTop: theme.spacing.xl,
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4FF',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  skeletonContainer: {
    padding: theme.spacing.lg,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: theme.spacing.lg,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a4e',
    marginRight: theme.spacing.lg,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#3a3a4e',
    borderRadius: 6,
    marginBottom: theme.spacing.sm,
  },
  skeletonLineShort: {
    width: '60%',
  },
});