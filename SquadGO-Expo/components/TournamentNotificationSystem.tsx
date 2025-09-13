import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TournamentRole } from '../lib/types';

interface NotificationSystemProps {
  tournamentId: string;
  userId: string;
  isStaff: boolean;
  roles: TournamentRole[];
  onNotificationSent?: (notification: any) => void;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'announcement' | 'reminder' | 'update' | 'alert';
  targetRoles: string[];
  autoTrigger?: {
    event: 'tournament_start' | 'registration_deadline' | 'match_start' | 'custom';
    timeOffset?: number; // minutos antes del evento
  };
}

interface Notification {
  id: string;
  tournamentId: string;
  title: string;
  message: string;
  type: 'announcement' | 'reminder' | 'update' | 'alert';
  targetRoles: string[];
  mentions: {
    everyone?: boolean;
    here?: boolean;
    roles?: string[];
    users?: string[];
  };
  sentBy: string;
  sentAt: Date;
  readBy: string[];
  priority: 'low' | 'medium' | 'high';
  scheduled?: Date;
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Mensaje de Bienvenida',
    title: '¡Bienvenido al Torneo!',
    message: 'Gracias por unirte a nuestro torneo. Revisa las reglas y prepárate para la competencia.',
    type: 'announcement',
    targetRoles: ['participant'],
    autoTrigger: { event: 'custom' }
  },
  {
    id: 'tournament_start',
    name: 'Inicio de Torneo',
    title: '🚀 ¡El Torneo Ha Comenzado!',
    message: 'El torneo ha iniciado oficialmente. ¡Que comience la competencia!',
    type: 'announcement',
    targetRoles: ['everyone'],
    autoTrigger: { event: 'tournament_start' }
  },
  {
    id: 'registration_reminder',
    name: 'Recordatorio de Registro',
    title: '⏰ Recordatorio: Cierre de Registro',
    message: 'El registro para el torneo cierra pronto. ¡No te quedes fuera!',
    type: 'reminder',
    targetRoles: ['everyone'],
    autoTrigger: { event: 'registration_deadline', timeOffset: 60 }
  },
  {
    id: 'match_reminder',
    name: 'Recordatorio de Partida',
    title: '🎮 Tu Partida Comienza Pronto',
    message: 'Tu próxima partida comenzará en 15 minutos. ¡Prepárate!',
    type: 'reminder',
    targetRoles: ['participant'],
    autoTrigger: { event: 'match_start', timeOffset: 15 }
  },
  {
    id: 'rules_update',
    name: 'Actualización de Reglas',
    title: '📋 Actualización de Reglas',
    message: 'Se han actualizado las reglas del torneo. Por favor revísalas.',
    type: 'update',
    targetRoles: ['everyone']
  },
  {
    id: 'emergency',
    name: 'Alerta de Emergencia',
    title: '🚨 Alerta Importante',
    message: 'Mensaje de emergencia o información crítica.',
    type: 'alert',
    targetRoles: ['everyone']
  }
];

const NOTIFICATION_TYPES = {
  announcement: { name: 'Anuncio', color: '#3b82f6', icon: 'megaphone-outline' },
  reminder: { name: 'Recordatorio', color: '#f59e0b', icon: 'time-outline' },
  update: { name: 'Actualización', color: '#10b981', icon: 'refresh-outline' },
  alert: { name: 'Alerta', color: '#ef4444', icon: 'warning-outline' }
};

