import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Modal } from 'react-native';
import { useGlobalLoadingState } from '../hooks/useGlobalLoadingState';
import { useAuth } from '../contexts/AuthContextSimple';
import { Ionicons } from '@expo/vector-icons';

interface GlobalLoadingIndicatorProps {
  showDetails?: boolean;
  showModal?: boolean;
  minimumDisplayTime?: number;
  style?: any;
  overlayStyle?: any;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({
  showDetails = false,
  showModal = false,
  minimumDisplayTime = 500,
  style,
  overlayStyle
}) => {
  const { isLoading, operationCount, primaryOperation, getActiveOperations } = useGlobalLoadingState();
  const { loading: authLoading } = useAuth();
  
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [displayStartTime, setDisplayStartTime] = useState<Date | null>(null);

  const totalLoading = isLoading || authLoading;
  const totalOperations = operationCount + (authLoading ? 1 : 0);
  
  // Determinar la operación principal a mostrar
  const getDisplayOperation = () => {
    if (authLoading) {
      return { description: 'Verificando autenticación...', id: 'auth' };
    }
    return primaryOperation || { description: 'Cargando...', id: 'default' };
  };

  const displayOperation = getDisplayOperation();

  // Manejar la visibilidad con tiempo mínimo de display
  useEffect(() => {
    if (totalLoading && !visible) {
      setVisible(true);
      setDisplayStartTime(new Date());
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (!totalLoading && visible) {
      const hideIndicator = () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          setDisplayStartTime(null);
        });
      };

      if (displayStartTime) {
        const elapsed = Date.now() - displayStartTime.getTime();
        const remaining = minimumDisplayTime - elapsed;
        
        if (remaining > 0) {
          setTimeout(hideIndicator, remaining);
        } else {
          hideIndicator();
        }
      } else {
        hideIndicator();
      }
    }
  }, [totalLoading, visible, fadeAnim, minimumDisplayTime, displayStartTime]);

  if (!visible) {
    return null;
  }

  const LoadingContent = () => {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#3498db" style={styles.spinner} />
          
          <View style={styles.textContainer}>
            <Text style={styles.primaryText}>{displayOperation.description}</Text>
            
            {showDetails && totalOperations > 1 && (
              <Text style={styles.secondaryText}>
                {totalOperations} operaciones en curso
              </Text>
            )}
            
            {showDetails && (
              <View style={styles.operationsList}>
                {authLoading && (
                  <View style={styles.operationItem}>
                    <Ionicons name="person-outline" size={12} color="#666" />
                    <Text style={styles.operationText}>Autenticación</Text>
                  </View>
                )}
                {getActiveOperations().map((op, index) => (
                  <View key={op.id} style={styles.operationItem}>
                    <Ionicons name="time-outline" size={12} color="#666" />
                    <Text style={styles.operationText}>
                      {op.description} ({Math.round(op.duration / 1000)}s)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (showModal) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
      >
        <View style={[styles.modalOverlay, overlayStyle]}>
          <LoadingContent />
        </View>
      </Modal>
    );
  }

  return <LoadingContent />;
};

// Componente compacto para la barra de estado
export const LoadingStatusBar: React.FC<{
  style?: any;
  showOperationCount?: boolean;
}> = ({ style, showOperationCount = true }) => {
  const { isLoading, operationCount, primaryOperation } = useGlobalLoadingState();
  const { loading: authLoading } = useAuth();
  
  const totalLoading = isLoading || authLoading;
  const totalOperations = operationCount + (authLoading ? 1 : 0);

  if (!totalLoading) {
    return null;
  }

  const displayText = authLoading 
    ? 'Verificando autenticación...'
    : primaryOperation?.description || 'Cargando...';

  return (
    <View style={[styles.statusBar, style]}>
      <ActivityIndicator size="small" color="#3498db" />
      <Text style={styles.statusText} numberOfLines={1}>
        {displayText}
      </Text>
      {showOperationCount && totalOperations > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalOperations}</Text>
        </View>
      )}
    </View>
  );
};

// Componente de punto de carga mínimo
export const LoadingDot: React.FC<{
  style?: any;
  color?: string;
  size?: number;
}> = ({ style, color = '#3498db', size = 8 }) => {
  const { isLoading } = useGlobalLoadingState();
  const { loading: authLoading } = useAuth();
  
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isLoading || authLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, authLoading, pulseAnim]);

  if (!isLoading && !authLoading) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  spinner: {
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  operationsList: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  operationText: {
    fontSize: 12,
    color: '#666',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});

// Hook para controlar el indicador de carga
export const useLoadingIndicator = () => {
  const { isLoading, operationCount, startLoading, stopLoading } = useGlobalLoadingState();
  const { loading: authLoading } = useAuth();

  const showLoading = (id: string, description: string, timeout?: number) => {
    startLoading(id, description, timeout);
  };

  const hideLoading = (id: string) => {
    stopLoading(id);
  };

  const withLoading = async (id: string, description: string, operation: () => Promise<any>): Promise<any> => {
    showLoading(id, description);
    try {
      const result = await operation();
      return result;
    } finally {
      hideLoading(id);
    }
  };

  return {
    isLoading: isLoading || authLoading,
    operationCount: operationCount + (authLoading ? 1 : 0),
    showLoading,
    hideLoading,
    withLoading,
  };
};