import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';

interface SettingsSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  route?: string;
  action?: () => void;
  color?: string;
}

const SettingsScreen = () => {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Perfil y Cuenta',
      icon: 'person-circle-outline',
      description: 'Editar información personal, foto de perfil',
      route: '/settings/profile'
    },
    {
      id: 'privacy',
      title: 'Privacidad',
      icon: 'shield-outline',
      description: 'Controla quién puede ver tu información',
      route: '/settings/privacy'
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: 'lock-closed-outline',
      description: 'Contraseña, autenticación biométrica',
      route: '/settings/security'
    },
    {
      id: 'gaming',
      title: 'Preferencias de Gaming',
      icon: 'game-controller-outline',
      description: 'Juegos favoritos, disponibilidad, matchmaking',
      route: '/settings/gaming'
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      description: 'Gestiona todas tus notificaciones',
      route: '/settings/notifications'
    },
    {
      id: 'blocked',
      title: 'Usuarios Bloqueados',
      icon: 'ban-outline',
      description: 'Gestiona usuarios bloqueados y reportes',
      route: '/settings/blocked'
    },
    {
      id: 'data',
      title: 'Datos y Almacenamiento',
      icon: 'cloud-download-outline',
      description: 'Descargar datos, gestionar almacenamiento',
      route: '/settings/data'
    },
    {
      id: 'support',
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      description: 'Centro de ayuda, contactar soporte',
      route: '/settings/support'
    },
    {
      id: 'about',
      title: 'Acerca de SquadGO',
      icon: 'information-circle-outline',
      description: 'Versión, términos de servicio, política de privacidad',
      route: '/settings/about'
    }
  ];

  const dangerousActions: SettingsSection[] = [
    {
      id: 'logout',
      title: 'Cerrar Sesión',
      icon: 'log-out-outline',
      description: 'Salir de tu cuenta',
      action: handleLogout,
      color: '#FF6B6B'
    },
    {
      id: 'deactivate',
      title: 'Desactivar Cuenta',
      icon: 'pause-circle-outline',
      description: 'Suspender temporalmente tu cuenta',
      route: '/settings/deactivate',
      color: '#FFA726'
    },
    {
      id: 'delete',
      title: 'Eliminar Cuenta',
      icon: 'trash-outline',
      description: 'Eliminar permanentemente tu cuenta',
      route: '/settings/delete',
      color: '#F44336'
    }
  ];

  const renderSettingsItem = (item: SettingsSection) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingsItem}
      onPress={() => {
        if (item.action) {
          item.action();
        } else if (item.route) {
          router.push(item.route as any);
        }
      }}
      disabled={loading}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, item.color && { backgroundColor: `${item.color}20` }]}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={item.color || '#007AFF'} 
          />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsTitle, item.color && { color: item.color }]}>
            {item.title}
          </Text>
          <Text style={styles.settingsDescription}>
            {item.description}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración</Text>
        <Text style={styles.headerSubtitle}>
          Gestiona tu cuenta y preferencias de SquadGO
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#007AFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {profile?.displayName || profile?.username || 'Usuario'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'email@ejemplo.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración General</Text>
        {settingsSections.map(renderSettingsItem)}
      </View>

      {/* Dangerous Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>
        {dangerousActions.map(renderSettingsItem)}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          SquadGO v1.0.0
        </Text>
        <Text style={styles.footerText}>
          © 2024 SquadGO. Todos los derechos reservados.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93'
  },
  userSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93'
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
  settingsItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 12
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  settingsItemText: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2
  },
  settingsDescription: {
    fontSize: 13,
    color: '#8E8E93'
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4
  }
});

export default SettingsScreen;