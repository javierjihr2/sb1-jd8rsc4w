import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface BlockedUser {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatar?: string;
  blockedAt: Date;
  reason?: string;
}

interface ReportedUser {
  id: string;
  reportedUserId: string;
  displayName: string;
  username: string;
  reason: string;
  description: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

const BlockedUsersScreen = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocked' | 'reported'>('blocked');
  const [reportForm, setReportForm] = useState({
    userId: '',
    displayName: '',
    username: '',
    reason: '',
    description: ''
  });

  const reportReasons = [
    'Acoso o intimidación',
    'Contenido inapropiado',
    'Spam o publicidad',
    'Comportamiento tóxico en juegos',
    'Suplantación de identidad',
    'Discurso de odio',
    'Amenazas o violencia',
    'Otro'
  ];

  useEffect(() => {
    loadBlockedUsers();
    loadReportedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.blockedUsers) {
          // Cargar información completa de usuarios bloqueados
          const blockedUsersData = await Promise.all(
            userData.blockedUsers.map(async (blockedUser: any) => {
              try {
                const blockedUserDoc = await getDoc(doc(db, 'users', blockedUser.userId));
                if (blockedUserDoc.exists()) {
                  const blockedUserData = blockedUserDoc.data();
                  return {
                    id: blockedUser.userId,
                    userId: blockedUser.userId,
                    displayName: blockedUserData.displayName || 'Usuario',
                    username: blockedUserData.username || 'usuario',
                    avatar: blockedUserData.avatar,
                    blockedAt: blockedUser.blockedAt?.toDate() || new Date(),
                    reason: blockedUser.reason
                  };
                }
              } catch (error) {
                console.error('Error loading blocked user:', error);
              }
              return null;
            })
          );
          setBlockedUsers(blockedUsersData.filter(Boolean) as BlockedUser[]);
        }
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const loadReportedUsers = async () => {
    if (!user?.uid) return;
    
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('reporterId', '==', user.uid)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      
      const reportsData = await Promise.all(
        reportsSnapshot.docs.map(async (reportDoc) => {
          const reportData = reportDoc.data();
          try {
            const reportedUserDoc = await getDoc(doc(db, 'users', reportData.reportedUserId));
            if (reportedUserDoc.exists()) {
              const reportedUserData = reportedUserDoc.data();
              return {
                id: reportDoc.id,
                reportedUserId: reportData.reportedUserId,
                displayName: reportedUserData.displayName || 'Usuario',
                username: reportedUserData.username || 'usuario',
                reason: reportData.reason,
                description: reportData.description,
                reportedAt: reportData.reportedAt?.toDate() || new Date(),
                status: reportData.status || 'pending'
              };
            }
          } catch (error) {
            console.error('Error loading reported user:', error);
          }
          return null;
        })
      );
      
      setReportedUsers(reportsData.filter(Boolean) as ReportedUser[]);
    } catch (error) {
      console.error('Error loading reported users:', error);
    }
  };

