import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAccessControl } from '../lib/access-control';
import { Colors } from '../constants/Colors';
import AccessCountdown from './AccessCountdown';

const { width, height } = Dimensions.get('window');

interface AccessBlockerProps {
  feature: 'match' | 'messages' | 'tournaments' | 'premium';
  children: React.ReactNode;
  showModal?: boolean;
  onModalClose?: () => void;
}

export const AccessBlocker: React.FC<AccessBlockerProps> = ({
  feature,
  children,
  showModal = false,
  onModalClose
}) => {
  const { stats, loading } = useAccessControl();
  const [modalVisible, setModalVisible] = React.useState(false);

  const getFeatureAccess = () => {
    if (!stats) return false;
    
    switch (feature) {
      case 'match':
        return stats.accessLevel.canAccessMatch;
      case 'messages':
        return stats.accessLevel.canSendMessages;
      case 'tournaments':
        return stats.accessLevel.canCreateTournaments;
      case 'premium':
        return stats.accessLevel.canAccessPremiumFeatures;
      default:
        return false;
    }
  };

  const getFeatureInfo = () => {
    switch (feature) {
      case 'match':
        return {
          icon: 'game-controller' as const,
          title: 'Función de Match',
          description: 'Encuentra y conecta con otros jugadores',
          requirement: 'Requiere 100 usuarios en el servidor O 500 usuarios totales',
          color: '#FF6B6B'
        };
      case 'messages':
        return {
          icon: 'chatbubbles' as const,
          title: 'Sistema de Mensajes',
          description: 'Chatea con otros usuarios de la plataforma',
          requirement: 'Requiere 1000 usuarios totales para acceso completo',
          color: '#4ECDC4'
        };
      case 'tournaments':
        return {
          icon: 'trophy' as const,
          title: 'Torneos',
          description: 'Crea y participa en torneos competitivos',
          requirement: 'Disponible con acceso básico (500 usuarios)',
          color: '#FFD93D'
        };
      case 'premium':
        return {
          icon: 'star' as const,
          title: 'Funciones Premium',
          description: 'Accede a características exclusivas y avanzadas',
          requirement: 'Requiere acceso completo (1000 usuarios)',
          color: '#9B59B6'
        };
    }
  };

  const featureInfo = getFeatureInfo();
  const hasAccess = getFeatureAccess();

  // Si tiene acceso, mostrar el contenido normal
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={32} color={Colors.light.text} />
        <Text style={styles.loadingText}>Verificando acceso...</Text>
      </View>
    );
  }

  const handleShowDetails = () => {
    if (showModal && onModalClose) {
      onModalClose();
    } else {
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  return (
    <>
      {/* Contenido bloqueado */}
      <View style={styles.blockedContainer}>
        <BlurView intensity={20} style={styles.blurOverlay}>
          <View style={styles.blockContent}>
            <View style={[styles.iconContainer, { backgroundColor: featureInfo.color }]}>
              <Ionicons name="lock-closed" size={32} color="white" />
            </View>
            
            <Text style={styles.blockedTitle}>Función Bloqueada</Text>
            <Text style={styles.blockedDescription}>
              {featureInfo.title} estará disponible cuando se alcance el número requerido de usuarios.
            </Text>
            
            <TouchableOpacity style={styles.detailsButton} onPress={handleShowDetails}>
              <Text style={styles.detailsButtonText}>Ver Progreso</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
            
            {stats && (
              <View style={styles.quickStats}>
                <Text style={styles.quickStatsText}>
                  {stats.totalUsers}/1000 usuarios • {Math.max(0, 1000 - stats.totalUsers)} restantes
                </Text>
              </View>
            )}
          </View>
        </BlurView>
        
        {/* Contenido original con opacidad reducida */}
        <View style={styles.backgroundContent}>
          {children}
        </View>
      </View>

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible || showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[featureInfo.color, '#667eea']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name={featureInfo.icon} size={40} color="white" />
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Contenido del modal */}
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{featureInfo.title}</Text>
                <Text style={styles.modalDescription}>{featureInfo.description}</Text>
                
                <View style={styles.requirementContainer}>
                  <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.requirementText}>{featureInfo.requirement}</Text>
                </View>
                
                {/* Countdown component */}
                <View style={styles.countdownContainer}>
                  <AccessCountdown showDetailed={true} />
                </View>
                
                {/* Botones de acción */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-social" size={20} color="white" />
                    <Text style={styles.shareButtonText}>Invitar Amigos</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.notifyButton}>
                    <Ionicons name="notifications" size={20} color="white" />
                    <Text style={styles.notifyButtonText}>Notificarme</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  blockedContainer: {
    position: 'relative',
    minHeight: 200,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockContent: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    margin: 20,
    maxWidth: width * 0.8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  blockedDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
  quickStats: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickStatsText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  backgroundContent: {
    opacity: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: height * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    lineHeight: 22,
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
    flex: 1,
  },
  countdownContainer: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  notifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AccessBlocker;