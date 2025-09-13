import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
      description: 'Battle Royale favorito, disponibilidad, matchmaking',
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
      route: '/settings/blocked-users'
    },
    {
      id: 'account',
      title: 'Gestión de Cuenta',
      icon: 'settings-outline',
      description: 'Descargar datos, desactivar o eliminar cuenta',
      route: '/settings/account'
    },
    {
      id: 'data',
      title: 'Datos y Almacenamiento',
      icon: 'cloud-download-outline',
      description: 'Descargar datos, gestionar almacenamiento',
      route: '/settings/data'
    },
    {
      id: 'feedback',
      title: 'Feedback y Reseñas',
      icon: 'chatbubbles-outline',
      description: 'Envía feedback, lee reseñas y estadísticas',
      route: '/feedback',
      color: '#007AFF'
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
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={item.description}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, item.color && { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={item.color || '#FF6B35'} 
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
      <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>⚙️ Configuración</Text>
            <Text style={styles.headerSubtitle}>
              Gestiona tu cuenta y preferencias de SquadGO
            </Text>
          </LinearGradient>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Info */}
          <BlurView intensity={20} tint="dark" style={styles.userSection}>
            <LinearGradient
              colors={['rgba(255, 107, 53, 0.1)', 'rgba(247, 147, 30, 0.1)']}
              style={styles.userGradient}
            >
              <View style={styles.userInfo}>
                <LinearGradient
                  colors={['#FF6B35', '#F7931E']}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={32} color="white" />
                </LinearGradient>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {profile?.displayName || profile?.username || 'Usuario'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {user?.email || 'email@ejemplo.com'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Settings Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Configuración General</Text>
            <BlurView intensity={15} tint="dark" style={styles.sectionContainer}>
              {settingsSections.map(renderSettingsItem)}
            </BlurView>
          </View>

          {/* Dangerous Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Acciones de Cuenta</Text>
            <BlurView intensity={15} tint="dark" style={styles.sectionContainer}>
              {dangerousActions.map(renderSettingsItem)}
            </BlurView>
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
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  gradient: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20
  },
  headerGradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },
  userSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)'
  },
  userGradient: {
    padding: 20
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginHorizontal: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(255, 107, 53, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  sectionContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)'
  },
  settingsItemText: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2
  },
  settingsDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)'
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 4
  }
});

export default SettingsScreen;