export default function TournamentNotificationSystem({
  tournamentId,
  userId,
  isStaff,
  roles,
  onNotificationSent
}: NotificationSystemProps) {
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'settings'>('notifications');
  
  // Estados para crear notificación
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'announcement' | 'reminder' | 'update' | 'alert',
    targetRoles: [] as string[],
    mentions: {
      everyone: false,
      here: false,
      roles: [] as string[],
      users: [] as string[]
    },
    priority: 'medium' as const,
    scheduled: null as Date | null
  });

  // Cargar notificaciones
  useEffect(() => {
    const q = query(
      collection(db, 'tournaments', tournamentId, 'notifications'),
      orderBy('sentAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
        scheduled: doc.data().scheduled?.toDate() || null
      })) as Notification[];
      
      setNotifications(notificationsData);
    });

    return unsubscribe;
  }, [tournamentId]);

  // Función para enviar notificación
  const sendNotification = useCallback(async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      Alert.alert('Error', 'El título y mensaje son obligatorios');
      return;
    }

    try {
      const notificationData = {
        tournamentId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        targetRoles: newNotification.targetRoles,
        mentions: newNotification.mentions,
        sentBy: userId,
        sentAt: new Date(),
        readBy: [],
        priority: newNotification.priority,
        scheduled: newNotification.scheduled
      };

      await addDoc(collection(db, 'tournaments', tournamentId, 'notifications'), notificationData);
      
      // Resetear formulario
      setNewNotification({
        title: '',
        message: '',
        type: 'announcement',
        targetRoles: [],
        mentions: { everyone: false, here: false, roles: [], users: [] },
        priority: 'medium',
        scheduled: null
      });
      
      setShowCreateModal(false);
      onNotificationSent?.(notificationData);
      Alert.alert('Éxito', 'Notificación enviada correctamente');
      
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'No se pudo enviar la notificación');
    }
  }, [newNotification, tournamentId, userId, onNotificationSent]);

  // Función para usar plantilla
  const useTemplate = useCallback((template: NotificationTemplate) => {
    setNewNotification({
      title: template.title,
      message: template.message,
      type: template.type,
      targetRoles: template.targetRoles,
      mentions: { everyone: false, here: false, roles: [], users: [] },
      priority: 'medium',
      scheduled: null
    });
    setShowTemplateModal(false);
    setShowCreateModal(true);
  }, []);

  // Función para marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'tournaments', tournamentId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        readBy: [...(notifications.find(n => n.id === notificationId)?.readBy || []), userId]
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [tournamentId, userId, notifications]);

  // Renderizar notificación
  const renderNotification = ({ item }: { item: Notification }) => {
    const typeInfo = NOTIFICATION_TYPES[item.type];
    const isRead = item.readBy.includes(userId);
    
    return (
      <TouchableOpacity
        onPress={() => !isRead && markAsRead(item.id)}
        style={{
          backgroundColor: isRead ? '#1f2937' : '#374151',
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: typeInfo.color
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            flex: 1
          }}>
            {item.title}
          </Text>
          
          {!isRead && (
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#3b82f6'
            }} />
          )}
        </View>
        
        <Text style={{
          color: '#d1d5db',
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 8
        }}>
          {item.message}
        </Text>
        
        {/* Menciones */}
        {(item.mentions.everyone || item.mentions.here || item.mentions.roles?.length > 0) && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 8
          }}>
            {item.mentions.everyone && (
              <View style={{
                backgroundColor: '#ef4444',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                marginRight: 4,
                marginBottom: 4
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>@everyone</Text>
              </View>
            )}
            
            {item.mentions.here && (
              <View style={{
                backgroundColor: '#f59e0b',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                marginRight: 4,
                marginBottom: 4
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>@here</Text>
              </View>
            )}
            
            {item.mentions.roles?.map(roleId => {
              const role = roles.find(r => r.id === roleId);
              return role ? (
                <View key={roleId} style={{
                  backgroundColor: role.color,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginRight: 4,
                  marginBottom: 4
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>@{role.name}</Text>
                </View>
              ) : null;
            })}
          </View>
        )}
        
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 12
          }}>
            {item.sentAt.toLocaleDateString()} {item.sentAt.toLocaleTimeString()}
          </Text>
          
          <View style={{
            backgroundColor: typeInfo.color + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4
          }}>
            <Text style={{
              color: typeInfo.color,
              fontSize: 12,
              fontWeight: '500'
            }}>
              {typeInfo.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar plantilla
  const renderTemplate = ({ item }: { item: NotificationTemplate }) => {
    const typeInfo = NOTIFICATION_TYPES[item.type];
    
    return (
      <TouchableOpacity
        onPress={() => useTemplate(item)}
        style={{
          backgroundColor: '#1f2937',
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: typeInfo.color
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            flex: 1
          }}>
            {item.name}
          </Text>
          
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
        
        <Text style={{
          color: '#d1d5db',
          fontSize: 14,
          marginBottom: 4
        }}>
          {item.title}
        </Text>
        
        <Text style={{
          color: '#9ca3af',
          fontSize: 12,
          lineHeight: 16
        }}>
          {item.message}
        </Text>
        
        {item.autoTrigger && (
          <View style={{
            backgroundColor: '#374151',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            marginTop: 8,
            alignSelf: 'flex-start'
          }}>
            <Text style={{
              color: '#9ca3af',
              fontSize: 12
            }}>
              🤖 Auto-trigger: {item.autoTrigger.event}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      {/* Tabs */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        margin: 16,
        borderRadius: 8,
        padding: 4
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'notifications' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📢 Notificaciones
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('templates')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 6,
            backgroundColor: activeTab === 'templates' ? '#3b82f6' : 'transparent'
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            📝 Plantillas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón crear notificación */}
      {isStaff && (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#3b82f6',
            marginHorizontal: 16,
            marginBottom: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8
          }}>
            Crear Notificación
          </Text>
        </TouchableOpacity>
      )}

      {/* Contenido */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {activeTab === 'notifications' ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40
              }}>
                <Ionicons name="notifications-outline" size={48} color="#6b7280" />
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 16,
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  No hay notificaciones aún
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={templates}
            renderItem={renderTemplate}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modal crear notificación */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
          <View style={{
            backgroundColor: '#1f2937',
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#374151'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              Nueva Notificación
            </Text>
            
            <TouchableOpacity
              onPress={sendNotification}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Enviar
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Título */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Título
              </Text>
              <TextInput
                value={newNotification.title}
                onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
                placeholder="Título de la notificación"
                placeholderTextColor="#9ca3af"
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  fontSize: 16
                }}
              />
            </View>
            
            {/* Mensaje */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Mensaje
              </Text>
              <TextInput
                value={newNotification.message}
                onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
                placeholder="Contenido de la notificación"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  fontSize: 16,
                  textAlignVertical: 'top'
                }}
              />
            </View>
            
            {/* Tipo */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Tipo de Notificación
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}>
                {Object.entries(NOTIFICATION_TYPES).map(([type, info]) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewNotification(prev => ({ ...prev, type: type as any }))}
                    style={{
                      backgroundColor: newNotification.type === type ? info.color : '#374151',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginRight: 8,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name={info.icon as any} size={16} color="white" />
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '500',
                      marginLeft: 4
                    }}>
                      {info.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Menciones */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Menciones
              </Text>
              
              <View style={{
                backgroundColor: '#1f2937',
                borderRadius: 8,
                padding: 12
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{ color: 'white', fontSize: 14 }}>@everyone</Text>
                  <Switch
                    value={newNotification.mentions.everyone}
                    onValueChange={(value) => setNewNotification(prev => ({
                      ...prev,
                      mentions: { ...prev.mentions, everyone: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#ef4444' }}
                    thumbColor={newNotification.mentions.everyone ? 'white' : '#9ca3af'}
                  />
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 14 }}>@here</Text>
                  <Switch
                    value={newNotification.mentions.here}
                    onValueChange={(value) => setNewNotification(prev => ({
                      ...prev,
                      mentions: { ...prev.mentions, here: value }
                    }))}
                    trackColor={{ false: '#374151', true: '#f59e0b' }}
                    thumbColor={newNotification.mentions.here ? 'white' : '#9ca3af'}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}