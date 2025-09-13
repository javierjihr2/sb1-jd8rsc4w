import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { TournamentType, PubgServer, EntryFeeType, PrizeType } from '../lib/types';
import DateTimePicker from './DateTimePicker';

interface CreateTournamentModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTournament: (tournamentData: any) => void;
}

const PUBG_SERVERS: PubgServer[] = [
  'Asia',
  'Europa', 
  'Norte América',
  'Sur América',
  'Medio Oriente',
  'África',
  'Krjp',
  'India',
  'Vietnam',
  'Tailandia',
  'Singapur',
  'Malasia',
  'Indonesia',
  'Filipinas',
  'Hong Kong',
  'Taiwán',
  'Japón',
  'Corea del Sur',
  'Australia',
  'Nueva Zelanda',
  'Rusia',
  'Turquía',
  'Emiratos Árabes Unidos',
  'Arabia Saudí',
  'Egipto',
  'Sudáfrica',
  'Nigeria',
  'Kenia',
  'Marruecos',
  'Brasil',
  'Argentina',
  'Chile',
  'Colombia',
  'Perú',
  'México',
  'Venezuela',
  'Ecuador',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Estados Unidos Este',
  'Estados Unidos Oeste',
  'Estados Unidos Central',
  'Canadá',
  'Reino Unido',
  'Alemania',
  'Francia',
  'España',
  'Italia',
  'Países Bajos',
  'Suecia',
  'Noruega',
  'Dinamarca',
  'Finlandia',
  'Polonia',
  'República Checa',
  'Hungría',
  'Rumania',
  'Bulgaria',
  'Grecia',
  'Portugal',
  'Suiza',
  'Austria',
  'Bélgica',
  'Irlanda',
  'Ucrania',
  'Bielorrusia',
  'Lituania',
  'Letonia',
  'Estonia'
];

const TOURNAMENT_TYPES: TournamentType[] = [
  'Individual',
  'Dúo',
  'Escuadra'
];

