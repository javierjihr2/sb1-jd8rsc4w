import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContextSimple';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ValidatedInput } from '../../components/ValidatedInput';
import { useFormValidation, validators, FormValidator } from '../../utils/validation';

interface ProfileField {
  id: string;
  title: string;
  value: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  maxLength?: number;
}

const ProfileSettingsScreen = () => {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{[key: string]: string}>({});

  const [profileFields, setProfileFields] = useState<ProfileField[]>([
    {
      id: 'username',
      title: 'Nombre de Usuario',
      value: profile?.username || '',
      placeholder: 'Ingresa tu nombre de usuario',
      icon: 'person-outline'
    },
    {
      id: 'fullName',
      title: 'Nombre Completo',
      value: profile?.fullName || '',
      placeholder: 'Ingresa tu nombre completo',
      icon: 'card-outline'
    },
    {
      id: 'bio',
      title: 'Biografía',
      value: profile?.bio || '',
      placeholder: 'Cuéntanos sobre ti...',
      icon: 'document-text-outline',
      multiline: true,
      maxLength: 150
    },
    {
      id: 'pubgId',
      title: 'ID de PUBG',
      value: profile?.pubgId || '',
      placeholder: 'Tu ID de PUBG Mobile',
      icon: 'game-controller-outline'
    },
    {
      id: 'country',
      title: 'País',
      value: profile?.country || '',
      placeholder: 'Tu país',
      icon: 'flag-outline'
    }
  ]);

  useEffect(() => {
    if (profile) {
      setProfileFields(prev => prev.map(field => {
        let value = '';
        switch (field.id) {
          case 'username':
            value = profile.username || '';
            break;
          case 'fullName':
            value = profile.fullName || '';
            break;
          case 'bio':
            value = profile.bio || '';
            break;
          case 'pubgId':
            value = profile.pubgId || '';
            break;
          case 'country':
            value = profile.country || '';
            break;
          default:
            value = '';
        }
        return {
          ...field,
          value
        };
      }));
    }
  }, [profile]);

  const handleImagePicker = async (type: 'profile' | 'cover') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la galería para cambiar la imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        await uploadImage(result.assets[0].uri, type);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (uri: string, type: 'profile' | 'cover') => {
    try {
      if (!user?.uid) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const filename = `${type}_${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `users/${user.uid}/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      const updateData = {
        [type === 'profile' ? 'profileImage' : 'coverImage']: downloadURL,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      await updateProfile(updateData);
      
      Alert.alert('Éxito', `Imagen de ${type === 'profile' ? 'perfil' : 'portada'} actualizada`);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    }
  };

  const handleEditField = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    setTempValues({ ...tempValues, [fieldId]: currentValue });
  };

  const handleSaveField = async (fieldId: string) => {
    try {
      if (!user?.uid) return;
      
      const newValue = tempValues[fieldId] || '';
      
      // Validar el campo antes de guardar
      const validationRules = getValidationRules(fieldId);
      const validator = new FormValidator();
      validationRules.forEach(rule => validator.addRule(fieldId, rule));
      
      const validationResult = validator.validate({ [fieldId]: newValue });
      
      if (!validationResult.isValid) {
        Alert.alert('Error de Validación', validationResult.errors.join('\n'));
        return;
      }
      
      setLoading(true);
      
      const updateData = {
        [fieldId]: newValue,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      await updateProfile(updateData);
      
      setProfileFields(prev => prev.map(field => 
        field.id === fieldId ? { ...field, value: newValue } : field
      ));
      
      setEditingField(null);
      setTempValues({});
      
      Alert.alert('Éxito', 'Campo actualizado correctamente');
    } catch (error) {
      console.error('Error updating field:', error);
      Alert.alert('Error', 'No se pudo actualizar el campo');
    } finally {
      setLoading(false);
    }
  };

  const getValidationRules = (fieldId: string) => {
    switch (fieldId) {
      case 'username':
        return [validators.required, validators.username];
      case 'fullName':
        return [validators.required, validators.minLength(2), validators.maxLength(50)];
      case 'bio':
        return [validators.maxLength(150)];
      case 'pubgId':
        return [validators.minLength(3), validators.maxLength(20)];
      case 'country':
        return [validators.required, validators.minLength(2), validators.maxLength(50)];
      default:
        return [];
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Perfil</Text>
      </View>

      {/* Profile Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imágenes de Perfil</Text>
        
        {/* Cover Image */}
        <TouchableOpacity 
          style={styles.coverImageContainer}
          onPress={() => handleImagePicker('cover')}
          disabled={loading}
        >
          <Image 
            source={{ uri: profile?.coverImage || 'https://via.placeholder.com/400x200/1f2937/ffffff?text=Cover' }}
            style={styles.coverImage}
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.imageOverlayText}>Cambiar Portada</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Image */}
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={() => handleImagePicker('profile')}
          disabled={loading}
        >
          <Image 
            source={{ uri: profile?.profileImage || 'https://via.placeholder.com/120x120/3b82f6/ffffff?text=U' }}
            style={styles.profileImage}
          />
          <View style={styles.profileImageOverlay}>
            <Ionicons name="camera" size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Fields Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        {profileFields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldTitleContainer}>
                <Ionicons name={field.icon} size={20} color="#3b82f6" />
                <Text style={styles.fieldTitle}>{field.title}</Text>
              </View>
              
              {editingField === field.id ? (
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleSaveField(field.id)}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark" size={16} color="#10b981" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditField(field.id, field.value)}
                >
                  <Ionicons name="pencil" size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
            
            {editingField === field.id ? (
              <ValidatedInput
                label={field.title}
                value={tempValues[field.id] || ''}
                onChangeText={(text) => setTempValues({ ...tempValues, [field.id]: text })}
                placeholder={field.placeholder}
                rules={getValidationRules(field.id)}
                containerStyle={[styles.input, field.multiline && styles.multilineInput]}
                multiline={field.multiline}
                maxLength={field.maxLength}
                autoFocus
              />
            ) : (
              <Text style={styles.fieldValue}>
                {field.value || field.placeholder}
              </Text>
            )}
            
            {field.maxLength && editingField === field.id && (
              <Text style={styles.characterCount}>
                {(tempValues[field.id] || '').length}/{field.maxLength}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Gaming Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Gaming</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rank || 'Bronze'}</Text>
            <Text style={styles.statLabel}>Rango</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.kd?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>K/D</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.wins || '0'}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.matches || '0'}</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1e293b',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  coverImageContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  profileImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: -60,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 4,
  },
  fieldContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
  },
  saveButton: {
    backgroundColor: '#f0fdf4',
  },
  editButton: {
    padding: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default ProfileSettingsScreen;