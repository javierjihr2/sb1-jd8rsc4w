import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBlockUser } from '../hooks/useBlockUser';
import { router } from 'expo-router';

interface UserActionMenuProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  username: string;
  isBlocked?: boolean;
  onUserBlocked?: () => void;
  onUserUnblocked?: () => void;
}

interface MenuOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  action: () => void;
  isDangerous?: boolean;
}

const UserActionMenu: React.FC<UserActionMenuProps> = ({
  visible,
  onClose,
  userId,
  displayName,
  username,
  isBlocked = false,
  onUserBlocked,
  onUserUnblocked
}) => {
  const { blockUser, unblockUser, reportUser, loading } = useBlockUser();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const reportReasons = [
    'Acoso o intimidación',
    'Contenido inapropiado',
    'Spam o publicidad',
    'Comportamiento tóxico en Battle Royale',
    'Suplantación de identidad',
    'Discurso de odio',
    'Amenazas o violencia',
    'Otro'
  ];

  const handleBlockUser = async () => {
    Alert.alert(
      'Bloquear Usuario',
      `¿Estás seguro de que quieres bloquear a ${displayName}? No podrán contactarte ni ver tu contenido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            const success = await blockUser({
              userId,
              displayName,
              reason: 'Bloqueado desde menú de usuario'
            });
            if (success) {
              onUserBlocked?.();
              onClose();
            }
          }
        }
      ]
    );
  };

  const handleUnblockUser = async () => {
    Alert.alert(
      'Desbloquear Usuario',
      `¿Estás seguro de que quieres desbloquear a ${displayName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            const success = await unblockUser({ userId, displayName });
            if (success) {
              onUserUnblocked?.();
              onClose();
            }
          }
        }
      ]
    );
  };

  const handleSendMessage = () => {
    onClose();
    router.push(`/chats/new?userId=${userId}&displayName=${displayName}` as any);
  };

  const handleViewProfile = () => {
    onClose();
    router.push(`/profile/${userId}` as any);
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Por favor selecciona un motivo para el reporte');
      return;
    }

    const success = await reportUser({
      userId,
      displayName,
      reason: reportReason,
      description: reportDescription
    });

    if (success) {
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      onClose();
    }
  };

  const menuOptions: MenuOption[] = [
    {
      id: 'profile',
      title: 'Ver Perfil',
      icon: 'person-outline',
      action: handleViewProfile
    },
    {
      id: 'message',
      title: 'Enviar Mensaje',
      icon: 'chatbubble-outline',
      action: handleSendMessage
    },
    {
      id: 'report',
      title: 'Reportar Usuario',
      icon: 'flag-outline',
      color: '#FF9500',
      action: handleReportUser
    },
    {
      id: 'block',
      title: isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario',
      icon: isBlocked ? 'checkmark-circle-outline' : 'ban-outline',
      color: isBlocked ? '#34C759' : '#FF3B30',
      action: isBlocked ? handleUnblockUser : handleBlockUser,
      isDangerous: !isBlocked
    }
  ];

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Acciones para {displayName}</Text>
                <Text style={styles.headerSubtitle}>@{username}</Text>
              </View>

              {/* Menu Options */}
              <View style={styles.optionsContainer}>
                {menuOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.option,
                      option.isDangerous && styles.dangerousOption
                    ]}
                    onPress={option.action}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={20} 
                      color={option.color || '#007AFF'} 
                    />
                    <Text style={[
                      styles.optionText,
                      { color: option.color || '#007AFF' },
                      option.isDangerous && styles.dangerousText
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.reportOverlay}>
          <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Reportar a {displayName}</Text>
              <TouchableOpacity 
                onPress={() => setShowReportModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reportContent}>
              <Text style={styles.sectionTitle}>Motivo del reporte</Text>
              <View style={styles.reasonsContainer}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOption,
                      reportReason === reason && styles.selectedReason
                    ]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Text style={[
                      styles.reasonText,
                      reportReason === reason && styles.selectedReasonText
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Descripción adicional (opcional)</Text>
              <TextInput
                style={styles.descriptionInput}
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder="Proporciona más detalles sobre el incidente..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  Los reportes son revisados por nuestro equipo de moderación. Proporciona información precisa para ayudarnos a tomar las medidas apropiadas.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={styles.cancelReportButton} 
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelReportText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.submitReportButton,
                  (!reportReason.trim() || loading) && styles.disabledButton
                ]} 
                onPress={handleSubmitReport}
                disabled={!reportReason.trim() || loading}
              >
                <Text style={styles.submitReportText}>
                  {loading ? 'Enviando...' : 'Enviar Reporte'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dangerousOption: {
    backgroundColor: '#FFF5F5',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerousText: {
    color: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  reportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  reportContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reasonOption: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedReason: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reasonText: {
    fontSize: 14,
    color: '#000000',
  },
  selectedReasonText: {
    color: '#FFFFFF',
  },
  descriptionInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    height: 100,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  reportActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelReportButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  cancelReportText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  submitReportButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  submitReportText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default UserActionMenu;