export default function CreateTournamentModal({ 
  visible, 
  onClose, 
  onCreateTournament 
}: CreateTournamentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 16,
    entryFeeType: 'Gratis' as EntryFeeType,
    entryFeeAmount: 0,
    prizeType: 'Sin Premios' as PrizeType,
    prizeAmount: 0,
    tournamentType: 'Escuadra' as TournamentType,
    server: 'Sur América' as PubgServer,
    date: new Date(),
    time: new Date(),
    // Nuevas opciones avanzadas
    chatSettings: {
      enableChat: true,
      allowEmojis: true,
      allowAttachments: true,
      autoModeration: false,
      slowMode: 0, // segundos entre mensajes
      maxMessageLength: 500,
      allowPolls: true,
      allowThreads: true
    },
    moderationSettings: {
      autoMuteSpam: true,
      profanityFilter: true,
      linkFilter: false,
      capsFilter: true,
      duplicateMessageFilter: true,
      maxWarningsBeforeMute: 3
    },
    advancedOptions: {
      allowSpectators: true,
      enableLiveStream: false,
      recordMatches: true,
      enableStatistics: true,
      customRules: '',
      bracketType: 'single-elimination',
      seedingMethod: 'random',
      checkInRequired: true,
      checkInWindow: 30 // minutos antes del inicio
    }
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'chat' | 'moderation' | 'advanced'>('basic');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del torneo es requerido');
      return;
    }

    if (formData.maxParticipants < 2) {
      Alert.alert('Error', 'Debe haber al menos 2 participantes');
      return;
    }

    if (formData.entryFeeType === 'Pago' && formData.entryFeeAmount <= 0) {
      Alert.alert('Error', 'El monto de entrada debe ser mayor a 0');
      return;
    }

    if (formData.prizeType === 'Dinero' && formData.prizeAmount <= 0) {
      Alert.alert('Error', 'El monto del premio debe ser mayor a 0');
      return;
    }

    const tournamentData = {
      ...formData,
      date: formData.date.toISOString().split('T')[0],
      time: formData.time.toTimeString().split(' ')[0].substring(0, 5)
    };

    onCreateTournament(tournamentData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxParticipants: 16,
      entryFeeType: 'Gratis',
      entryFeeAmount: 0,
      prizeType: 'Sin Premios',
      prizeAmount: 0,
      tournamentType: 'Escuadra',
      server: 'Sur América',
      date: new Date(),
      time: new Date(),
      chatSettings: {
        enableChat: true,
        allowEmojis: true,
        allowAttachments: true,
        autoModeration: false,
        slowMode: 0,
        maxMessageLength: 500,
        allowPolls: true,
        allowThreads: true
      },
      moderationSettings: {
        autoMuteSpam: true,
        profanityFilter: true,
        linkFilter: false,
        capsFilter: true,
        duplicateMessageFilter: true,
        maxWarningsBeforeMute: 3
      },
      advancedOptions: {
        allowSpectators: true,
        enableLiveStream: false,
        recordMatches: true,
        enableStatistics: true,
        customRules: '',
        bracketType: 'single-elimination',
        seedingMethod: 'random',
        checkInRequired: true,
        checkInWindow: 30
      }
    });
    setActiveTab('basic');
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, time: selectedTime }));
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
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '600'
            }}>
              Crear Nuevo Torneo
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Pestañas de Navegación */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#374151',
            paddingHorizontal: 4,
            paddingVertical: 4
          }}>
            {[
              { key: 'basic', label: 'Básico', icon: 'information-circle-outline' },
              { key: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
              { key: 'moderation', label: 'Moderación', icon: 'shield-outline' },
              { key: 'advanced', label: 'Avanzado', icon: 'settings-outline' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  backgroundColor: activeTab === tab.key ? '#059669' : 'transparent',
                  borderRadius: 8,
                  marginHorizontal: 2
                }}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeTab === tab.key ? 'white' : '#9ca3af'} 
                  style={{ marginRight: 4 }}
                />
                <Text style={{
                  color: activeTab === tab.key ? 'white' : '#9ca3af',
                  fontSize: 12,
                  fontWeight: activeTab === tab.key ? '600' : '400'
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView 
            style={{ maxHeight: 500 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Contenido de Pestaña Básica */}
            {activeTab === 'basic' && (
              <>
                {/* Nombre del Torneo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Nombre del Torneo *
              </Text>
              <TextInput
                placeholder="Ej: Copa de Verano 2024"
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

            {/* Descripción */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Descripción (Opcional)
              </Text>
              <TextInput
                placeholder="Describe tu torneo..."
                placeholderTextColor="#9ca3af"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  textAlignVertical: 'top'
                }}
              />
            </View>

            {/* Número de Participantes */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Número de Participantes *
              </Text>
              <TextInput
                placeholder="16"
                placeholderTextColor="#9ca3af"
                value={formData.maxParticipants.toString()}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  maxParticipants: parseInt(text) || 16 
                }))}
                keyboardType="numeric"
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16
                }}
              />
            </View>

            {/* Costo de Entrada */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Costo de Entrada *
              </Text>
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <Picker
                  selectedValue={formData.entryFeeType}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    entryFeeType: value,
                    entryFeeAmount: value === 'Gratis' ? 0 : prev.entryFeeAmount
                  }))}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="Gratis" value="Gratis" />
                  <Picker.Item label="Monto en Dinero" value="Pago" />
                </Picker>
              </View>
              
              {formData.entryFeeType === 'Pago' && (
                <TextInput
                  placeholder="Monto en USD"
                  placeholderTextColor="#9ca3af"
                  value={formData.entryFeeAmount.toString()}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    entryFeeAmount: parseFloat(text) || 0 
                  }))}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    marginTop: 8
                  }}
                />
              )}
            </View>

            {/* Premio Total */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Premio Total *
              </Text>
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <Picker
                  selectedValue={formData.prizeType}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    prizeType: value,
                    prizeAmount: value === 'Sin Premios' ? 0 : prev.prizeAmount
                  }))}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="Sin Premios" value="Sin Premios" />
                  <Picker.Item label="Monto en Dinero" value="Dinero" />
                </Picker>
              </View>
              
              {formData.prizeType === 'Dinero' && (
                <TextInput
                  placeholder="Monto en USD"
                  placeholderTextColor="#9ca3af"
                  value={formData.prizeAmount.toString()}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    prizeAmount: parseFloat(text) || 0 
                  }))}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                    marginTop: 8
                  }}
                />
              )}
            </View>

            {/* Tipo de Torneo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Tipo de Torneo *
              </Text>
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <Picker
                  selectedValue={formData.tournamentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tournamentType: value }))}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  {TOURNAMENT_TYPES.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Servidor */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Servidor *
              </Text>
              <View style={{
                backgroundColor: '#374151',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <Picker
                  selectedValue={formData.server}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, server: value }))}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  {PUBG_SERVERS.map(server => (
                    <Picker.Item key={server} label={server} value={server} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Fecha del Torneo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Fecha del Torneo *
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: '#374151',
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {formData.date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Hora del Torneo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Hora del Torneo *
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  backgroundColor: '#374151',
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
              </>
            )}

            {/* Contenido de Pestaña Chat */}
            {activeTab === 'chat' && (
              <>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  Configuración del Chat
                </Text>

                {/* Habilitar Chat */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Habilitar Chat</Text>
                  <Switch
                    value={formData.chatSettings.enableChat}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, enableChat: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.chatSettings.enableChat ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Permitir Emojis */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Permitir Emojis</Text>
                  <Switch
                    value={formData.chatSettings.allowEmojis}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, allowEmojis: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.chatSettings.allowEmojis ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Permitir Archivos Adjuntos */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Permitir Archivos Adjuntos</Text>
                  <Switch
                    value={formData.chatSettings.allowAttachments}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, allowAttachments: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.chatSettings.allowAttachments ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Modo Lento */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Modo Lento (segundos entre mensajes)
                  </Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    value={formData.chatSettings.slowMode.toString()}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, slowMode: parseInt(text) || 0 }
                    }))}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16
                    }}
                  />
                </View>

                {/* Longitud Máxima de Mensaje */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Longitud Máxima de Mensaje
                  </Text>
                  <TextInput
                    placeholder="500"
                    placeholderTextColor="#9ca3af"
                    value={formData.chatSettings.maxMessageLength.toString()}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, maxMessageLength: parseInt(text) || 500 }
                    }))}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16
                    }}
                  />
                </View>

                {/* Permitir Encuestas */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Permitir Encuestas</Text>
                  <Switch
                    value={formData.chatSettings.allowPolls}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      chatSettings: { ...prev.chatSettings, allowPolls: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.chatSettings.allowPolls ? '#10b981' : '#9ca3af'}
                  />
                </View>
              </>
            )}

            {/* Contenido de Pestaña Moderación */}
            {activeTab === 'moderation' && (
              <>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  Configuración de Moderación
                </Text>

                {/* Auto Silenciar Spam */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Auto Silenciar Spam</Text>
                  <Switch
                    value={formData.moderationSettings.autoMuteSpam}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      moderationSettings: { ...prev.moderationSettings, autoMuteSpam: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.moderationSettings.autoMuteSpam ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Filtro de Profanidad */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Filtro de Profanidad</Text>
                  <Switch
                    value={formData.moderationSettings.profanityFilter}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      moderationSettings: { ...prev.moderationSettings, profanityFilter: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.moderationSettings.profanityFilter ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Filtro de Enlaces */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Filtro de Enlaces</Text>
                  <Switch
                    value={formData.moderationSettings.linkFilter}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      moderationSettings: { ...prev.moderationSettings, linkFilter: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.moderationSettings.linkFilter ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Máximo de Advertencias */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Máximo de Advertencias antes de Silenciar
                  </Text>
                  <TextInput
                    placeholder="3"
                    placeholderTextColor="#9ca3af"
                    value={formData.moderationSettings.maxWarningsBeforeMute.toString()}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      moderationSettings: { ...prev.moderationSettings, maxWarningsBeforeMute: parseInt(text) || 3 }
                    }))}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16
                    }}
                  />
                </View>
              </>
            )}

            {/* Contenido de Pestaña Avanzado */}
            {activeTab === 'advanced' && (
              <>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  Opciones Avanzadas
                </Text>

                {/* Permitir Espectadores */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Permitir Espectadores</Text>
                  <Switch
                    value={formData.advancedOptions.allowSpectators}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      advancedOptions: { ...prev.advancedOptions, allowSpectators: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.advancedOptions.allowSpectators ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Grabar Partidas */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>Grabar Partidas</Text>
                  <Switch
                    value={formData.advancedOptions.recordMatches}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      advancedOptions: { ...prev.advancedOptions, recordMatches: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={formData.advancedOptions.recordMatches ? '#10b981' : '#9ca3af'}
                  />
                </View>

                {/* Tipo de Bracket */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Tipo de Bracket
                  </Text>
                  <View style={{ backgroundColor: '#374151', borderRadius: 8 }}>
                    <Picker
                      selectedValue={formData.advancedOptions.bracketType}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        advancedOptions: { ...prev.advancedOptions, bracketType: value }
                      }))}
                      style={{ color: 'white' }}
                      dropdownIconColor="white"
                    >
                      <Picker.Item label="Eliminación Simple" value="single-elimination" />
                      <Picker.Item label="Eliminación Doble" value="double-elimination" />
                      <Picker.Item label="Round Robin" value="round-robin" />
                      <Picker.Item label="Suizo" value="swiss" />
                    </Picker>
                  </View>
                </View>

                {/* Reglas Personalizadas */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Reglas Personalizadas
                  </Text>
                  <TextInput
                    placeholder="Añade reglas específicas para tu torneo..."
                    placeholderTextColor="#9ca3af"
                    value={formData.advancedOptions.customRules}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      advancedOptions: { ...prev.advancedOptions, customRules: text }
                    }))}
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16,
                      textAlignVertical: 'top'
                    }}
                  />
                </View>

                {/* Ventana de Check-in */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                    Ventana de Check-in (minutos antes del inicio)
                  </Text>
                  <TextInput
                    placeholder="30"
                    placeholderTextColor="#9ca3af"
                    value={formData.advancedOptions.checkInWindow.toString()}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      advancedOptions: { ...prev.advancedOptions, checkInWindow: parseInt(text) || 30 }
                    }))}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 16
                    }}
                  />
                </View>
              </>
            )}
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
              style={{
                flex: 1,
                backgroundColor: '#3b82f6',
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
                Crear Torneo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={formData.time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>
    </Modal>
  );
}