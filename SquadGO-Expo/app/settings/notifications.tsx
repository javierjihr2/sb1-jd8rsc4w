import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NotificationPreferences } from '../../lib/notification-service';
import NotificationSettings from '../../components/NotificationSettings';
import { analyticsManager } from '../../lib/analytics';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  category: 'gaming' | 'social' | 'system' | 'marketing';
  notificationType?: NotificationType;
  priority?: 'low' | 'normal' | 'high';
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const NotificationSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { state, actions } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    // Gaming Notifications
    {
      id: 'game_invites',
      title: 'Invitaciones de Juego',
      description: 'Cuando alguien te invite a jugar',
      icon: 'game-controller-outline',
      enabled: true,
      category: 'gaming',
      notificationType: NotificationType.GAME_INVITE,
      priority: 'high'
    },
    {
      id: 'match_found',
      title: 'Partida Encontrada',
      description: 'Cuando se encuentre una partida para ti',
      icon: 'search-outline',
      enabled: true,
      category: 'gaming',
      notificationType: NotificationType.MATCH_FOUND,
      priority: 'high'
    },
    {
      id: 'tournament_updates',
      title: 'Actualizaciones de Torneos',
      description: 'Noticias sobre torneos y competencias',
      icon: 'trophy-outline',
      enabled: true,
      category: 'gaming',
      notificationType: NotificationType.TOURNAMENT_UPDATE,
      priority: 'normal'
    },
    {
      id: 'squad_activity',
      title: 'Actividad del Squad',
      description: 'Cuando tu squad esté activo o jugando',
      icon: 'people-outline',
      enabled: true,
      category: 'gaming'
    },
    
    // Social Notifications
    {
      id: 'friend_requests',
      title: 'Solicitudes de Amistad',
      description: 'Nuevas solicitudes de conexión',
      icon: 'person-add-outline',
      enabled: true,
      category: 'social',
      notificationType: NotificationType.FRIEND_REQUEST,
      priority: 'normal'
    },
    {
      id: 'messages',
      title: 'Mensajes Directos',
      description: 'Nuevos mensajes privados',
      icon: 'chatbubble-outline',
      enabled: true,
      category: 'social',
      notificationType: NotificationType.MESSAGE,
      priority: 'high'
    },
    {
      id: 'post_likes',
      title: 'Me Gusta en Posts',
      description: 'Cuando alguien le dé me gusta a tus posts',
      icon: 'heart-outline',
      enabled: true,
      category: 'social',
      notificationType: NotificationType.POST_LIKE,
      priority: 'low'
    },
    {
      id: 'post_comments',
      title: 'Comentarios en Posts',
      description: 'Nuevos comentarios en tus publicaciones',
      icon: 'chatbubbles-outline',
      enabled: true,
      category: 'social'
    },
    {
      id: 'mentions',
      title: 'Menciones',
      description: 'Cuando alguien te mencione',
      icon: 'at-outline',
      enabled: true,
      category: 'social'
    },
    
    // System Notifications
    {
      id: 'security_alerts',
      title: 'Alertas de Seguridad',
      description: 'Inicios de sesión y cambios de seguridad',
      icon: 'shield-outline',
      enabled: true,
      category: 'system'
    },
    {
      id: 'app_updates',
      title: 'Actualizaciones de la App',
      description: 'Nuevas funciones y mejoras',
      icon: 'download-outline',
      enabled: true,
      category: 'system'
    },
    {
      id: 'maintenance',
      title: 'Mantenimiento',
      description: 'Notificaciones de mantenimiento programado',
      icon: 'construct-outline',
      enabled: true,
      category: 'system'
    },
    
    // Marketing Notifications
    {
      id: 'promotions',
      title: 'Promociones y Ofertas',
      description: 'Ofertas especiales y descuentos',
      icon: 'pricetag-outline',
      enabled: false,
      category: 'marketing'
    },
    {
      id: 'newsletters',
      title: 'Boletines Informativos',
      description: 'Noticias y actualizaciones del gaming',
      icon: 'mail-outline',
      enabled: false,
      category: 'marketing'
    },
    {
      id: 'recommendations',
      title: 'Recomendaciones',
      description: 'Juegos y jugadores recomendados',
      icon: 'bulb-outline',
      enabled: false,
      category: 'marketing'
    }
  ]);

  const categories: NotificationCategory[] = [
    {
      id: 'gaming',
      title: 'Gaming',
      description: 'Notificaciones relacionadas con juegos',
      icon: 'game-controller',
      color: '#34C759'
    },
    {
      id: 'social',
      title: 'Social',
      description: 'Interacciones sociales y mensajes',
      icon: 'people',
      color: '#007AFF'
    },
    {
      id: 'system',
      title: 'Sistema',
      description: 'Actualizaciones y alertas importantes',
      icon: 'settings',
      color: '#FF9500'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Promociones y contenido promocional',
      icon: 'megaphone',
      color: '#AF52DE'
    }
  ];

  useEffect(() => {
    // Cargar configuraciones iniciales
    if (!state.preferences.enabled) {
      actions.loadHistory();
    }
  }, [user]);

  const handlePreferencesChange = (preferences: NotificationPreferences) => {
    // Las preferencias ya se actualizan automáticamente a través del contexto
    analyticsManager.trackEvent('notification_preferences_updated', {
      enabled_types_count: Object.values(preferences.enabledTypes).filter(Boolean).length,
      quiet_hours_enabled: preferences.quietHours?.enabled ?? false,
      global_enabled: preferences.enabled,
    });
  };

  const handleViewAllNotifications = () => {
    router.push('/notifications');
    analyticsManager.trackEvent('view_all_notifications_pressed', {
      from_screen: 'notification_settings',
    });
  };

  const handleTestNotification = async () => {
    try {
      await actions.sendTestNotification();
      Alert.alert(
        'Notificación de prueba enviada',
        'Deberías recibir una notificación de prueba en unos segundos.'
      );
      
      analyticsManager.trackEvent('test_notification_sent', {
        from_screen: 'notification_settings',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar la notificación de prueba.'
      );
    }
  };

  const updateNotificationSetting = async (settingId: string, enabled: boolean) => {
    setLoading(true);
    try {
      // Actualizar estado local
      setSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.id === settingId ? { ...setting, enabled } : setting
        )
      );
      
      // Encontrar la configuración actualizada
      const updatedSetting = settings.find(setting => setting.id === settingId);
      
      // Actualizar preferencias en el servicio de notificaciones
      if (updatedSetting?.notificationType) {
        await notificationService.updateNotificationPreference(
          updatedSetting.notificationType,
          enabled
        );
      }
      
      // Crear objeto con todas las configuraciones
      const updatedSettings = settings.reduce((acc, setting) => {
        acc[setting.id] = setting.id === settingId ? enabled : setting.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      
      // Guardar en Firestore
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          notificationSettings: updatedSettings,
          updatedAt: new Date()
        });
      }
      
      // Guardar en AsyncStorage como respaldo
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
      
      // Registrar evento de analytics
      analyticsManager.trackEvent('notification_setting_changed', {
        setting_id: settingId,
        enabled: enabled,
        notification_type: updatedSetting?.notificationType,
        category: updatedSetting?.category
      });
      
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
      
      // Revertir cambio en caso de error
      setSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.id === settingId ? { ...setting, enabled: !enabled } : setting
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCategorySettings = async (categoryId: string, enabled: boolean) => {
    const categorySettings = settings.filter(setting => setting.category === categoryId);
    
    Alert.alert(
      enabled ? 'Habilitar Categoría' : 'Deshabilitar Categoría',
      `¿Quieres ${enabled ? 'habilitar' : 'deshabilitar'} todas las notificaciones de ${categories.find(c => c.id === categoryId)?.title}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: enabled ? 'Habilitar Todo' : 'Deshabilitar Todo',
          onPress: async () => {
            setLoading(true);
            try {
              // Actualizar todas las configuraciones de la categoría
              const updatedSettings = settings.map(setting => 
                setting.category === categoryId ? { ...setting, enabled } : setting
              );
              setSettings(updatedSettings);
              
              // Crear objeto para guardar
              const settingsObject = updatedSettings.reduce((acc, setting) => {
                acc[setting.id] = setting.enabled;
                return acc;
              }, {} as Record<string, boolean>);
              
              // Guardar en Firestore
              if (user?.uid) {
                await updateDoc(doc(db, 'users', user.uid), {
                  notificationSettings: settingsObject,
                  updatedAt: new Date()
                });
              }
              
              // Guardar en AsyncStorage
              await AsyncStorage.setItem('notificationSettings', JSON.stringify(settingsObject));
              
            } catch (error) {
              console.error('Error updating category settings:', error);
              Alert.alert('Error', 'No se pudo actualizar la configuración');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Quieres restablecer todas las configuraciones de notificaciones a los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Restablecer a valores predeterminados
              const defaultSettings = settings.map(setting => ({
                ...setting,
                enabled: setting.category !== 'marketing' // Marketing deshabilitado por defecto
              }));
              setSettings(defaultSettings);
              
              // Crear objeto para guardar
              const settingsObject = defaultSettings.reduce((acc, setting) => {
                acc[setting.id] = setting.enabled;
                return acc;
              }, {} as Record<string, boolean>);
              
              // Guardar en Firestore
              if (user?.uid) {
                await updateDoc(doc(db, 'users', user.uid), {
                  notificationSettings: settingsObject,
                  updatedAt: new Date()
                });
              }
              
              // Guardar en AsyncStorage
              await AsyncStorage.setItem('notificationSettings', JSON.stringify(settingsObject));
              
              Alert.alert('Éxito', 'Configuración restablecida a valores predeterminados');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'No se pudo restablecer la configuración');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderCategory = (category: NotificationCategory) => {
    const categorySettings = settings.filter(setting => setting.category === category.id);
    const enabledCount = categorySettings.filter(setting => setting.enabled).length;
    const totalCount = categorySettings.length;
    
    return (
      <View key={category.id} style={styles.categorySection}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleCategorySettings(category.id, enabledCount < totalCount)}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
              <Ionicons name={category.icon} size={20} color={category.color} />
            </View>
            <View style={styles.categoryText}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCount}>{enabledCount}/{totalCount}</Text>
            <Ionicons name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.categorySettings}>
          {categorySettings.map(setting => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name={setting.icon} size={18} color="#8E8E93" style={styles.settingIcon} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={(enabled) => updateNotificationSetting(setting.id, enabled)}
                disabled={loading}
                trackColor={{ false: '#E5E5EA', true: category.color + '40' }}
                thumbColor={setting.enabled ? category.color : '#FFFFFF'}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de notificaciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Estado y acciones rápidas */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewAllNotifications}
        >
          <Ionicons name="list" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Ver todas</Text>
          {state.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{state.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestNotification}
        >
          <Ionicons name="send" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Enviar prueba</Text>
        </TouchableOpacity>
      </View>

      {/* Configuraciones detalladas */}
      <NotificationSettings onPreferencesChange={handlePreferencesChange} />

      {/* Información adicional */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Información</Text>
        <Text style={styles.infoText}>
          Las notificaciones te ayudan a mantenerte al día con tu actividad en SquadGO.
          Puedes personalizar qué tipos de notificaciones quieres recibir y cuándo.
        </Text>
        
        <View style={styles.statusInfo}>
          <Ionicons 
            name={state.preferences.enabled ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color={state.preferences.enabled ? '#28a745' : '#dc3545'} 
          />
          <Text style={[
            styles.statusText,
            { color: state.preferences.enabled ? '#28a745' : '#dc3545' }
          ]}>
            {state.preferences.enabled ? 'Notificaciones habilitadas' : 'Notificaciones deshabilitadas'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  categorySection: {
    marginBottom: 20
  },
  categoryHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  categoryText: {
    flex: 1
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2
  },
  categoryDescription: {
    fontSize: 13,
    color: '#8E8E93'
  },
  categoryRight: {
    alignItems: 'center'
  },
  categoryCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2
  },
  categorySettings: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7'
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIcon: {
    marginRight: 12,
    width: 20
  },
  settingText: {
    flex: 1
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2
  },
  settingDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16
  },
  additionalSection: {
    marginTop: 20,
    marginBottom: 40
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
  optionText: {
    flex: 1,
    marginLeft: 12
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
  }
});

export default NotificationSettingsScreen;