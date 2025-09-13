import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { TournamentTicket, TicketMessage } from '../lib/types';

interface TournamentTicketSystemProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  tickets: TournamentTicket[];
  onUpdateTickets: (tickets: TournamentTicket[]) => void;
  currentUserId: string;
  currentUserRole?: string;
}

const TICKET_CATEGORIES = [
  { key: 'technical', label: 'Técnico', icon: 'settings-outline', color: '#3b82f6' },
  { key: 'general', label: 'General', icon: 'chatbubble-outline', color: '#10b981' },
  { key: 'rules', label: 'Reglas', icon: 'document-text-outline', color: '#8b5cf6' },
  { key: 'payment', label: 'Pago', icon: 'card-outline', color: '#ef4444' },
  { key: 'report', label: 'Reporte', icon: 'flag-outline', color: '#dc2626' }
];

const TICKET_PRIORITIES = [
  { key: 'low', label: 'Baja', color: '#10b981' },
  { key: 'medium', label: 'Media', color: '#f59e0b' },
  { key: 'high', label: 'Alta', color: '#ef4444' },
  { key: 'urgent', label: 'Urgente', color: '#dc2626' }
];

export default function TournamentTicketSystem({
  visible,
  onClose,
  tournamentId,
  tickets,
  onUpdateTickets,
  currentUserId,
  currentUserRole
}: TournamentTicketSystemProps) {
  const { isTablet } = useDeviceInfo();
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TournamentTicket | null>(null);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('general');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [ticketResponse, setTicketResponse] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');

  const canManageTickets = currentUserRole === 'organizer' || currentUserRole === 'moderator';
  
  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus === 'all') return true;
    return ticket.status === filterStatus;
  });

  const userTickets = filteredTickets.filter(ticket => 
    ticket.userId === currentUserId || canManageTickets
  );

  const handleCreateTicket = () => {
    if (!newTicketTitle.trim() || !newTicketDescription.trim()) {
      Alert.alert('Error', 'El título y la descripción son requeridos');
      return;
    }

    const newTicket: TournamentTicket = {
      id: `ticket-${Date.now()}`,
      tournamentId,
      userId: currentUserId,
      title: newTicketTitle,
      description: newTicketDescription,
      category: newTicketCategory as any,
      priority: newTicketPriority as any,
      status: 'open',
      assignedTo: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [{
        id: `msg-${Date.now()}`,
        userId: currentUserId,
        content: newTicketDescription,
        createdAt: new Date(),
        isStaff: false
      }]
    };

    const updatedTickets = [...tickets, newTicket];
    onUpdateTickets(updatedTickets);
    
    // Reset form
    setNewTicketTitle('');
    setNewTicketDescription('');
    setNewTicketCategory('general');
    setNewTicketPriority('medium');
    setShowCreateTicket(false);
    
    Alert.alert('Éxito', 'Ticket creado exitosamente');
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: string) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as any, updatedAt: new Date() }
        : ticket
    );
    onUpdateTickets(updatedTickets);
  };

  const handleAssignTicket = (ticketId: string, assignedTo: string) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assignedTo, status: 'in_progress' as any, updatedAt: new Date() }
        : ticket
    );
    onUpdateTickets(updatedTickets);
  };

  const handleAddResponse = () => {
    if (!selectedTicket || !ticketResponse.trim()) {
      Alert.alert('Error', 'La respuesta no puede estar vacía');
      return;
    }

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUserId,
      content: ticketResponse,
      createdAt: new Date(),
      isStaff: canManageTickets
    };

    const updatedTickets = tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { 
            ...ticket, 
            messages: [...ticket.messages, newMessage],
            updatedAt: new Date(),
            status: canManageTickets && ticket.status === 'open' ? 'in_progress' : ticket.status
          }
        : ticket
    );
    
    onUpdateTickets(updatedTickets);
    setTicketResponse('');
    
    // Update selected ticket
    const updatedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
    if (updatedTicket) {
      setSelectedTicket(updatedTicket);
    }
  };

  const getCategoryInfo = (category: string) => {
    return TICKET_CATEGORIES.find(c => c.key === category) || TICKET_CATEGORIES[0];
  };

  const getPriorityInfo = (priority: string) => {
    return TICKET_PRIORITIES.find(p => p.key === priority) || TICKET_PRIORITIES[1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const renderTicket = ({ item: ticket }: { item: TournamentTicket }) => {
    const categoryInfo = getCategoryInfo(ticket.category);
    const priorityInfo = getPriorityInfo(ticket.priority);
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedTicket(ticket)}
        style={{
          backgroundColor: '#374151',
          marginBottom: isTablet ? 16 : 12,
          borderRadius: isTablet ? 12 : 8,
          padding: isTablet ? 20 : 16,
          borderLeftWidth: 4,
          borderLeftColor: priorityInfo.color
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: isTablet ? 12 : 8
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '600',
              marginBottom: isTablet ? 8 : 6
            }}>
              {ticket.title}
            </Text>
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 14 : 12,
              marginBottom: isTablet ? 8 : 6
            }} numberOfLines={2}>
              {ticket.description}
            </Text>
          </View>
          
          <View style={{
            backgroundColor: getStatusColor(ticket.status),
            paddingHorizontal: isTablet ? 12 : 8,
            paddingVertical: isTablet ? 6 : 4,
            borderRadius: isTablet ? 12 : 8,
            marginLeft: isTablet ? 12 : 8
          }}>
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 12 : 10,
              fontWeight: '600'
            }}>
              {getStatusLabel(ticket.status)}
            </Text>
          </View>
        </View>
        
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: isTablet ? 12 : 8 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: categoryInfo.color,
              paddingHorizontal: isTablet ? 8 : 6,
              paddingVertical: isTablet ? 4 : 2,
              borderRadius: isTablet ? 8 : 6
            }}>
              <Ionicons 
                name={categoryInfo.icon as any} 
                size={isTablet ? 14 : 12} 
                color="white" 
                style={{ marginRight: isTablet ? 4 : 2 }}
              />
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 12 : 10,
                fontWeight: '500'
              }}>
                {categoryInfo.label}
              </Text>
            </View>
            
            <View style={{
              backgroundColor: priorityInfo.color,
              paddingHorizontal: isTablet ? 8 : 6,
              paddingVertical: isTablet ? 4 : 2,
              borderRadius: isTablet ? 8 : 6
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 12 : 10,
                fontWeight: '500'
              }}>
                {priorityInfo.label}
              </Text>
            </View>
          </View>
          
          <Text style={{
            color: '#6b7280',
            fontSize: isTablet ? 12 : 10
          }}>
            {ticket.createdAt.toLocaleDateString()}
          </Text>
        </View>
        
        {ticket.messages.length > 1 && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: isTablet ? 8 : 6
          }}>
            <Ionicons name="chatbubbles-outline" size={isTablet ? 16 : 14} color="#9ca3af" />
            <Text style={{
              color: '#9ca3af',
              fontSize: isTablet ? 12 : 10,
              marginLeft: isTablet ? 6 : 4
            }}>
              {ticket.messages.length} respuesta(s)
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{
        flex: 1,
        backgroundColor: '#111827',
        paddingTop: isTablet ? 60 : 50
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 24 : 16,
          paddingBottom: isTablet ? 20 : 16,
          borderBottomWidth: 1,
          borderBottomColor: '#374151'
        }}>
          <Text style={{
            color: 'white',
            fontSize: isTablet ? 24 : 20,
            fontWeight: 'bold'
          }}>
            Sistema de Tickets
          </Text>
          
          <TouchableOpacity
            onPress={onClose}
            style={{ padding: isTablet ? 12 : 8 }}
          >
            <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={{
          paddingHorizontal: isTablet ? 24 : 16,
          paddingVertical: isTablet ? 16 : 12
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFilterStatus(status as any)}
                  style={{
                    backgroundColor: filterStatus === status ? '#3b82f6' : '#374151',
                    paddingHorizontal: isTablet ? 16 : 12,
                    paddingVertical: isTablet ? 8 : 6,
                    borderRadius: isTablet ? 20 : 16
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 14 : 12,
                    fontWeight: '500'
                  }}>
                    {status === 'all' ? 'Todos' : getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
          {/* Create Ticket Button */}
          <TouchableOpacity
            onPress={() => setShowCreateTicket(true)}
            style={{
              backgroundColor: '#3b82f6',
              padding: isTablet ? 16 : 12,
              borderRadius: isTablet ? 12 : 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isTablet ? 24 : 20
            }}
          >
            <Ionicons name="add" size={isTablet ? 24 : 20} color="white" style={{ marginRight: isTablet ? 8 : 6 }} />
            <Text style={{
              color: 'white',
              fontSize: isTablet ? 18 : 16,
              fontWeight: '600'
            }}>
              Crear Nuevo Ticket
            </Text>
          </TouchableOpacity>

          {/* Tickets List */}
          <FlatList
            data={userTickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: isTablet ? 60 : 40
              }}>
                <Ionicons name="ticket-outline" size={isTablet ? 64 : 48} color="#6b7280" />
                <Text style={{
                  color: '#6b7280',
                  fontSize: isTablet ? 18 : 16,
                  marginTop: isTablet ? 16 : 12,
                  textAlign: 'center'
                }}>
                  No hay tickets {filterStatus !== 'all' ? `con estado "${getStatusLabel(filterStatus)}"` : ''}
                </Text>
              </View>
            }
          />
        </View>

        {/* Create Ticket Modal */}
        <Modal
          visible={showCreateTicket}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={{
            flex: 1,
            backgroundColor: '#111827',
            paddingTop: isTablet ? 60 : 50
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: isTablet ? 24 : 16,
              paddingBottom: isTablet ? 20 : 16,
              borderBottomWidth: 1,
              borderBottomColor: '#374151'
            }}>
              <Text style={{
                color: 'white',
                fontSize: isTablet ? 24 : 20,
                fontWeight: 'bold'
              }}>
                Crear Ticket
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  setShowCreateTicket(false);
                  setNewTicketTitle('');
                  setNewTicketDescription('');
                  setNewTicketCategory('general');
                  setNewTicketPriority('medium');
                }}
                style={{ padding: isTablet ? 12 : 8 }}
              >
                <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
              {/* Title */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Título del Ticket
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    fontSize: isTablet ? 18 : 16
                  }}
                  placeholder="Describe brevemente el problema..."
                  placeholderTextColor="#9ca3af"
                  value={newTicketTitle}
                  onChangeText={setNewTicketTitle}
                />
              </View>

              {/* Description */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Descripción Detallada
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 10 : 8,
                    fontSize: isTablet ? 18 : 16,
                    height: isTablet ? 120 : 100,
                    textAlignVertical: 'top'
                  }}
                  placeholder="Proporciona todos los detalles posibles sobre el problema..."
                  placeholderTextColor="#9ca3af"
                  value={newTicketDescription}
                  onChangeText={setNewTicketDescription}
                  multiline
                />
              </View>

              {/* Category */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Categoría
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: isTablet ? 12 : 8
                }}>
                  {TICKET_CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.key}
                      onPress={() => setNewTicketCategory(category.key)}
                      style={{
                        backgroundColor: newTicketCategory === category.key ? category.color : '#374151',
                        paddingHorizontal: isTablet ? 16 : 12,
                        paddingVertical: isTablet ? 12 : 8,
                        borderRadius: isTablet ? 10 : 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: newTicketCategory === category.key ? category.color : '#4b5563'
                      }}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={isTablet ? 20 : 16} 
                        color="white" 
                        style={{ marginRight: isTablet ? 8 : 6 }}
                      />
                      <Text style={{
                        color: 'white',
                        fontSize: isTablet ? 14 : 12,
                        fontWeight: '600'
                      }}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority */}
              <View style={{ marginBottom: isTablet ? 24 : 20 }}>
                <Text style={{
                  color: 'white',
                  fontSize: isTablet ? 18 : 16,
                  fontWeight: '600',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  Prioridad
                </Text>
                <View style={{
                  flexDirection: 'row',
                  gap: isTablet ? 12 : 8
                }}>
                  {TICKET_PRIORITIES.map(priority => (
                    <TouchableOpacity
                      key={priority.key}
                      onPress={() => setNewTicketPriority(priority.key)}
                      style={{
                        flex: 1,
                        backgroundColor: newTicketPriority === priority.key ? priority.color : '#374151',
                        padding: isTablet ? 16 : 12,
                        borderRadius: isTablet ? 10 : 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: newTicketPriority === priority.key ? priority.color : '#4b5563'
                      }}
                    >
                      <Text style={{
                        color: 'white',
                        fontSize: isTablet ? 14 : 12,
                        fontWeight: '600'
                      }}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: isTablet ? 16 : 12,
                marginTop: isTablet ? 24 : 20,
                marginBottom: isTablet ? 48 : 40
              }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateTicket(false);
                    setNewTicketTitle('');
                    setNewTicketDescription('');
                    setNewTicketCategory('general');
                    setNewTicketPriority('medium');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#374151',
                    padding: isTablet ? 20 : 16,
                    borderRadius: isTablet ? 12 : 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: '600'
                  }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleCreateTicket}
                  style={{
                    flex: 1,
                    backgroundColor: '#3b82f6',
                    padding: isTablet ? 20 : 16,
                    borderRadius: isTablet ? 12 : 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: '600'
                  }}>
                    Crear Ticket
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Ticket Detail Modal */}
        <Modal
          visible={!!selectedTicket}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          {selectedTicket && (
            <View style={{
              flex: 1,
              backgroundColor: '#111827',
              paddingTop: isTablet ? 60 : 50
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: isTablet ? 24 : 16,
                paddingBottom: isTablet ? 20 : 16,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: 'white',
                    fontSize: isTablet ? 20 : 18,
                    fontWeight: 'bold'
                  }} numberOfLines={1}>
                    {selectedTicket.title}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: isTablet ? 14 : 12,
                    marginTop: 4
                  }}>
                    Ticket #{selectedTicket.id.slice(-6)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => setSelectedTicket(null)}
                  style={{ padding: isTablet ? 12 : 8 }}
                >
                  <Ionicons name="close" size={isTablet ? 28 : 24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Ticket Info */}
              <View style={{
                paddingHorizontal: isTablet ? 24 : 16,
                paddingVertical: isTablet ? 16 : 12,
                borderBottomWidth: 1,
                borderBottomColor: '#374151'
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: isTablet ? 12 : 8
                }}>
                  <View style={{
                    backgroundColor: getStatusColor(selectedTicket.status),
                    paddingHorizontal: isTablet ? 12 : 8,
                    paddingVertical: isTablet ? 6 : 4,
                    borderRadius: isTablet ? 12 : 8
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 12 : 10,
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(selectedTicket.status)}
                    </Text>
                  </View>
                  
                  {canManageTickets && (
                    <View style={{ flexDirection: 'row', gap: isTablet ? 8 : 6 }}>
                      {['in_progress', 'resolved', 'closed'].map(status => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => handleUpdateTicketStatus(selectedTicket.id, status)}
                          style={{
                            backgroundColor: '#374151',
                            paddingHorizontal: isTablet ? 12 : 8,
                            paddingVertical: isTablet ? 6 : 4,
                            borderRadius: isTablet ? 8 : 6
                          }}
                        >
                          <Text style={{
                            color: 'white',
                            fontSize: isTablet ? 12 : 10
                          }}>
                            {getStatusLabel(status)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
                  <View style={{
                    backgroundColor: getCategoryInfo(selectedTicket.category).color,
                    paddingHorizontal: isTablet ? 8 : 6,
                    paddingVertical: isTablet ? 4 : 2,
                    borderRadius: isTablet ? 8 : 6,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Ionicons 
                      name={getCategoryInfo(selectedTicket.category).icon as any} 
                      size={isTablet ? 14 : 12} 
                      color="white" 
                      style={{ marginRight: isTablet ? 4 : 2 }}
                    />
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 12 : 10,
                      fontWeight: '500'
                    }}>
                      {getCategoryInfo(selectedTicket.category).label}
                    </Text>
                  </View>
                  
                  <View style={{
                    backgroundColor: getPriorityInfo(selectedTicket.priority).color,
                    paddingHorizontal: isTablet ? 8 : 6,
                    paddingVertical: isTablet ? 4 : 2,
                    borderRadius: isTablet ? 8 : 6
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 12 : 10,
                      fontWeight: '500'
                    }}>
                      {getPriorityInfo(selectedTicket.priority).label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Messages */}
              <ScrollView style={{ flex: 1, padding: isTablet ? 24 : 16 }}>
                {selectedTicket.messages.map((message, index) => (
                  <View key={message.id} style={{
                    backgroundColor: message.isStaff ? '#1f2937' : '#374151',
                    padding: isTablet ? 16 : 12,
                    borderRadius: isTablet ? 12 : 8,
                    marginBottom: isTablet ? 16 : 12,
                    borderLeftWidth: 4,
                    borderLeftColor: message.isStaff ? '#10b981' : '#3b82f6'
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isTablet ? 8 : 6
                    }}>
                      <Text style={{
                        color: message.isStaff ? '#10b981' : '#3b82f6',
                        fontSize: isTablet ? 14 : 12,
                        fontWeight: '600'
                      }}>
                        {message.isStaff ? 'Staff' : 'Usuario'}
                      </Text>
                      <Text style={{
                        color: '#6b7280',
                        fontSize: isTablet ? 12 : 10
                      }}>
                        {message.createdAt.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 16 : 14,
                      lineHeight: isTablet ? 24 : 20
                    }}>
                      {message.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Response Input */}
              {selectedTicket.status !== 'closed' && (
                <View style={{
                  padding: isTablet ? 24 : 16,
                  borderTopWidth: 1,
                  borderTopColor: '#374151'
                }}>
                  <TextInput
                    style={{
                      backgroundColor: '#374151',
                      color: 'white',
                      padding: isTablet ? 16 : 12,
                      borderRadius: isTablet ? 10 : 8,
                      fontSize: isTablet ? 16 : 14,
                      height: isTablet ? 80 : 60,
                      textAlignVertical: 'top',
                      marginBottom: isTablet ? 16 : 12
                    }}
                    placeholder="Escribe tu respuesta..."
                    placeholderTextColor="#9ca3af"
                    value={ticketResponse}
                    onChangeText={setTicketResponse}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handleAddResponse}
                    style={{
                      backgroundColor: '#3b82f6',
                      padding: isTablet ? 16 : 12,
                      borderRadius: isTablet ? 10 : 8,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: isTablet ? 16 : 14,
                      fontWeight: '600'
                    }}>
                      Enviar Respuesta
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
}