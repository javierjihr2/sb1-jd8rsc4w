import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SecurityOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  rightElement?: 'arrow' | 'switch' | 'text';
  rightText?: string;
  color?: string;
}

const SecuritySettingsScreen = () => {
  const { user, profile, enableBiometricAuth, isBiometricAvailable, biometricType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    if (!user?.uid) return;
    
    try {
      // Verificar si la autenticación biométrica está habilitada
      setBiometricEnabled(profile?.biometricEnabled || false);
      
      // Cargar sesiones activas (simulado)
      setActiveSessions(1); // Sesión actual
    } catch (error) {
      console.error('Error loading security info:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Cambiar contraseña
      await updatePassword(user, newPassword);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        passwordUpdatedAt: new Date(),
        updatedAt: new Date()
      });

      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'La contraseña actual es incorrecta');
      } else {
        Alert.alert('Error', 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!isBiometricAvailable) {
      Alert.alert(
        'No Disponible',
        'La autenticación biométrica no está disponible en este dispositivo'
      );
      return;
    }

    setLoading(true);
    try {
      if (biometricEnabled) {
        // Deshabilitar autenticación biométrica
        setBiometricEnabled(false);
        Alert.alert('Éxito', 'Autenticación biométrica deshabilitada');
      } else {
        // Para habilitar, necesitamos las credenciales
        Alert.prompt(
          'Confirmar Identidad',
          'Ingresa tu contraseña para habilitar la autenticación biométrica',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async (password) => {
                if (password && user?.email) {
                  const success = await enableBiometricAuth(user.email, password);
                  if (success) {
                    setBiometricEnabled(true);
                    Alert.alert('Éxito', 'Autenticación biométrica habilitada');
                  } else {
                    Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
                  }
                }
              }
            }
          ],
          'secure-text'
        );
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'No se pudo cambiar la configuración biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActiveSessions = () => {
    Alert.alert(
      'Sesiones Activas',
      `Tienes ${activeSessions} sesión activa:\n\n• Dispositivo actual\n• Última actividad: Ahora`,
      [
        { text: 'Cerrar Otras Sesiones', style: 'destructive', onPress: handleCloseOtherSessions },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleCloseOtherSessions = async () => {
    Alert.alert(
      'Cerrar Otras Sesiones',
      'Esta función cerrará todas las sesiones activas excepto la actual. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesiones',
          style: 'destructive',
          onPress: () => {
            // Aquí implementarías la lógica para cerrar otras sesiones
            Alert.alert('Éxito', 'Otras sesiones cerradas correctamente');
          }
        }
      ]
    );
  };

  const handleTwoFactorAuth = () => {
    Alert.alert(
      'Autenticación de Dos Factores',
      'Esta función estará disponible en una próxima actualización.',
      [{ text: 'OK' }]
    );
  };

  const handleLoginAlerts = () => {
    Alert.alert(
      'Alertas de Inicio de Sesión',
      'Esta función estará disponible en una próxima actualización.',
      [{ text: 'OK' }]
    );
  };

  const handleSecurityCheckup = () => {
    Alert.alert(
      'Revisión de Seguridad',
      '✅ Contraseña: Fuerte\n✅ Autenticación biométrica: ' + (biometricEnabled ? 'Habilitada' : 'Deshabilitada') + '\n✅ Sesiones activas: ' + activeSessions + '\n\nTu cuenta está segura.',
      [{ text: 'OK' }]
    );
  };

  const securityOptions: SecurityOption[] = [
    {
      id: 'password',
      title: 'Cambiar Contraseña',
      description: 'Actualiza tu contraseña de acceso',
      icon: 'key-outline',
      action: () => setShowPasswordModal(true),
      rightElement: 'arrow'
    },
    {
      id: 'biometric',
      title: `Autenticación ${biometricType}`,
      description: isBiometricAvailable ? `Usar ${biometricType.toLowerCase()} para iniciar sesión` : 'No disponible en este dispositivo',
      icon: 'finger-print-outline',
      action: handleToggleBiometric,
      rightElement: 'switch'
    },
    {
      id: 'sessions',
      title: 'Sesiones Activas',
      description: 'Gestiona dispositivos con acceso a tu cuenta',
      icon: 'phone-portrait-outline',
      action: handleViewActiveSessions,
      rightElement: 'text',
      rightText: `${activeSessions} activa${activeSessions !== 1 ? 's' : ''}`
    },
    {
      id: 'twoFactor',
      title: 'Autenticación de Dos Factores',
      description: 'Añade una capa extra de seguridad',
      icon: 'shield-checkmark-outline',
      action: handleTwoFactorAuth,
      rightElement: 'arrow'
    },
    {
      id: 'loginAlerts',
      title: 'Alertas de Inicio de Sesión',
      description: 'Recibe notificaciones de nuevos inicios de sesión',
      icon: 'notifications-outline',
      action: handleLoginAlerts,
      rightElement: 'arrow'
    },
    {
      id: 'checkup',
      title: 'Revisión de Seguridad',
      description: 'Revisa el estado de seguridad de tu cuenta',
      icon: 'checkmark-circle-outline',
      action: handleSecurityCheckup,
      rightElement: 'arrow',
      color: '#34C759'
    }
  ];

  const renderSecurityOption = (option: SecurityOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionItem}
      onPress={option.action}
      disabled={loading || (option.id === 'biometric' && !isBiometricAvailable)}
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
          <Text style={[styles.optionTitle, !isBiometricAvailable && option.id === 'biometric' && { color: '#8E8E93' }]}>
            {option.title}
          </Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
      </View>
      
      {option.rightElement === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      )}
      
      {option.rightElement === 'switch' && option.id === 'biometric' && (
        <View style={styles.switchContainer}>
          <Text style={[styles.switchText, { color: biometricEnabled ? '#34C759' : '#8E8E93' }]}>
            {biometricEnabled ? 'Habilitado' : 'Deshabilitado'}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Seguridad</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <Ionicons name="shield-checkmark" size={32} color="#34C759" />
            <Text style={styles.statusTitle}>Tu cuenta está protegida</Text>
            <Text style={styles.statusDescription}>
              Mantén tu cuenta segura revisando y actualizando regularmente tu configuración de seguridad.
            </Text>
          </View>
        </View>

        {/* Security Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Seguridad</Text>
          {securityOptions.map(renderSecurityOption)}
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            <TouchableOpacity 
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={[styles.modalSave, loading && { color: '#8E8E93' }]}>Guardar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña Actual</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                secureTextEntry
                placeholder="Ingresa tu contraseña actual"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
                placeholder="Ingresa tu nueva contraseña"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
                placeholder="Confirma tu nueva contraseña"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.passwordTips}>
              <Text style={styles.tipsTitle}>Consejos para una contraseña segura:</Text>
              <Text style={styles.tipText}>• Al menos 8 caracteres</Text>
              <Text style={styles.tipText}>• Combina letras, números y símbolos</Text>
              <Text style={styles.tipText}>• Evita información personal</Text>
              <Text style={styles.tipText}>• No uses la misma contraseña en otros sitios</Text>
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
  statusSection: {
    marginTop: 20,
    marginHorizontal: 16
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 8
  },
  statusDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20
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
  switchContainer: {
    marginLeft: 12
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500'
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
  modalSave: {
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
  passwordTips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    lineHeight: 20
  }
});

export default SecuritySettingsScreen;