  const handleUnblockUser = async (blockedUser: BlockedUser) => {
    Alert.alert(
      'Desbloquear Usuario',
      `¿Estás seguro de que quieres desbloquear a ${blockedUser.displayName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            setLoading(true);
            try {
              // Actualizar lista de usuarios bloqueados
              const userDoc = await getDoc(doc(db, 'users', user!.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const updatedBlockedUsers = (userData.blockedUsers || []).filter(
                  (blocked: any) => blocked.userId !== blockedUser.userId
                );
                
                await updateDoc(doc(db, 'users', user!.uid), {
                  blockedUsers: updatedBlockedUsers,
                  updatedAt: new Date()
                });
                
                setBlockedUsers(prev => prev.filter(u => u.userId !== blockedUser.userId));
                Alert.alert('Éxito', `${blockedUser.displayName} ha sido desbloqueado`);
              }
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'No se pudo desbloquear al usuario');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!reportForm.userId || !reportForm.reason) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      // Crear reporte
      await addDoc(collection(db, 'reports'), {
        reporterId: user!.uid,
        reportedUserId: reportForm.userId,
        reason: reportForm.reason,
        description: reportForm.description,
        reportedAt: new Date(),
        status: 'pending'
      });

      Alert.alert('Reporte Enviado', 'Tu reporte ha sido enviado y será revisado por nuestro equipo.');
      setShowReportModal(false);
      setReportForm({ userId: '', displayName: '', username: '', reason: '', description: '' });
      loadReportedUsers();
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, displayName: string, reason: string = 'Bloqueado manualmente') => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Obtener datos actuales del usuario
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Verificar si ya está bloqueado
      const currentBlockedUsers = userData.blockedUsers || [];
      const isAlreadyBlocked = currentBlockedUsers.some((blocked: any) => blocked.userId === userId);
      
      if (isAlreadyBlocked) {
        Alert.alert('Usuario ya bloqueado', 'Este usuario ya está en tu lista de bloqueados');
        return;
      }
      
      // Añadir a la lista de bloqueados
      const newBlockedUser = {
        userId,
        blockedAt: new Date(),
        reason
      };
      
      await updateDoc(doc(db, 'users', user.uid), {
        blockedUsers: [...currentBlockedUsers, newBlockedUser],
        updatedAt: new Date()
      });
      
      Alert.alert('Usuario Bloqueado', `${displayName} ha sido bloqueado exitosamente`);
      loadBlockedUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'No se pudo bloquear al usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userLeft}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#8E8E93" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          <Text style={styles.blockDate}>
            Bloqueado el {item.blockedAt.toLocaleDateString('es-ES')}
          </Text>
          {item.reason && (
            <Text style={styles.blockReason}>Motivo: {item.reason}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(item)}
        disabled={loading}
      >
        <Text style={styles.unblockText}>Desbloquear</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportedUser = ({ item }: { item: ReportedUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userLeft}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#8E8E93" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          <Text style={styles.reportDate}>
            Reportado el {item.reportedAt.toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.reportReason}>Motivo: {item.reason}</Text>
          {item.description && (
            <Text style={styles.reportDescription}>{item.description}</Text>
          )}
        </View>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, 
          item.status === 'pending' && styles.statusPending,
          item.status === 'reviewed' && styles.statusReviewed,
          item.status === 'resolved' && styles.statusResolved
        ]}>
          <Text style={[styles.statusText,
            item.status === 'pending' && styles.statusTextPending,
            item.status === 'reviewed' && styles.statusTextReviewed,
            item.status === 'resolved' && styles.statusTextResolved
          ]}>
            {item.status === 'pending' && 'Pendiente'}
            {item.status === 'reviewed' && 'Revisado'}
            {item.status === 'resolved' && 'Resuelto'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.blockFromReportButton}
          onPress={() => handleBlockUser(item.reportedUserId, item.displayName, `Reportado por: ${item.reason}`)}
          disabled={loading}
        >
          <Text style={styles.blockFromReportText}>Bloquear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios Bloqueados</Text>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="flag-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>
            Bloqueados ({blockedUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reported' && styles.activeTab]}
          onPress={() => setActiveTab('reported')}
        >
          <Text style={[styles.tabText, activeTab === 'reported' && styles.activeTabText]}>
            Reportados ({reportedUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'blocked' ? (
          blockedUsers.length > 0 ? (
            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUser}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="person-remove-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No hay usuarios bloqueados</Text>
              <Text style={styles.emptyDescription}>
                Los usuarios que bloquees aparecerán aquí. No podrán contactarte ni ver tu contenido.
              </Text>
            </View>
          )
        ) : (
          reportedUsers.length > 0 ? (
            <FlatList
              data={reportedUsers}
              renderItem={renderReportedUser}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No hay reportes enviados</Text>
              <Text style={styles.emptyDescription}>
                Los usuarios que reportes aparecerán aquí. Puedes reportar comportamientos inapropiados.
              </Text>
            </View>
          )
        )}
      </View>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reportar Usuario</Text>
            <TouchableOpacity 
              onPress={handleSubmitReport}
              disabled={loading}
            >
              <Text style={[styles.modalSubmit, loading && { color: '#8E8E93' }]}>Enviar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ID o nombre de usuario</Text>
              <TextInput
                style={styles.input}
                value={reportForm.userId}
                onChangeText={(text) => setReportForm(prev => ({ ...prev, userId: text }))}
                placeholder="Ingresa el ID o @usuario"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Motivo del reporte</Text>
              <View style={styles.reasonContainer}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, reportForm.reason === reason && styles.selectedReason]}
                    onPress={() => setReportForm(prev => ({ ...prev, reason }))}
                  >
                    <Text style={[styles.reasonText, reportForm.reason === reason && styles.selectedReasonText]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción adicional (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reportForm.description}
                onChangeText={(text) => setReportForm(prev => ({ ...prev, description: text }))}
                placeholder="Proporciona más detalles sobre el incidente..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Los reportes son revisados por nuestro equipo de moderación. Proporciona información precisa para ayudarnos a tomar las medidas apropiadas.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000'
  },
  reportButton: {
    padding: 8
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93'
  },
  activeTabText: {
    color: '#007AFF'
  },
  content: {
    flex: 1
  },
  listContainer: {
    padding: 16
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  userLeft: {
    flexDirection: 'row',
    flex: 1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2
  },
  userHandle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4
  },
  blockDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2
  },
  blockReason: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic'
  },
  reportDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2
  },
  reportReason: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 2
  },
  reportDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic'
  },
  unblockButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  unblockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500'
  },
  statusContainer: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  statusPending: {
    backgroundColor: '#FFF3CD'
  },
  statusReviewed: {
    backgroundColor: '#D1ECF1'
  },
  statusResolved: {
    backgroundColor: '#D4EDDA'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  statusTextPending: {
    color: '#856404'
  },
  statusTextReviewed: {
    color: '#0C5460'
  },
  statusTextResolved: {
    color: '#155724'
  },
  blockFromReportButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  blockFromReportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000'
  },
  modalSubmit: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  textArea: {
    height: 100,
    paddingTop: 12
  },
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  reasonOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8
  },
  selectedReason: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  reasonText: {
    fontSize: 14,
    color: '#000000'
  },
  selectedReasonText: {
    color: '#FFFFFF'
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginTop: 20
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20
  }
});

export default BlockedUsersScreen;