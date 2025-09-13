import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { TournamentTeam } from '../lib/types';

interface TeamRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onRegisterTeam: (teamData: Omit<TournamentTeam, 'id' | 'registeredAt' | 'status'>) => void;
  tournamentName: string;
  tournamentType: string;
}

const DEFAULT_FLAGS = [
  { name: 'Argentina', emoji: '🇦🇷', code: 'AR' },
  { name: 'Brasil', emoji: '🇧🇷', code: 'BR' },
  { name: 'Chile', emoji: '🇨🇱', code: 'CL' },
  { name: 'Colombia', emoji: '🇨🇴', code: 'CO' },
  { name: 'Ecuador', emoji: '🇪🇨', code: 'EC' },
  { name: 'México', emoji: '🇲🇽', code: 'MX' },
  { name: 'Perú', emoji: '🇵🇪', code: 'PE' },
  { name: 'Uruguay', emoji: '🇺🇾', code: 'UY' },
  { name: 'Venezuela', emoji: '🇻🇪', code: 'VE' },
  { name: 'España', emoji: '🇪🇸', code: 'ES' },
  { name: 'Estados Unidos', emoji: '🇺🇸', code: 'US' },
  { name: 'Canadá', emoji: '🇨🇦', code: 'CA' }
];

export default function TeamRegistrationModal({ 
  visible, 
  onClose, 
  onRegisterTeam,
  tournamentName,
  tournamentType
}: TeamRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    flag: DEFAULT_FLAGS[0],
    members: [] as string[],
    captain: ''
  });

  const [showFlagPicker, setShowFlagPicker] = useState(false);
  const [customFlagUri, setCustomFlagUri] = useState<string | null>(null);

  const getRequiredMembers = () => {
    switch (tournamentType) {
      case 'Individual': return 1;
      case 'Dúo': return 2;
      case 'Escuadra': return 4;
      default: return 4;
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del equipo es requerido');
      return;
    }

    if (!formData.tag.trim()) {
      Alert.alert('Error', 'El tag del equipo es requerido');
      return;
    }

    if (formData.tag.length > 6) {
      Alert.alert('Error', 'El tag del equipo no puede tener más de 6 caracteres');
      return;
    }

    const requiredMembers = getRequiredMembers();
    if (formData.members.length !== requiredMembers) {
      Alert.alert('Error', `Debes agregar exactamente ${requiredMembers} miembro(s) al equipo`);
      return;
    }

    if (!formData.captain) {
      Alert.alert('Error', 'Debes seleccionar un capitán del equipo');
      return;
    }

    const teamData = {
      name: formData.name.trim(),
      tag: formData.tag.trim().toUpperCase(),
      flag: customFlagUri || `https://flagcdn.com/w40/${formData.flag?.code?.toLowerCase() || 'us'}.png`,
      members: formData.members,
      captain: formData.captain
    };

    onRegisterTeam(teamData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tag: '',
      flag: DEFAULT_FLAGS[0],
      members: [],
      captain: ''
    });
    setCustomFlagUri(null);
  };

  const addMember = () => {
    const requiredMembers = getRequiredMembers();
    if (formData.members.length < requiredMembers) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, '']
      }));
    }
  };

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
      captain: prev.captain === prev.members[index] ? '' : prev.captain
    }));
  };

  const updateMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }));
  };

  const selectCaptain = (member: string) => {
    setFormData(prev => ({ ...prev, captain: member }));
  };

  const pickCustomFlag = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomFlagUri(result.assets[0].uri);
      setShowFlagPicker(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center'
      }}>
        <View style={{
          backgroundColor: '#1f2937',
          margin: 16,
          borderRadius: 12,
          maxHeight: '90%'
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#374151'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '600'
              }}>
                Inscribir Equipo
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 14,
                marginTop: 4
              }}>
                {tournamentName} • {tournamentType}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              accessibilityHint="Cierra el formulario de inscripción de equipo"
            >
              <Ionicons name="close-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ maxHeight: 500 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Nombre del Equipo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Nombre del Equipo *
              </Text>
              <TextInput
                placeholder="Ej: Los Conquistadores"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16
                }}
              />
            </View>

            {/* Tag del Equipo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Tag del Equipo * (máx. 6 caracteres)
              </Text>
              <TextInput
                placeholder="Ej: CONQ"
                placeholderTextColor="#9ca3af"
                value={formData.tag}
                onChangeText={(text) => setFormData(prev => ({ ...prev, tag: text.toUpperCase() }))}
                maxLength={6}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16
                }}
              />
            </View>

            {/* Bandera del Equipo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Bandera del Equipo *
              </Text>
              
              <TouchableOpacity
                onPress={() => setShowFlagPicker(true)}
                style={{
                  backgroundColor: '#374151',
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {customFlagUri ? (
                    <Image 
                      source={{ uri: customFlagUri }} 
                      style={{ width: 24, height: 16, marginRight: 8, borderRadius: 2 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 24, marginRight: 8 }}>
                      {formData.flag.emoji}
                    </Text>
                  )}
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    {customFlagUri ? 'Bandera personalizada' : formData.flag.name}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Miembros del Equipo */}
            <View style={{ marginBottom: 16 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Miembros del Equipo * ({formData.members.length}/{getRequiredMembers()})
                </Text>
                {formData.members.length < getRequiredMembers() && (
                  <TouchableOpacity
                    onPress={addMember}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar miembro"
                    accessibilityHint={`Agrega un nuevo miembro al equipo. Actualmente tienes ${formData.members.length} de ${getRequiredMembers()} miembros`}
                    style={{
                      backgroundColor: '#3b82f6',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="add-outline" size={16} color="white" />
                    <Text style={{ color: 'white', marginLeft: 4, fontSize: 14 }}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {formData.members.map((member, index) => (
                <View key={index} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <TextInput
                    placeholder={`Jugador ${index + 1}`}
                    placeholderTextColor="#9ca3af"
                    value={member}
                    onChangeText={(text) => updateMember(index, text)}
                    accessibilityLabel={`Nombre del jugador ${index + 1}`}
                    accessibilityHint={`Ingresa el nombre del jugador ${index + 1} del equipo`}
                    style={{
                      flex: 1,
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16,
                      marginRight: 8
                    }}
                  />
                  
                  <TouchableOpacity
                    onPress={() => selectCaptain(member)}
                    accessibilityRole="button"
                    accessibilityLabel={formData.captain === member ? "Capitán actual" : "Seleccionar como capitán"}
                    accessibilityHint={formData.captain === member ? `${member} es el capitán actual` : `Toca para hacer a ${member} el capitán del equipo`}
                    style={{
                      backgroundColor: formData.captain === member ? '#fbbf24' : '#6b7280',
                      padding: 8,
                      borderRadius: 6,
                      marginRight: 8
                    }}
                  >
                    <Ionicons 
                      name="star" 
                      size={16} 
                      color={formData.captain === member ? '#1f2937' : 'white'} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => removeMember(index)}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar miembro"
                    accessibilityHint={`Elimina a ${member || `Jugador ${index + 1}`} del equipo`}
                    style={{
                      backgroundColor: '#ef4444',
                      padding: 8,
                      borderRadius: 6
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {formData.captain && (
                <Text style={{
                  color: '#fbbf24',
                  fontSize: 14,
                  marginTop: 4
                }}>
                  Capitán: {formData.captain}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancelar inscripción"
              accessibilityHint="Cancela la inscripción del equipo y cierra el formulario"
              style={{
                flex: 1,
                backgroundColor: '#6b7280',
                padding: 12,
                borderRadius: 8,
                marginRight: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel="Inscribir equipo"
              accessibilityHint={`Inscribe el equipo ${formData.name} en el torneo ${tournamentName}`}
              style={{
                flex: 1,
                backgroundColor: '#10b981',
                padding: 12,
                borderRadius: 8,
                marginLeft: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16
              }}>
                Inscribir Equipo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Flag Picker Modal */}
        <Modal
          visible={showFlagPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFlagPicker(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center'
          }}>
            <View style={{
              backgroundColor: '#1f2937',
              margin: 32,
              borderRadius: 12,
              maxHeight: '70%'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  Seleccionar Bandera
                </Text>
                <TouchableOpacity onPress={() => setShowFlagPicker(false)}>
                  <Ionicons name="close-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ padding: 20 }}>
                {/* Opción de bandera personalizada */}
                <TouchableOpacity
                  onPress={pickCustomFlag}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#374151',
                    borderRadius: 8,
                    marginBottom: 16
                  }}
                >
                  <Ionicons name="image-outline" size={24} color="#3b82f6" />
                  <Text style={{
                    color: '#3b82f6',
                    fontSize: 16,
                    marginLeft: 12,
                    fontWeight: '600'
                  }}>
                    Subir bandera personalizada
                  </Text>
                </TouchableOpacity>
                
                {/* Banderas predefinidas */}
                {DEFAULT_FLAGS.map((flag, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, flag }));
                      setCustomFlagUri(null);
                      setShowFlagPicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      backgroundColor: formData.flag?.code === flag.code ? '#374151' : 'transparent',
                      borderRadius: 8,
                      marginBottom: 8
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {flag.emoji}
                    </Text>
                    <Text style={{ color: 'white', fontSize: 16 }}>
                      {flag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}