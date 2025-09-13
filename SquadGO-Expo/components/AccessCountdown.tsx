import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAccessControl } from '../lib/access-control';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface AccessCountdownProps {
  showDetailed?: boolean;
  compact?: boolean;
}

export const AccessCountdown: React.FC<AccessCountdownProps> = ({ 
  showDetailed = false, 
  compact = false 
}) => {
  const { stats, loading, progressInfo } = useAccessControl();
  const [animatedValue] = React.useState(new Animated.Value(0));
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (stats) {
      // Animar progreso
      Animated.timing(animatedValue, {
        toValue: progressInfo.basicProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Animar pulso si está cerca de un hito
      if (progressInfo.usersNeeded <= 10 && progressInfo.usersNeeded > 0) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [stats, progressInfo]);

  if (loading || !stats) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={24} color={Colors.light.text} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </View>
    );
  }

  const getAccessLevelInfo = () => {
    switch (stats.accessLevel.level) {
      case 'restricted':
        return {
          icon: 'lock-closed' as const,
          color: '#FF6B6B',
          title: 'Acceso Restringido',
          description: 'Funciones limitadas hasta alcanzar más usuarios'
        };
      case 'basic':
        return {
          icon: 'lock-open' as const,
          color: '#4ECDC4',
          title: 'Acceso Básico',
          description: 'Match y torneos disponibles'
        };
      case 'full':
        return {
          icon: 'checkmark-circle' as const,
          color: '#45B7D1',
          title: 'Acceso Completo',
          description: '¡Todas las funciones desbloqueadas!'
        };
    }
  };

  const accessInfo = getAccessLevelInfo();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Ionicons name={accessInfo.icon} size={20} color={accessInfo.color} />
          <Text style={styles.compactTitle}>{stats.totalUsers}/1000 usuarios</Text>
        </View>
        {progressInfo.usersNeeded > 0 && (
          <Text style={styles.compactSubtitle}>
            {progressInfo.usersNeeded} para {progressInfo.nextMilestone}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={accessInfo.icon} size={32} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{accessInfo.title}</Text>
            <Text style={styles.subtitle}>{accessInfo.description}</Text>
          </View>
        </View>

        {/* Contador principal */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterNumber}>{stats.totalUsers}</Text>
          <Text style={styles.counterLabel}>usuarios registrados</Text>
          {stats.countdown > 0 && (
            <Text style={styles.countdownText}>
              {stats.countdown} restantes para acceso completo
            </Text>
          )}
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso hacia {progressInfo.nextMilestone}</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progressInfo.basicProgress)}%
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: animatedValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
          </View>
          
          {progressInfo.usersNeeded > 0 && (
            <Text style={styles.usersNeeded}>
              {progressInfo.usersNeeded} usuarios más para desbloquear
            </Text>
          )}
        </View>

        {/* Información detallada */}
        {showDetailed && (
          <View style={styles.detailedInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Servidor: {stats.serverUsers} usuarios</Text>
            </View>
            
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Funciones disponibles:</Text>
              <View style={styles.featuresList}>
                <FeatureItem 
                  icon="game-controller" 
                  label="Match" 
                  enabled={stats.accessLevel.canAccessMatch} 
                />
                <FeatureItem 
                  icon="chatbubbles" 
                  label="Mensajes" 
                  enabled={stats.accessLevel.canSendMessages} 
                />
                <FeatureItem 
                  icon="trophy" 
                  label="Torneos" 
                  enabled={stats.accessLevel.canCreateTournaments} 
                />
                <FeatureItem 
                  icon="star" 
                  label="Premium" 
                  enabled={stats.accessLevel.canAccessPremiumFeatures} 
                />
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  enabled: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, label, enabled }) => (
  <View style={styles.featureItem}>
    <Ionicons 
      name={icon} 
      size={14} 
      color={enabled ? '#4ECDC4' : 'rgba(255,255,255,0.4)'} 
    />
    <Text style={[styles.featureLabel, { opacity: enabled ? 1 : 0.4 }]}>
      {label}
    </Text>
    <Ionicons 
      name={enabled ? 'checkmark-circle' : 'close-circle'} 
      size={14} 
      color={enabled ? '#4ECDC4' : '#FF6B6B'} 
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  compactContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    margin: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  counterLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  countdownText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  usersNeeded: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  detailedInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  compactSubtitle: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
});

export default AccessCountdown;