import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Tournament, 
  TournamentRole, 
  TournamentChannel, 
  TournamentSettings,
  TournamentPermission
} from '../lib/types';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

interface AdvancedTournamentCreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreateTournament: (tournament: Partial<Tournament>) => void;
}

const AdvancedTournamentCreator: React.FC<AdvancedTournamentCreatorProps> = ({
  visible,
  onClose,
  onCreateTournament
}) => {
  const { isTablet } = useDeviceInfo();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados para la configuración básica
  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('32');
  const [entryFee, setEntryFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [tournamentType, setTournamentType] = useState<'Solo' | 'Dúo' | 'Escuadra'>('Escuadra');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  
  // Estados para configuración Discord-like
  const [rules, setRules] = useState<string[]>(['']);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [autoCreateChannels, setAutoCreateChannels] = useState(true);
  const [autoAssignRoles, setAutoAssignRoles] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  const [moderationLevel, setModerationLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoModeration, setAutoModeration] = useState(false);
  
  // Estados para roles personalizados
  const [customRoles, setCustomRoles] = useState<Partial<TournamentRole>[]>([]);
  const [customChannels, setCustomChannels] = useState<Partial<TournamentChannel>[]>([]);
  
  const steps = [
    'Información Básica',
    'Configuración Discord',
    'Roles y Permisos',
    'Canales',
    'Reglas y Moderación',
    'Revisión Final'
  ];

  const defaultRoles: TournamentRole[] = [
    {
      id: 'organizer',
      name: 'Organizador',
      color: '#ff6b6b',
      permissions: [
        'VIEW_CHANNELS', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS',
        'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
        'USE_EXTERNAL_EMOJIS', 'MANAGE_CHANNELS', 'KICK_MEMBERS',
        'BAN_MEMBERS', 'MANAGE_ROLES', 'MANAGE_TOURNAMENT', 'VIEW_AUDIT_LOG'
      ] as TournamentPermission[],
      position: 0,
      mentionable: true,
      isDefault: true,
      assignedUsers: []
    },
    {
      id: 'moderator',
      name: 'Moderador',
      color: '#4ecdc4',
      permissions: [
        'VIEW_CHANNELS', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS',
        'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
        'KICK_MEMBERS', 'MUTE_MEMBERS'
      ] as TournamentPermission[],
      position: 1,
      mentionable: true,
      isDefault: true,
      assignedUsers: []
    },
    {
      id: 'participant',
      name: 'Participante',
      color: '#45b7d1',
      permissions: [
        'VIEW_CHANNELS', 'SEND_MESSAGES', 'EMBED_LINKS',
        'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS'
      ] as TournamentPermission[],
      position: 2,
      mentionable: true,
      isDefault: true,
      assignedUsers: []
    },
    {
      id: 'spectator',
      name: 'Espectador',
      color: '#96ceb4',
      permissions: [
        'VIEW_CHANNELS', 'READ_MESSAGE_HISTORY'
      ] as TournamentPermission[],
      position: 3,
      mentionable: false,
      isDefault: true,
      assignedUsers: []
    }
  ];

  const defaultChannels: TournamentChannel[] = [
    {
      id: 'announcements',
      name: 'anuncios',
      type: 'announcement',
      description: 'Anuncios oficiales del torneo',
      position: 0,
      permissions: [],
      isDefault: true,
      autoCreated: true
    },
    {
      id: 'rules',
      name: 'reglas',
      type: 'rules',
      description: 'Reglas del torneo',
      position: 1,
      permissions: [],
      isDefault: true,
      autoCreated: true
    },
    {
      id: 'general',
      name: 'general',
      type: 'general',
      description: 'Chat general del torneo',
      position: 2,
      permissions: [],
      isDefault: true,
      autoCreated: true
    },
    {
      id: 'team-formation',
      name: 'formación-equipos',
      type: 'text',
      description: 'Canal para formar equipos',
      position: 3,
      permissions: [],
      isDefault: true,
      autoCreated: true
    }
  ];

  const addRule = () => {
    setRules([...rules, '']);
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleCreateTournament = () => {
    const settings: TournamentSettings = {
      autoCreateChannels,
      autoAssignRoles,
      allowInvites,
      moderationLevel,
      autoModeration,
      welcomeMessage: welcomeMessage || undefined,
      rulesChannelId: 'rules',
      announcementsChannelId: 'announcements',
      generalChannelId: 'general'
    };

    const tournament: Partial<Tournament> = {
      name: tournamentName,
      description,
      maxParticipants: parseInt(maxParticipants),
      tournamentType: tournamentType as any,
      date: startDate,
      time: startTime,
      roles: [...defaultRoles, ...customRoles as TournamentRole[]],
      channels: [...defaultChannels, ...customChannels as TournamentChannel[]],
      rules: rules.filter(rule => rule.trim() !== ''),
      settings,
      tickets: [],
      invites: [],
      announcements: [],
      moderators: [],
      bannedUsers: [],
      mutedUsers: []
    };

    onCreateTournament(tournament);
    onClose();
  };

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isTablet ? 20 : 16,
      paddingHorizontal: isTablet ? 24 : 16
    }}>
      {steps.map((step, index) => (
        <View key={index} style={{ alignItems: 'center', flex: 1 }}>
          <View style={{
            width: isTablet ? 32 : 24,
            height: isTablet ? 32 : 24,
            borderRadius: isTablet ? 16 : 12,
            backgroundColor: index <= currentStep ? '#4f46e5' : '#374151',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: isTablet ? 8 : 6
          }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 14 : 12,
              fontWeight: 'bold'
            }}>
              {index + 1}
            </Text>
          </View>
          <Text style={{
            color: index <= currentStep ? '#4f46e5' : '#9ca3af',
            fontSize: isTablet ? 12 : 10,
            textAlign: 'center',
            fontWeight: index === currentStep ? '600' : '400'
          }}>
            {step}
          </Text>
          {index < steps.length - 1 && (
            <View style={{
              position: 'absolute',
              top: isTablet ? 16 : 12,
              left: '60%',
              width: '80%',
              height: 2,
              backgroundColor: index < currentStep ? '#4f46e5' : '#374151'
            }} />
          )}
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
      <Text style={{
        color: 'white',
        fontSize: isTablet ? 24 : 20,
        fontWeight: 'bold',
        marginBottom: isTablet ? 24 : 20,
        textAlign: 'center'
      }}>
        Información Básica del Torneo
      </Text>

      {/* Nombre del torneo */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Nombre del Torneo *
        </Text>
        <TextInput
          style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: isTablet ? 16 : 12,
            borderRadius: isTablet ? 10 : 8,
            fontSize: isTablet ? 16 : 14
          }}
          placeholder="Ej: Copa de Campeones PUBG"
          placeholderTextColor="#9ca3af"
          value={tournamentName}
          onChangeText={setTournamentName}
        />
      </View>

      {/* Descripción */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Descripción
        </Text>
        <TextInput
          style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: isTablet ? 16 : 12,
            borderRadius: isTablet ? 10 : 8,
            fontSize: isTablet ? 16 : 14,
            height: isTablet ? 100 : 80,
            textAlignVertical: 'top'
          }}
          placeholder="Describe tu torneo..."
          placeholderTextColor="#9ca3af"
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Máximo de participantes */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Máximo de Participantes *
        </Text>
        <TextInput
          style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: isTablet ? 16 : 12,
            borderRadius: isTablet ? 10 : 8,
            fontSize: isTablet ? 16 : 14
          }}
          placeholder="32"
          placeholderTextColor="#9ca3af"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="numeric"
        />
      </View>

      {/* Tipo de torneo */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Tipo de Torneo *
        </Text>
        <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
          {['Solo', 'Dúo', 'Escuadra'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setTournamentType(type as any)}
              style={{
                flex: 1,
                backgroundColor: tournamentType === type ? '#4f46e5' : '#374151',
                padding: isTablet ? 16 : 12,
                borderRadius: isTablet ? 10 : 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: tournamentType === type ? '600' : '400'
              }}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fecha y hora */}
      <View style={{ flexDirection: 'row', gap: isTablet ? 16 : 12, marginBottom: isTablet ? 20 : 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: '600',
            marginBottom: isTablet ? 8 : 6
          }}>
            Fecha de Inicio *
          </Text>
          <TextInput
            style={{
              backgroundColor: '#374151',
              color: 'white',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 10 : 8,
              fontSize: isTablet ? 16 : 14
            }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#9ca3af"
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: '600',
            marginBottom: isTablet ? 8 : 6
          }}>
            Hora de Inicio *
          </Text>
          <TextInput
            style={{
              backgroundColor: '#374151',
              color: 'white',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 10 : 8,
              fontSize: isTablet ? 16 : 14
            }}
            placeholder="HH:MM"
            placeholderTextColor="#9ca3af"
            value={startTime}
            onChangeText={setStartTime}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderDiscordConfig = () => (
    <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
      <Text style={{
        color: 'white',
        fontSize: isTablet ? 24 : 20,
        fontWeight: 'bold',
        marginBottom: isTablet ? 24 : 20,
        textAlign: 'center'
      }}>
        Configuración Discord
      </Text>

      {/* Mensaje de bienvenida */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Mensaje de Bienvenida
        </Text>
        <TextInput
          style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: isTablet ? 16 : 12,
            borderRadius: isTablet ? 10 : 8,
            fontSize: isTablet ? 16 : 14,
            height: isTablet ? 80 : 60,
            textAlignVertical: 'top'
          }}
          placeholder="¡Bienvenido al torneo! Lee las reglas y diviértete."
          placeholderTextColor="#9ca3af"
          multiline
          value={welcomeMessage}
          onChangeText={setWelcomeMessage}
        />
      </View>

      {/* Configuraciones automáticas */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 18 : 16,
          fontWeight: '600',
          marginBottom: isTablet ? 16 : 12
        }}>
          Configuraciones Automáticas
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isTablet ? 16 : 12,
          backgroundColor: '#374151',
          padding: isTablet ? 16 : 12,
          borderRadius: isTablet ? 10 : 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '500'
            }}>
              Crear Canales Automáticamente
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginTop: 4
            }}>
              Crea canales básicos al iniciar el torneo
            </Text>
          </View>
          <Switch
            value={autoCreateChannels}
            onValueChange={setAutoCreateChannels}
            trackColor={{ false: '#6b7280', true: '#4f46e5' }}
            thumbColor={autoCreateChannels ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isTablet ? 16 : 12,
          backgroundColor: '#374151',
          padding: isTablet ? 16 : 12,
          borderRadius: isTablet ? 10 : 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '500'
            }}>
              Asignar Roles Automáticamente
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginTop: 4
            }}>
              Asigna roles según el tipo de participación
            </Text>
          </View>
          <Switch
            value={autoAssignRoles}
            onValueChange={setAutoAssignRoles}
            trackColor={{ false: '#6b7280', true: '#4f46e5' }}
            thumbColor={autoAssignRoles ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isTablet ? 16 : 12,
          backgroundColor: '#374151',
          padding: isTablet ? 16 : 12,
          borderRadius: isTablet ? 10 : 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '500'
            }}>
              Permitir Invitaciones
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginTop: 4
            }}>
              Los participantes pueden invitar a otros
            </Text>
          </View>
          <Switch
            value={allowInvites}
            onValueChange={setAllowInvites}
            trackColor={{ false: '#6b7280', true: '#4f46e5' }}
            thumbColor={allowInvites ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#374151',
          padding: isTablet ? 16 : 12,
          borderRadius: isTablet ? 10 : 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '500'
            }}>
              Moderación Automática
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginTop: 4
            }}>
              Filtra automáticamente contenido inapropiado
            </Text>
          </View>
          <Switch
            value={autoModeration}
            onValueChange={setAutoModeration}
            trackColor={{ false: '#6b7280', true: '#4f46e5' }}
            thumbColor={autoModeration ? '#ffffff' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Nivel de moderación */}
      <View style={{ marginBottom: isTablet ? 20 : 16 }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginBottom: isTablet ? 8 : 6
        }}>
          Nivel de Moderación
        </Text>
        <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
          {[{ key: 'low', label: 'Bajo' }, { key: 'medium', label: 'Medio' }, { key: 'high', label: 'Alto' }].map((level) => (
            <TouchableOpacity
              key={level.key}
              onPress={() => setModerationLevel(level.key as any)}
              style={{
                flex: 1,
                backgroundColor: moderationLevel === level.key ? '#4f46e5' : '#374151',
                padding: isTablet ? 16 : 12,
                borderRadius: isTablet ? 10 : 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: moderationLevel === level.key ? '600' : '400'
              }}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderRulesAndModeration = () => (
    <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
      <Text style={{
        color: 'white',
        fontSize: isTablet ? 24 : 20,
        fontWeight: 'bold',
        marginBottom: isTablet ? 24 : 20,
        textAlign: 'center'
      }}>
        Reglas del Torneo
      </Text>

      {rules.map((rule, index) => (
        <View key={index} style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: isTablet ? 16 : 12,
          gap: isTablet ? 12 : 8
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 16 : 14,
            fontWeight: '600',
            minWidth: isTablet ? 32 : 24
          }}>
            {index + 1}.
          </Text>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#374151',
              color: 'white',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 10 : 8,
              fontSize: isTablet ? 16 : 14
            }}
            placeholder={`Regla ${index + 1}`}
            placeholderTextColor="#9ca3af"
            value={rule}
            onChangeText={(text) => updateRule(index, text)}
            multiline
          />
          {rules.length > 1 && (
            <TouchableOpacity
              onPress={() => removeRule(index)}
              style={{
                padding: isTablet ? 8 : 6,
                backgroundColor: '#ef4444',
                borderRadius: isTablet ? 8 : 6
              }}
            >
              <Ionicons name="trash" size={isTablet ? 20 : 16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={addRule}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#4f46e5',
          padding: isTablet ? 16 : 12,
          borderRadius: isTablet ? 10 : 8,
          marginTop: isTablet ? 16 : 12
        }}
      >
        <Ionicons name="add" size={isTablet ? 24 : 20} color="white" />
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: '600',
          marginLeft: isTablet ? 8 : 6
        }}>
          Agregar Regla
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFinalReview = () => (
    <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
      <Text style={{
        color: 'white',
        fontSize: isTablet ? 24 : 20,
        fontWeight: 'bold',
        marginBottom: isTablet ? 24 : 20,
        textAlign: 'center'
      }}>
        Revisión Final
      </Text>

      <View style={{
        backgroundColor: '#374151',
        padding: isTablet ? 20 : 16,
        borderRadius: isTablet ? 12 : 10,
        marginBottom: isTablet ? 20 : 16
      }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 18 : 16,
          fontWeight: 'bold',
          marginBottom: isTablet ? 12 : 8
        }}>
          {tournamentName || 'Nombre del Torneo'}
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12,
          marginBottom: isTablet ? 8 : 6
        }}>
          {description || 'Sin descripción'}
        </Text>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 14 : 12
        }}>
          Tipo: {tournamentType} • Participantes: {maxParticipants}
        </Text>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 14 : 12
        }}>
          Fecha: {startDate} • Hora: {startTime}
        </Text>
      </View>

      <View style={{
        backgroundColor: '#374151',
        padding: isTablet ? 20 : 16,
        borderRadius: isTablet ? 12 : 10,
        marginBottom: isTablet ? 20 : 16
      }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: 'bold',
          marginBottom: isTablet ? 12 : 8
        }}>
          Configuración Discord
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12,
          marginBottom: 4
        }}>
          • Canales automáticos: {autoCreateChannels ? 'Sí' : 'No'}
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12,
          marginBottom: 4
        }}>
          • Roles automáticos: {autoAssignRoles ? 'Sí' : 'No'}
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12,
          marginBottom: 4
        }}>
          • Invitaciones: {allowInvites ? 'Permitidas' : 'No permitidas'}
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: isTablet ? 14 : 12
        }}>
          • Moderación: {moderationLevel === 'low' ? 'Baja' : moderationLevel === 'medium' ? 'Media' : 'Alta'}
        </Text>
      </View>

      <View style={{
        backgroundColor: '#374151',
        padding: isTablet ? 20 : 16,
        borderRadius: isTablet ? 12 : 10
      }}>
        <Text style={{
          color: 'white',
          fontSize: isTablet ? 16 : 14,
          fontWeight: 'bold',
          marginBottom: isTablet ? 12 : 8
        }}>
          Reglas ({rules.filter(rule => rule.trim() !== '').length})
        </Text>
        {rules.filter(rule => rule.trim() !== '').map((rule, index) => (
          <Text key={index} style={{
            color: '#9ca3af',
            fontSize: isTablet ? 14 : 12,
            marginBottom: 4
          }}>
            {index + 1}. {rule}
          </Text>
        ))}
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderDiscordConfig();
      case 2:
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18 }}>Roles y Permisos (Próximamente)</Text>
        </View>;
      case 3:
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18 }}>Canales (Próximamente)</Text>
        </View>;
      case 4:
        return renderRulesAndModeration();
      case 5:
        return renderFinalReview();
      default:
        return renderBasicInfo();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return tournamentName.trim() !== '' && maxParticipants !== '' && startDate !== '' && startTime !== '';
      case 1:
      case 2:
      case 3:
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{
        flex: 1,
        backgroundColor: '#111827'
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 24 : 16,
          paddingTop: isTablet ? 60 : 50,
          paddingBottom: isTablet ? 16 : 12,
          borderBottomWidth: 1,
          borderBottomColor: '#374151'
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 24 : 20,
            fontWeight: 'bold'
          }}>
            Crear Torneo Avanzado
          </Text>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: isTablet ? 12 : 8
            }}
          >
            <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <View style={{ flex: 1 }}>
          {renderCurrentStep()}
        </View>

        {/* Navigation Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 24 : 16,
          paddingVertical: isTablet ? 20 : 16,
          borderTopWidth: 1,
          borderTopColor: '#374151'
        }}>
          <TouchableOpacity
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={{
              backgroundColor: currentStep === 0 ? '#374151' : '#6b7280',
              paddingHorizontal: isTablet ? 24 : 20,
              paddingVertical: isTablet ? 12 : 10,
              borderRadius: isTablet ? 10 : 8,
              opacity: currentStep === 0 ? 0.5 : 1
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 16 : 14,
              fontWeight: '600'
            }}>
              Anterior
            </Text>
          </TouchableOpacity>

          <Text style={{
            color: '#9ca3af',
            fontSize: isTablet ? 14 : 12
          }}>
            {currentStep + 1} de {steps.length}
          </Text>

          {currentStep === steps.length - 1 ? (
            <TouchableOpacity
              onPress={handleCreateTournament}
              disabled={!canProceed()}
              style={{
                backgroundColor: canProceed() ? '#10b981' : '#374151',
                paddingHorizontal: isTablet ? 24 : 20,
                paddingVertical: isTablet ? 12 : 10,
                borderRadius: isTablet ? 10 : 8,
                opacity: canProceed() ? 1 : 0.5
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600'
              }}>
                Crear Torneo
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={!canProceed()}
              style={{
                backgroundColor: canProceed() ? '#4f46e5' : '#374151',
                paddingHorizontal: isTablet ? 24 : 20,
                paddingVertical: isTablet ? 12 : 10,
                borderRadius: isTablet ? 10 : 8,
                opacity: canProceed() ? 1 : 0.5
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '600'
              }}>
                Siguiente
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AdvancedTournamentCreator;