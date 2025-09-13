import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineSync } from '../lib/offlineSync';

interface ConnectionStatusProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  style?: any;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showWhenOnline = false,
  position = 'top',
  style
}) => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    lastSyncTime: 0,
    pendingActions: 0,
    syncInProgress: false
  });
  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);
  
  const { getSyncStatus, subscribe, forceSync } = useOfflineSync();

  useEffect(() => {
    // Obtener estado inicial
    getSyncStatus().then(setSyncStatus);
    
    // Suscribirse a cambios
    const unsubscribe = subscribe(setSyncStatus);
    
    return unsubscribe;
  }, [getSyncStatus, subscribe]);

  useEffect(() => {
    const shouldShow = !syncStatus.isOnline || 
                     syncStatus.pendingActions > 0 || 
                     syncStatus.syncInProgress ||
                     showWhenOnline;
    
    if (shouldShow !== visible) {
      setVisible(shouldShow);
      
      Animated.timing(slideAnim, {
        toValue: shouldShow ? 0 : (position === 'top' ? -100 : 100),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [syncStatus, visible, slideAnim, position, showWhenOnline]);

  const handleRetrySync = async () => {
    if (syncStatus.isOnline && !syncStatus.syncInProgress) {
      try {
        await forceSync();
      } catch (error) {
        console.error('Error forzando sincronización:', error);
      }
    }
  };

  const getStatusInfo = () => {
    if (!syncStatus.isOnline) {
      return {
        icon: 'cloud-offline-outline' as const,
        text: 'Sin conexión',
        subtext: syncStatus.pendingActions > 0 
          ? `${syncStatus.pendingActions} cambios pendientes`
          : 'Trabajando offline',
        color: '#FF6B6B',
        backgroundColor: '#FFE5E5'
      };
    }
    
    if (syncStatus.syncInProgress) {
      return {
        icon: 'sync-outline' as const,
        text: 'Sincronizando...',
        subtext: `${syncStatus.pendingActions} elementos`,
        color: '#4ECDC4',
        backgroundColor: '#E5F9F7'
      };
    }
    
    if (syncStatus.pendingActions > 0) {
      return {
        icon: 'cloud-upload-outline' as const,
        text: 'Pendiente sincronización',
        subtext: `${syncStatus.pendingActions} cambios`,
        color: '#FFB347',
        backgroundColor: '#FFF3E5'
      };
    }
    
    return {
      icon: 'cloud-done-outline' as const,
      text: 'Conectado',
      subtext: 'Todo sincronizado',
      color: '#4CAF50',
      backgroundColor: '#E8F5E8'
    };
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Nunca';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return 'Ahora';
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: statusInfo.backgroundColor,
          borderColor: statusInfo.color,
          [position]: 0,
        },
        style
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handleRetrySync}
        disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={statusInfo.icon}
            size={20}
            color={statusInfo.color}
            style={syncStatus.syncInProgress ? styles.rotating : undefined}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.mainText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          <Text style={[styles.subText, { color: statusInfo.color }]}>
            {statusInfo.subtext}
          </Text>
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: statusInfo.color }]}>
            {formatLastSync()}
          </Text>
        </View>
        
        {syncStatus.pendingActions > 0 && syncStatus.isOnline && (
          <View style={styles.retryContainer}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color={statusInfo.color}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    opacity: 0.8,
  },
  timeContainer: {
    marginLeft: 8,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  retryContainer: {
    marginLeft: 8,
    padding: 4,
  },
  rotating: {
    // La animación de rotación se puede agregar con Animated.loop si es necesario
  },
});

export default ConnectionStatus;

// Hook para usar el estado de conexión
export const useConnectionStatus = () => {
  const [status, setStatus] = useState({
    isOnline: true,
    lastSyncTime: 0,
    pendingActions: 0,
    syncInProgress: false
  });
  
  const { getSyncStatus, subscribe } = useOfflineSync();
  
  useEffect(() => {
    getSyncStatus().then(setStatus);
    const unsubscribe = subscribe(setStatus);
    return unsubscribe;
  }, [getSyncStatus, subscribe]);
  
  return status;
};