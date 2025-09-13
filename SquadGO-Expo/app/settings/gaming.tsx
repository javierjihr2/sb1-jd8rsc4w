import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface GamePreference {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  playtime: 'casual' | 'regular' | 'hardcore';
}

interface GamingSettings {
  autoMatchmaking: boolean;
  showOnlineStatus: boolean;
  allowGameInvites: boolean;
  preferredGameModes: string[];
  availabilityStatus: 'available' | 'busy' | 'away' | 'offline';
  skillLevelVisibility: boolean;
  statsVisibility: 'public' | 'friends' | 'private';
  voiceChatEnabled: boolean;
}

const GamingSettingsScreen = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gamePreferences, setGamePreferences] = useState<GamePreference[]>([
    {
      id: 'pubg-mobile',
      name: 'PUBG Mobile',
      icon: 'game-controller',
      enabled: true,
      skillLevel: 'intermediate',
      playtime: 'regular'
    }
  ]);
  
  const [gamingSettings, setGamingSettings] = useState<GamingSettings>({
    autoMatchmaking: true,
    showOnlineStatus: true,
    allowGameInvites: true,
    preferredGameModes: ['classic', 'ranked'],
    availabilityStatus: 'available',
    skillLevelVisibility: true,
    statsVisibility: 'friends',
    voiceChatEnabled: true
  });

  const availabilityOptions = [
    { id: 'available', label: 'Disponible', color: '#34C759', icon: 'checkmark-circle' },
    { id: 'busy', label: 'Ocupado', color: '#FF9500', icon: 'time' },
    { id: 'away', label: 'Ausente', color: '#FF9500', icon: 'moon' },
    { id: 'offline', label: 'Desconectado', color: '#8E8E93', icon: 'power' }
  ];

  const skillLevels = [
    { id: 'beginner', label: 'Bronce-Plata', color: '#CD7F32' },
    { id: 'intermediate', label: 'Oro-Platino', color: '#FFD700' },
    { id: 'advanced', label: 'Diamante-Corona', color: '#007AFF' },
    { id: 'expert', label: 'As-Conquistador', color: '#AF52DE' }
  ];

  const playtimeOptions = [
    { id: 'casual', label: 'Casual', description: '1-2 horas por día' },
    { id: 'regular', label: 'Regular', description: '2-4 horas por día' },
    { id: 'hardcore', label: 'Hardcore', description: '4+ horas por día' }
  ];

  const gameModes = [
    'classic', 'ranked', 'arcade', 'evoground', 'metro-royale', 'arena'
  ];

  useEffect(() => {
    loadGamingSettings();
  }, []);

  const loadGamingSettings = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.gamePreferences) {
          setGamePreferences(userData.gamePreferences);
        }
        
        if (userData.gamingSettings) {
          setGamingSettings(userData.gamingSettings);
        }
      }
    } catch (error) {
      console.error('Error loading gaming settings:', error);
    }
  };

  const saveGamingSettings = async (newSettings: Partial<GamingSettings>) => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const updatedSettings = { ...gamingSettings, ...newSettings };
      setGamingSettings(updatedSettings);
      
      await updateDoc(doc(db, 'users', user.uid), {
        gamingSettings: updatedSettings,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving gaming settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveGamePreferences = async (newPreferences: GamePreference[]) => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      setGamePreferences(newPreferences);
      
      await updateDoc(doc(db, 'users', user.uid), {
        gamePreferences: newPreferences,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving game preferences:', error);
      Alert.alert('Error', 'No se pudo guardar las preferencias de juegos');
    } finally {
      setLoading(false);
    }
  };

  const toggleGamePreference = (gameId: string) => {
    const updatedPreferences = gamePreferences.map(game => 
      game.id === gameId ? { ...game, enabled: !game.enabled } : game
    );
    saveGamePreferences(updatedPreferences);
  };

  const updateGameSkillLevel = (gameId: string, skillLevel: GamePreference['skillLevel']) => {
    const updatedPreferences = gamePreferences.map(game => 
      game.id === gameId ? { ...game, skillLevel } : game
    );
    saveGamePreferences(updatedPreferences);
  };

  const updateGamePlaytime = (gameId: string, playtime: GamePreference['playtime']) => {
    const updatedPreferences = gamePreferences.map(game => 
      game.id === gameId ? { ...game, playtime } : game
    );
    saveGamePreferences(updatedPreferences);
  };

  const toggleGameMode = (mode: string) => {
    const currentModes = gamingSettings.preferredGameModes;
    const updatedModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    
    saveGamingSettings({ preferredGameModes: updatedModes });
  };

  const renderGamePreference = ({ item }: { item: GamePreference }) => {
    const skillLevel = skillLevels.find(s => s.id === item.skillLevel);
    const playtime = playtimeOptions.find(p => p.id === item.playtime);
    
    return (
      <View style={styles.gameItem}>
        <View style={styles.gameHeader}>
          <View style={styles.gameLeft}>
            <Ionicons name={item.icon} size={24} color={item.enabled ? '#007AFF' : '#8E8E93'} />
            <Text style={[styles.gameName, !item.enabled && { color: '#8E8E93' }]}>
              {item.name}
            </Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleGamePreference(item.id)}
            disabled={loading}
            trackColor={{ false: '#E5E5EA', true: '#007AFF40' }}
            thumbColor={item.enabled ? '#007AFF' : '#FFFFFF'}
          />
        </View>
        
        {item.enabled && (
          <View style={styles.gameDetails}>
            <View style={styles.gameDetailRow}>
              <Text style={styles.detailLabel}>Nivel de habilidad:</Text>
              <View style={styles.skillLevelContainer}>
                {skillLevels.map(level => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.skillLevelOption,
                      item.skillLevel === level.id && { backgroundColor: level.color }
                    ]}
                    onPress={() => updateGameSkillLevel(item.id, level.id as GamePreference['skillLevel'])}
                  >
                    <Text style={[
                      styles.skillLevelText,
                      item.skillLevel === level.id && { color: '#FFFFFF' }
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.gameDetailRow}>
              <Text style={styles.detailLabel}>Tiempo de juego:</Text>
              <View style={styles.playtimeContainer}>
                {playtimeOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.playtimeOption,
                      item.playtime === option.id && styles.selectedPlaytime
                    ]}
                    onPress={() => updateGamePlaytime(item.id, option.id as GamePreference['playtime'])}
                  >
                    <Text style={[
                      styles.playtimeText,
                      item.playtime === option.id && styles.selectedPlaytimeText
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.playtimeDescription,
                      item.playtime === option.id && styles.selectedPlaytimeDescription
                    ]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Configuración PUBG Mobile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Availability Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Disponibilidad</Text>
          <View style={styles.availabilityContainer}>
            {availabilityOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.availabilityOption,
                  gamingSettings.availabilityStatus === option.id && {
                    backgroundColor: option.color + '20',
                    borderColor: option.color
                  }
                ]}
                onPress={() => saveGamingSettings({ availabilityStatus: option.id as GamingSettings['availabilityStatus'] })}
              >
                <Ionicons 
                  name={option.icon as keyof typeof Ionicons.glyphMap} 
                  size={20} 
                  color={gamingSettings.availabilityStatus === option.id ? option.color : '#8E8E93'} 
                />
                <Text style={[
                  styles.availabilityText,
                  gamingSettings.availabilityStatus === option.id && { color: option.color }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* General Gaming Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración General</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="search-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Matchmaking Automático</Text>
                <Text style={styles.settingDescription}>Buscar partidas de PUBG Mobile automáticamente</Text>
              </View>
            </View>
            <Switch
              value={gamingSettings.autoMatchmaking}
              onValueChange={(value) => saveGamingSettings({ autoMatchmaking: value })}
              disabled={loading}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Mostrar Estado en Línea</Text>
                <Text style={styles.settingDescription}>Otros pueden ver cuando estás conectado</Text>
              </View>
            </View>
            <Switch
              value={gamingSettings.showOnlineStatus}
              onValueChange={(value) => saveGamingSettings({ showOnlineStatus: value })}
              disabled={loading}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Permitir Invitaciones</Text>
                <Text style={styles.settingDescription}>Recibir invitaciones de juego</Text>
              </View>
            </View>
            <Switch
              value={gamingSettings.allowGameInvites}
              onValueChange={(value) => saveGamingSettings({ allowGameInvites: value })}
              disabled={loading}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mic-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Chat de Voz</Text>
                <Text style={styles.settingDescription}>Habilitar comunicación por voz</Text>
              </View>
            </View>
            <Switch
              value={gamingSettings.voiceChatEnabled}
              onValueChange={(value) => saveGamingSettings({ voiceChatEnabled: value })}
              disabled={loading}
            />
          </View>
          

        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="bar-chart-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Mostrar Rango</Text>
                <Text style={styles.settingDescription}>Otros pueden ver tu rango de PUBG Mobile</Text>
              </View>
            </View>
            <Switch
              value={gamingSettings.skillLevelVisibility}
              onValueChange={(value) => saveGamingSettings({ skillLevelVisibility: value })}
              disabled={loading}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="stats-chart-outline" size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Visibilidad de Estadísticas</Text>
                <Text style={styles.settingDescription}>
                  {gamingSettings.statsVisibility === 'public' && 'Público'}
                  {gamingSettings.statsVisibility === 'friends' && 'Solo amigos'}
                  {gamingSettings.statsVisibility === 'private' && 'Privado'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Preferred Game Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modos de Juego Preferidos</Text>
          <View style={styles.gameModesContainer}>
            {gameModes.map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.gameModeOption,
                  gamingSettings.preferredGameModes.includes(mode) && styles.selectedGameMode
                ]}
                onPress={() => toggleGameMode(mode)}
              >
                <Text style={[
                  styles.gameModeText,
                  gamingSettings.preferredGameModes.includes(mode) && styles.selectedGameModeText
                ]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Game Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Juegos Favoritos</Text>
          <FlatList
            data={gamePreferences}
            renderItem={renderGamePreference}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  placeholder: {
    width: 40
  },
  content: {
    flex: 1
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
  availabilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: 100
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#000000'
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
    flex: 1
  },
  settingText: {
    flex: 1,
    marginLeft: 12
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
  gameModesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8
  },
  gameModeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  selectedGameMode: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  gameModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000'
  },
  selectedGameModeText: {
    color: '#FFFFFF'
  },
  gameItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden'
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  gameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  gameName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 12
  },
  gameDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7'
  },
  gameDetailRow: {
    marginBottom: 16
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 8
  },
  skillLevelOption: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  skillLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000'
  },
  playtimeContainer: {
    gap: 8
  },
  playtimeOption: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  selectedPlaytime: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF'
  },
  playtimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2
  },
  selectedPlaytimeText: {
    color: '#007AFF'
  },
  playtimeDescription: {
    fontSize: 12,
    color: '#8E8E93'
  },
  selectedPlaytimeDescription: {
    color: '#007AFF'
  }
});

export default GamingSettingsScreen;