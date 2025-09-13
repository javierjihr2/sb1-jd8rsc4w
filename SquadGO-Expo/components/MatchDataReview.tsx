import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContextSimple';
import { useLanguage } from '../contexts/LanguageContext';
import { PubgServer } from '../lib/types';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { SwipeableModal } from './EnhancedGestures';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface MatchDataReviewProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const PUBG_SERVERS: PubgServer[] = [
  'Asia', 'Japón', 'Corea del Sur', 'Singapur', 'Malasia', 'Indonesia',
  'Filipinas', 'Hong Kong', 'Taiwán', 'Tailandia', 'Vietnam', 'India',
  'Europa', 'Reino Unido', 'Alemania', 'Francia', 'España', 'Italia',
  'Países Bajos', 'Suecia', 'Noruega', 'Dinamarca', 'Finlandia',
  'Polonia', 'República Checa', 'Hungría', 'Rumania', 'Bulgaria',
  'Grecia', 'Portugal', 'Suiza', 'Austria', 'Bélgica', 'Irlanda',
  'Ucrania', 'Bielorrusia', 'Lituania', 'Letonia', 'Estonia', 'Rusia',
  'Turquía', 'Norte América', 'Estados Unidos Este', 'Estados Unidos Oeste',
  'Estados Unidos Central', 'Canadá', 'Sur América', 'Brasil', 'Argentina',
  'Chile', 'Colombia', 'Perú', 'México', 'Venezuela', 'Ecuador',
  'Uruguay', 'Paraguay', 'Bolivia', 'Medio Oriente', 'Emiratos Árabes Unidos',
  'Arabia Saudí', 'África', 'Egipto', 'Sudáfrica', 'Nigeria', 'Kenia',
  'Marruecos', 'Krjp', 'Australia', 'Nueva Zelanda'
];

const GAME_PREFERENCES = [
  'solo', 'duo', 'squad', 'rooms', 'scrims', 'competitive', 'casual', 'ranked'
];

export const MatchDataReview: React.FC<MatchDataReviewProps> = ({
  visible,
  onClose,
  onComplete
}) => {
  const { profile, updateMatchData, addMatchPhoto, removeMatchPhoto } = useAuth();
  const { t } = useLanguage();
  const { isTablet } = useDeviceInfo();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    pubgId: '',
    currentServer: '',
    gamePreferences: [] as string[]
  });
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [showPreferencesPicker, setShowPreferencesPicker] = useState(false);

  useEffect(() => {
    if (profile && visible) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        pubgId: profile.pubgId || '',
        currentServer: profile.currentServer || '',
        gamePreferences: profile.gamePreferences || []
      });
    }
  }, [profile, visible]);

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validaciones
      if (!formData.name.trim()) {
        Alert.alert(t('common.error'), t('profile.nameRequired'));
        return;
      }

      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18) {
        Alert.alert(t('common.error'), t('profile.mustBe18'));
        return;
      }

      if (!formData.pubgId.trim()) {
        Alert.alert(t('common.error'), t('profile.pubgIdRequired'));
        return;
      }

      if (!formData.currentServer) {
        Alert.alert(t('common.error'), t('servers.serverRequired'));
        return;
      }

      if (formData.gamePreferences.length === 0) {
        Alert.alert(t('common.error'), t('profile.gamePreferencesRequired'));
        return;
      }

      await updateMatchData({
        name: formData.name.trim(),
        age: age,
        pubgId: formData.pubgId.trim(),
        currentServer: formData.currentServer,
        gamePreferences: formData.gamePreferences
      });

      Alert.alert(
        t('common.success'),
        t('match.dataUpdatedSuccessfully'),
        [{ text: t('common.confirm'), onPress: onComplete }]
      );
    } catch (error) {
      console.error('Error updating match data:', error);
      Alert.alert(t('common.error'), t('match.updateDataError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await addMatchPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert(t('common.error'), t('profile.addPhotoError'));
    }
  };

  const handleRemovePhoto = async (photoUri: string) => {
    try {
      await removeMatchPhoto(photoUri);
    } catch (error) {
      console.error('Error removing photo:', error);
      Alert.alert(t('common.error'), t('profile.removePhotoError'));
    }
  };

  const toggleGamePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      gamePreferences: prev.gamePreferences.includes(preference)
        ? prev.gamePreferences.filter(p => p !== preference)
        : [...prev.gamePreferences, preference]
    }));
  };

  if (!visible) return null;

  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      swipeDirection="down"
      swipeThreshold={isTablet ? 120 : 80}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('match.reviewData')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            {t('match.dataReviewRequired')}
          </Text>

          {/* Nombre */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.name')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={t('profile.enterName')}
              maxLength={50}
            />
          </View>

          {/* Edad */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.age')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
              placeholder="18+"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.ageWarning}>{t('profile.mustBe18')}</Text>
          </View>

          {/* PUBG Mobile ID */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.pubgId')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.pubgId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pubgId: text }))}
              placeholder={t('profile.enterPubgId')}
              maxLength={20}
            />
          </View>

          {/* Servidor */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.server')} *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowServerPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.currentServer && styles.placeholder]}>
                {formData.currentServer || t('servers.selectServer')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Preferencias de juego */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.gamePreferences')} *</Text>
            <View style={styles.preferencesContainer}>
              {GAME_PREFERENCES.map((preference) => (
                <TouchableOpacity
                  key={preference}
                  style={[
                    styles.preferenceChip,
                    formData.gamePreferences.includes(preference) && styles.preferenceChipSelected
                  ]}
                  onPress={() => toggleGamePreference(preference)}
                >
                  <Text style={[
                    styles.preferenceChipText,
                    formData.gamePreferences.includes(preference) && styles.preferenceChipTextSelected
                  ]}>
                    {t(`gamePreferences.${preference}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fotos para Match */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.photos')} ({profile?.matchPhotos?.length || 0}/6)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
              {profile?.matchPhotos?.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(photo)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {(profile?.matchPhotos?.length || 0) < 6 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <Ionicons name="add" size={30} color="#666" />
                  <Text style={styles.addPhotoText}>{t('profile.addPhoto')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Server Picker Modal */}
        <Modal
          visible={showServerPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowServerPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowServerPicker(false)}>
                  <Text style={styles.pickerCancel}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>{t('servers.selectServer')}</Text>
                <TouchableOpacity onPress={() => setShowServerPicker(false)}>
                  <Text style={styles.pickerDone}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={formData.currentServer}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currentServer: value }))}
                style={styles.picker}
              >
                <Picker.Item label={t('servers.selectServer')} value="" />
                {PUBG_SERVERS.map((server) => (
                  <Picker.Item key={server} label={server} value={server} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </View>
    </SwipeableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  ageWarning: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  preferenceChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  preferenceChipText: {
    fontSize: 14,
    color: '#333',
  },
  preferenceChipTextSelected: {
    color: '#fff',
  },
  photosContainer: {
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pickerDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});