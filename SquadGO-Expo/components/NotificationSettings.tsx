import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NotificationType, NotificationPreferences } from '../lib/notification-service';
import { useNotificationContext } from '../contexts/NotificationContext';
import { analyticsManager } from '../lib/analytics';

interface NotificationSettingsProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

interface TimeRange {
  start: Date;
  end: Date;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onPreferencesChange,
}) => {
  const { state, actions } = useNotificationContext();
  const [preferences, setPreferences] = useState<NotificationPreferences>(state.preferences);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [quietHours, setQuietHours] = useState<TimeRange>({
    start: new Date(2024, 0, 1, 22, 0), // 10:00 PM
    end: new Date(2024, 0, 1, 8, 0),   // 8:00 AM
  });

  useEffect(() => {
    setPreferences(state.preferences);
  }, [state.preferences]);

  const handleToggleType = (type: NotificationType, enabled: boolean) => {
    const newPreferences = {
      ...preferences,
      enabledTypes: {
        ...preferences.enabledTypes,
        [type]: enabled,
      },
    };
    
    setPreferences(newPreferences);
    actions.updatePreferences(newPreferences);
    onPreferencesChange?.(newPreferences);

    analyticsManager.trackEvent('notification_type_toggled', {
      type,
      enabled,
    });
  };

  const handleToggleQuietHours = (enabled: boolean) => {
    const newPreferences = {
      ...preferences,
      quietHours: enabled ? {
        enabled: true,
        start: formatTime(quietHours.start),
        end: formatTime(quietHours.end),
      } : { enabled: false },
    };
    
    setPreferences(newPreferences);
    actions.updatePreferences(newPreferences);
    onPreferencesChange?.(newPreferences);

    analyticsManager.trackEvent('quiet_hours_toggled', {
      enabled,
      start_time: enabled ? formatTime(quietHours.start) : null,
      end_time: enabled ? formatTime(quietHours.end) : null,
    });
  };

  const handleTimeChange = (type: 'start' | 'end', selectedDate?: Date) => {
    if (!selectedDate) return;

    const newQuietHours = {
      ...quietHours,
      [type]: selectedDate,
    };
    
    setQuietHours(newQuietHours);
    
    if (preferences.quietHours?.enabled) {
      const newPreferences = {
        ...preferences,
        quietHours: {
          enabled: true,
          start: formatTime(newQuietHours.start),
          end: formatTime(newQuietHours.end),
        },
      };
      
      setPreferences(newPreferences);
      actions.updatePreferences(newPreferences);
      onPreferencesChange?.(newPreferences);
    }

    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 5); // HH:MM format
  };

  const getNotificationTypeInfo = (type: NotificationType) => {
    switch (type) {
      case NotificationType.GAME_INVITE:
        return {
          title: 'Invitaciones de juego',
          description: 'Cuando alguien te invite a jugar',
          icon: 'game-controller' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.MATCH_FOUND:
        return {
          title: 'Partidas encontradas',
          description: 'Cuando se encuentre una partida para ti',
          icon: 'search' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.MESSAGE:
        return {
          title: 'Mensajes',
          description: 'Nuevos mensajes en chats',
          icon: 'chatbubble' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.FRIEND_REQUEST:
        return {
          title: 'Solicitudes de amistad',
          description: 'Nuevas solicitudes y aceptaciones',
          icon: 'people' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.POST_LIKE:
        return {
          title: 'Me gusta en posts',
          description: 'Cuando alguien le da me gusta a tus posts',
          icon: 'heart' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.POST_COMMENT:
        return {
          title: 'Comentarios en posts',
          description: 'Nuevos comentarios en tus posts',
          icon: 'chatbubble-ellipses' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.TOURNAMENT_UPDATE:
        return {
          title: 'Actualizaciones de torneos',
          description: 'Cambios en torneos que sigues',
          icon: 'trophy' as keyof typeof Ionicons.glyphMap,
        };
      case NotificationType.SYSTEM:
        return {
          title: 'Notificaciones del sistema',
          description: 'Actualizaciones importantes de la app',
          icon: 'settings' as keyof typeof Ionicons.glyphMap,
        };
      default:
        return {
          title: 'Otras notificaciones',
          description: 'Otras notificaciones de la app',
          icon: 'notifications' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Estás seguro de que quieres restablecer todas las configuraciones de notificaciones a los valores predeterminados?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            const defaultPreferences: NotificationPreferences = {
              enabled: true,
              enabledTypes: {
                [NotificationType.GAME_INVITE]: true,
                [NotificationType.MATCH_FOUND]: true,
                [NotificationType.MESSAGE]: true,
                [NotificationType.FRIEND_REQUEST]: true,
                [NotificationType.POST_LIKE]: false,
                [NotificationType.POST_COMMENT]: true,
                [NotificationType.TOURNAMENT_UPDATE]: true,
                [NotificationType.SYSTEM]: true,
              },
              quietHours: { enabled: false },
            };
            
            setPreferences(defaultPreferences);
            actions.updatePreferences(defaultPreferences);
            onPreferencesChange?.(defaultPreferences);

            analyticsManager.trackEvent('notification_settings_reset', {
              previous_enabled_count: Object.values(preferences.enabledTypes).filter(Boolean).length,
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Configuración general */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración general</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notificaciones push</Text>
              <Text style={styles.settingDescription}>
                Recibir notificaciones en tu dispositivo
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={(enabled) => {
              const newPreferences = { ...preferences, enabled };
              setPreferences(newPreferences);
              actions.updatePreferences(newPreferences);
              onPreferencesChange?.(newPreferences);
              
              analyticsManager.trackEvent('push_notifications_toggled', { enabled });
            }}
            trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
            thumbColor={preferences.enabled ? 'white' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Tipos de notificaciones */}
      {preferences.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de notificaciones</Text>
          
          {Object.values(NotificationType).map((type) => {
            const info = getNotificationTypeInfo(type);
            const isEnabled = preferences.enabledTypes[type] ?? false;
            
            return (
              <View key={type} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Ionicons name={info.icon} size={24} color={isEnabled ? '#007AFF' : '#666'} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{info.title}</Text>
                    <Text style={styles.settingDescription}>{info.description}</Text>
                  </View>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(enabled) => handleToggleType(type, enabled)}
                  trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
                  thumbColor={isEnabled ? 'white' : '#f4f3f4'}
                />
              </View>
            );
          })}
        </View>
      )}

      {/* Horario de silencio */}
      {preferences.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horario de silencio</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name="moon" 
                size={24} 
                color={preferences.quietHours?.enabled ? '#007AFF' : '#666'} 
              />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Activar horario de silencio</Text>
                <Text style={styles.settingDescription}>
                  No recibir notificaciones durante estas horas
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.quietHours?.enabled ?? false}
              onValueChange={handleToggleQuietHours}
              trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
              thumbColor={preferences.quietHours?.enabled ? 'white' : '#f4f3f4'}
            />
          </View>

          {preferences.quietHours?.enabled && (
            <View style={styles.timeRangeContainer}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeLabel}>Desde</Text>
                <Text style={styles.timeValue}>{formatTime(quietHours.start)}</Text>
              </TouchableOpacity>
              
              <Text style={styles.timeSeparator}>hasta</Text>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeLabel}>Hasta</Text>
                <Text style={styles.timeValue}>{formatTime(quietHours.end)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Acciones */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetToDefaults}
        >
          <Ionicons name="refresh" size={20} color="#ff4444" />
          <Text style={styles.resetButtonText}>Restablecer a valores predeterminados</Text>
        </TouchableOpacity>
      </View>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={quietHours.start}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => handleTimeChange('start', selectedDate)}
        />
      )}
      
      {showEndTimePicker && (
        <DateTimePicker
          value={quietHours.end}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => handleTimeChange('end', selectedDate)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  timeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minWidth: 80,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff4444',
    marginLeft: 8,
  },
});

export default NotificationSettings;