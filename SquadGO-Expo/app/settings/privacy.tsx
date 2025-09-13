import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const PrivacySettingsScreen = () => {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'publicProfile',
      title: 'Perfil Público',
      description: 'Permite que otros usuarios vean tu perfil completo',
      value: true,
      icon: 'eye-outline'
    },
    {
      id: 'showOnlineStatus',
      title: 'Estado en Línea',
      description: 'Muestra cuando estás conectado a otros usuarios',
      value: true,
      icon: 'radio-outline'
    },
    {
      id: 'allowFriendRequests',
      title: 'Solicitudes de Amistad',
      description: 'Permite que otros usuarios te envíen solicitudes de amistad',
      value: true,
      icon: 'people-outline'
    },
    {
      id: 'showGamingStats',
      title: 'Estadísticas de Gaming',
      description: 'Muestra tus estadísticas de juegos en tu perfil',
      value: true,
      icon: 'stats-chart-outline'
    },
    {
      id: 'allowTeamInvites',
      title: 'Invitaciones a Equipos',
      description: 'Permite que otros te inviten a sus equipos',
      value: true,
      icon: 'shield-outline'
    },
    {
      id: 'showRecentActivity',
      title: 'Actividad Reciente',
      description: 'Muestra tu actividad reciente en tu perfil',
      value: false,
      icon: 'time-outline'
    },
    {
      id: 'allowPostComments',
      title: 'Comentarios en Posts',
      description: 'Permite que otros comenten en tus publicaciones',
      value: true,
      icon: 'chatbubble-outline'
    },
    {
      id: 'showLocation',
      title: 'Ubicación',
      description: 'Muestra tu ubicación aproximada para matchmaking',
      value: false,
      icon: 'location-outline'
    },
    {
      id: 'allowDirectMessages',
      title: 'Mensajes Directos',
      description: 'Permite que otros usuarios te envíen mensajes privados',
      value: true,
      icon: 'mail-outline'
    },
    {
      id: 'searchableByEmail',
      title: 'Búsqueda por Email',
      description: 'Permite que otros te encuentren usando tu email',
      value: false,
      icon: 'search-outline'
    }
  ]);

  useEffect(() => {
    // Cargar configuraciones desde el perfil del usuario
    if (profile?.privacySettings) {
      setSettings(prevSettings => 
        prevSettings.map(setting => ({
          ...setting,
          value: profile.privacySettings?.[setting.id] ?? setting.value
        }))
      );
    }
  }, [profile]);

  const handleToggleSetting = async (settingId: string, newValue: boolean) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Actualizar estado local
      setSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.id === settingId 
            ? { ...setting, value: newValue }
            : setting
        )
      );

      // Actualizar en Firebase
      const updatedPrivacySettings = {
        ...profile?.privacySettings,
        [settingId]: newValue
      };

      await updateDoc(doc(db, 'users', user.uid), {
        privacySettings: updatedPrivacySettings,
        updatedAt: new Date()
      });

      // Actualizar contexto local
      await updateProfile({ privacySettings: updatedPrivacySettings });

    } catch (error) {
      console.error('Error updating privacy setting:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar la configuración. Inténtalo de nuevo.'
      );
      
      // Revertir cambio local en caso de error
      setSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.id === settingId 
            ? { ...setting, value: !newValue }
            : setting
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Estás seguro de que quieres restablecer todas las configuraciones de privacidad a los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            
            setLoading(true);
            try {
              const defaultSettings = {
                publicProfile: true,
                showOnlineStatus: true,
                allowFriendRequests: true,
                showGamingStats: true,
                allowTeamInvites: true,
                showRecentActivity: false,
                allowPostComments: true,
                showLocation: false,
                allowDirectMessages: true,
                searchableByEmail: false
              };

              await updateDoc(doc(db, 'users', user.uid), {
                privacySettings: defaultSettings,
                updatedAt: new Date()
              });

              await updateProfile({ privacySettings: defaultSettings });

              setSettings(prevSettings => 
                prevSettings.map(setting => ({
                  ...setting,
                  value: defaultSettings[setting.id as keyof typeof defaultSettings] ?? setting.value
                }))
              );

              Alert.alert('Éxito', 'Configuración restablecida correctamente');
            } catch (error) {
              console.error('Error resetting privacy settings:', error);
              Alert.alert('Error', 'No se pudo restablecer la configuración');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Privacidad</Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetToDefaults}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>Restablecer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Controla quién puede ver tu información y cómo interactúan contigo otros usuarios en SquadGO.
          </Text>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Privacidad</Text>
          {settings.map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={setting.icon} 
                    size={20} 
                    color="#007AFF" 
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={(newValue) => handleToggleSetting(setting.id, newValue)}
                disabled={loading}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor={setting.value ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          ))}
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.infoTitle}>Información Importante</Text>
            <Text style={styles.infoText}>
              • Algunas configuraciones pueden afectar tu experiencia de matchmaking{"\n"}
              • Los cambios se aplican inmediatamente{"\n"}
              • Puedes cambiar estas configuraciones en cualquier momento
            </Text>
          </View>
        </View>
      </ScrollView>
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
  resetButton: {
    padding: 8
  },
  resetButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500'
  },
  content: {
    flex: 1
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16
  },
  descriptionText: {
    fontSize: 14,
    color: '#8E8E93',
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
  settingItem: {
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16
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
  settingText: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18
  },
  infoSection: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 40
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20
  }
});

export default PrivacySettingsScreen;