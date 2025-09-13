import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AccountOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  rightElement?: 'arrow' | 'text';
  rightText?: string;
  color?: string;
  isDangerous?: boolean;
}

const AccountSettingsScreen = () => {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationPassword, setConfirmationPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleDeactivateAccount = async () => {
    if (!user?.uid || !confirmationPassword) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña para confirmar');
      return;
    }

    Alert.alert(
      'Desactivar Cuenta',
      '¿Estás seguro de que quieres desactivar tu cuenta? Podrás reactivarla iniciando sesión nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Reautenticar usuario
              const credential = EmailAuthProvider.credential(user.email!, confirmationPassword);
              await reauthenticateWithCredential(user, credential);
              
              // Marcar cuenta como desactivada
              await updateDoc(doc(db, 'users', user.uid), {
                isActive: false,
                deactivatedAt: new Date(),
                updatedAt: new Date()
              });

              // Cerrar sesión
              await logout();
              
              Alert.alert(
                'Cuenta Desactivada',
                'Tu cuenta ha sido desactivada. Puedes reactivarla iniciando sesión nuevamente.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login' as any) }]
              );
            } catch (error: any) {
              console.error('Error deactivating account:', error);
              if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Contraseña incorrecta');
              } else {
                Alert.alert('Error', 'No se pudo desactivar la cuenta. Inténtalo de nuevo.');
              }
            } finally {
              setLoading(false);
              setShowDeactivateModal(false);
              setConfirmationPassword('');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid || !confirmationPassword) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña para confirmar');
      return;
    }

    if (deleteConfirmation.toLowerCase() !== 'eliminar') {
      Alert.alert('Error', 'Por favor escribe "eliminar" para confirmar');
      return;
    }

    Alert.alert(
      'Eliminar Cuenta Permanentemente',
      '⚠️ ADVERTENCIA: Esta acción NO se puede deshacer. Se eliminarán permanentemente:\n\n• Tu perfil y datos personales\n• Todos tus posts y comentarios\n• Tu historial de Battle Royale\n• Tus conexiones y amigos\n• Todos los datos asociados\n\n¿Estás absolutamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Permanentemente',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Reautenticar usuario
              const credential = EmailAuthProvider.credential(user.email!, confirmationPassword);
              await reauthenticateWithCredential(user, credential);
              
              // Eliminar datos del usuario de Firestore
              await deleteUserData(user.uid);
              
              // Eliminar cuenta de Firebase Auth
              await deleteUser(user);
              
              Alert.alert(
                'Cuenta Eliminada',
                'Tu cuenta ha sido eliminada permanentemente.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login' as any) }]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Contraseña incorrecta');
              } else if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Reautenticación Requerida',
                  'Por seguridad, necesitas iniciar sesión nuevamente antes de eliminar tu cuenta.'
                );
              } else {
                Alert.alert('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
              }
            } finally {
              setLoading(false);
              setShowDeleteModal(false);
              setConfirmationPassword('');
              setDeleteConfirmation('');
            }
          }
        }
      ]
    );
  };

  const deleteUserData = async (userId: string) => {
    try {
      // Eliminar documento del usuario
      await deleteDoc(doc(db, 'users', userId));
      
      // Eliminar posts del usuario
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      const deletePostsPromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePostsPromises);
      
      // Eliminar comentarios del usuario
      const commentsQuery = query(collection(db, 'comments'), where('userId', '==', userId));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deleteCommentsPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteCommentsPromises);
      
      // Eliminar conexiones del usuario
      const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', userId));
      const connectionsSnapshot = await getDocs(connectionsQuery);
      const deleteConnectionsPromises = connectionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteConnectionsPromises);
      
      // Eliminar conexiones donde el usuario es el objetivo
      const targetConnectionsQuery = query(collection(db, 'connections'), where('targetUserId', '==', userId));
      const targetConnectionsSnapshot = await getDocs(targetConnectionsQuery);
      const deleteTargetConnectionsPromises = targetConnectionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteTargetConnectionsPromises);
      
      console.log('User data deleted successfully');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Descargar Datos',
      'Te enviaremos un archivo con todos tus datos a tu correo electrónico en las próximas 24 horas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: () => {
            // Aquí implementarías la lógica para generar y enviar los datos
            Alert.alert('Solicitud Enviada', 'Recibirás tus datos por correo electrónico pronto.');
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Esta función te permitirá exportar tus datos en formato JSON.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: () => {
            // Aquí implementarías la lógica para exportar datos
            Alert.alert('Exportación Iniciada', 'Tus datos se están preparando para la exportación.');
          }
        }
      ]
    );
  };

  const accountOptions: AccountOption[] = [
    {
      id: 'download',
      title: 'Descargar Mis Datos',
      description: 'Obtén una copia de toda tu información',
      icon: 'download-outline',
      action: handleDownloadData,
      rightElement: 'arrow'
    },
    {
      id: 'export',
      title: 'Exportar Datos',
      description: 'Exporta tus datos en formato JSON',
      icon: 'document-text-outline',
      action: handleExportData,
      rightElement: 'arrow'
    }
  ];

  const dangerousOptions: AccountOption[] = [
    {
      id: 'deactivate',
      title: 'Desactivar Cuenta',
      description: 'Desactiva temporalmente tu cuenta (reversible)',
      icon: 'pause-circle-outline',
      action: () => setShowDeactivateModal(true),
      rightElement: 'arrow',
      color: '#FF9500',
      isDangerous: true
    },
    {
      id: 'delete',
      title: 'Eliminar Cuenta',
      description: 'Elimina permanentemente tu cuenta y todos los datos',
      icon: 'trash-outline',
      action: () => setShowDeleteModal(true),
      rightElement: 'arrow',
      color: '#FF3B30',
      isDangerous: true
    }
  ];

  const renderAccountOption = (option: AccountOption) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionItem, option.isDangerous && styles.dangerousOption]}
      onPress={option.action}
      disabled={loading}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, option.color && { backgroundColor: `${option.color}20` }]}>
          <Ionicons 
            name={option.icon} 
            size={20} 
            color={option.color || '#007AFF'} 
          />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, option.isDangerous && { color: option.color }]}>
            {option.title}
          </Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
      </View>
      
      {option.rightElement === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      )}
      
      {option.rightElement === 'text' && (
        <Text style={styles.rightText}>{option.rightText}</Text>
      )}
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Gestión de Cuenta</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <View style={styles.accountInfo}>
          <View style={styles.accountCard}>
            <Ionicons name="person-circle" size={48} color="#007AFF" />
            <Text style={styles.accountName}>{profile?.displayName || 'Usuario'}</Text>
            <Text style={styles.accountEmail}>{user?.email}</Text>
            <Text style={styles.accountDate}>
              Miembro desde {user?.metadata?.creationTime ? 
                new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long'
                }) : 'Fecha desconocida'
              }
            </Text>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Datos</Text>
          {accountOptions.map(renderAccountOption)}
        </View>

        {/* Dangerous Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.warningText}>
              Las siguientes acciones afectarán tu cuenta de manera significativa. Procede con precaución.
            </Text>
          </View>
          {dangerousOptions.map(renderAccountOption)}
        </View>
      </ScrollView>

      {/* Deactivate Account Modal */}
      <Modal
        visible={showDeactivateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeactivateModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Desactivar Cuenta</Text>
            <TouchableOpacity 
              onPress={handleDeactivateAccount}
              disabled={loading}
            >
              <Text style={[styles.modalAction, { color: '#FF9500' }, loading && { color: '#8E8E93' }]}>Desactivar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <Text style={styles.infoTitle}>¿Qué sucede al desactivar?</Text>
              <Text style={styles.infoText}>
                • Tu perfil no será visible para otros usuarios{"\n"}
                • No podrás iniciar sesión temporalmente{"\n"}
                • Tus datos se conservarán de forma segura{"\n"}
                • Puedes reactivar tu cuenta iniciando sesión nuevamente
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirma tu contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmationPassword}
                onChangeText={setConfirmationPassword}
                secureTextEntry
                placeholder="Ingresa tu contraseña"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
            <TouchableOpacity 
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Text style={[styles.modalAction, { color: '#FF3B30' }, loading && { color: '#8E8E93' }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.infoCard, { backgroundColor: '#FFF2F2', borderColor: '#FF3B30' }]}>
              <Ionicons name="warning" size={24} color="#FF3B30" />
              <Text style={[styles.infoTitle, { color: '#FF3B30' }]}>⚠️ ACCIÓN IRREVERSIBLE</Text>
              <Text style={styles.infoText}>
                Esta acción eliminará permanentemente:{"\n\n"}
                • Tu perfil y datos personales{"\n"}
                • Todos tus posts y comentarios{"\n"}
                • Tu historial de Battle Royale y estadísticas{"\n"}
                • Tus conexiones y lista de amigos{"\n"}
                • Todos los datos asociados a tu cuenta{"\n\n"}
                <Text style={{ fontWeight: 'bold', color: '#FF3B30' }}>Esta acción NO se puede deshacer.</Text>
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirma tu contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmationPassword}
                onChangeText={setConfirmationPassword}
                secureTextEntry
                placeholder="Ingresa tu contraseña"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Escribe "eliminar" para confirmar</Text>
              <TextInput
                style={styles.input}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="eliminar"
                autoCapitalize="none"
              />
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
  placeholder: {
    width: 40
  },
  content: {
    flex: 1
  },
  accountInfo: {
    marginTop: 20,
    marginHorizontal: 16
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  accountName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12
  },
  accountEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4
  },
  accountDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE066'
  },
  warningText: {
    fontSize: 14,
    color: '#B8860B',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20
  },
  optionItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 12
  },
  dangerousOption: {
    borderWidth: 1,
    borderColor: '#FFE5E5'
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  optionText: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2
  },
  optionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18
  },
  rightText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500'
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
  modalAction: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB'
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
    marginTop: 8
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20
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
  }
});

export default AccountSettingsScreen;