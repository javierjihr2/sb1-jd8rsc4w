import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingState, GradientLoadingState, useLoadingState } from '../../components/LoadingState';
import { useOfflineData } from '../../hooks/useOfflineData';
import ConnectionStatus from '../../components/ConnectionStatus';
import { ValidatedInput } from '../../components/ValidatedInput';
import { FormValidator } from '../../utils/validation';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  bookings: number;
  rating: number;
  reviews: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'withdrawal';
}

interface BankAccount {
  id: string;
  type: 'bank' | 'paypal';
  name: string;
  details: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    title: 'Coaching de Puntería y Estrategia',
    description: 'Sesiones personalizadas para mejorar tu aim y estrategias de juego',
    price: 25,
    category: 'Coaching',
    isActive: true,
    bookings: 15,
    rating: 4.8,
    reviews: 12
  },
  {
    id: '2',
    title: 'Análisis de Sensibilidades',
    description: 'Optimización completa de controles y sensibilidades',
    price: 15,
    category: 'Configuración',
    isActive: true,
    bookings: 8,
    rating: 4.9,
    reviews: 7
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Coaching completado - Usuario123',
    amount: 25,
    type: 'income'
  },
  {
    id: '2',
    date: '2024-01-14',
    description: 'Análisis de sensibilidades - ProGamer',
    amount: 15,
    type: 'income'
  },
  {
    id: '3',
    date: '2024-01-10',
    description: 'Retiro a cuenta bancaria',
    amount: -50,
    type: 'withdrawal'
  }
];

const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    type: 'bank',
    name: 'Banco Principal',
    details: '****1234'
  },
  {
    id: '2',
    type: 'paypal',
    name: 'PayPal',
    details: 'creator@email.com'
  }
];

export default function CreatorPortalScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const { loading, error, startLoading, stopLoading, setLoadingError } = useLoadingState(false);
  
  // Usar sistema offline para servicios y transacciones
  const { 
    data: services, 
    loading: servicesLoading, 
    error: servicesError, 
    addItem: addService, 
    updateItem: updateService, 
    refresh: refreshServices 
  } = useOfflineData<Service>({
    collectionName: 'creator-services',
    cacheKey: 'creator-services'
  });
  
  const { 
    data: transactions, 
    loading: transactionsLoading, 
    error: transactionsError, 
    addItem: addTransaction, 
    refresh: refreshTransactions 
  } = useOfflineData<Transaction>({
    collectionName: 'creator-transactions',
    cacheKey: 'creator-transactions'
  });
  
  // Formulario de nuevo servicio
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Coaching'
  });
  
  // Retiro de fondos
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalBookings = services.reduce((acc, s) => acc + s.bookings, 0);
  const averageRating = services.length > 0 
    ? services.reduce((acc, s) => acc + s.rating, 0) / services.length 
    : 0;

  const onRefresh = async () => {
    await Promise.all([refreshServices(), refreshTransactions()]);
  };

  const handleCreateService = async () => {
    // Usar FormValidator para validación
    const validator = new FormValidator();
    validator
      .addRule('title', { required: true, minLength: 5, message: 'El título debe tener al menos 5 caracteres' })
      .addRule('description', { required: true, minLength: 10, message: 'La descripción debe tener al menos 10 caracteres' })
      .addRule('price', { required: true, pattern: /^\d+(\.\d{1,2})?$/, message: 'El precio debe ser un número válido' });

    const validationResult = validator.validate({
      title: newService.title,
      description: newService.description,
      price: newService.price
    });

    if (!validationResult.isValid) {
      Alert.alert('Error de Validación', validationResult.errors.join('\n'));
      return;
    }

    const price = parseFloat(newService.price);
    const service: Service = {
      id: Date.now().toString(),
      title: newService.title,
      description: newService.description,
      price: price,
      category: newService.category,
      isActive: true,
      bookings: 0,
      rating: 0,
      reviews: 0
    };

    try {
      await addService(service);
      setNewService({ title: '', description: '', price: '', category: 'Coaching' });
      setShowServiceModal(false);
      Alert.alert('Éxito', 'Servicio creado exitosamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el servicio. Se guardará para sincronizar cuando tengas conexión.');
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0 || amount > currentBalance) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Error', 'Selecciona una cuenta de destino');
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: 'Retiro solicitado',
      amount: -amount,
      type: 'withdrawal'
    };

    try {
      await addTransaction(transaction);
      setWithdrawalAmount('');
      setSelectedAccount('');
      setShowWithdrawalModal(false);
      Alert.alert('Éxito', 'Retiro procesado exitosamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el retiro. Se guardará para sincronizar cuando tengas conexión.');
    }
  };

  const toggleServiceStatus = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      try {
        await updateService(serviceId, { ...service, isActive: !service.isActive });
      } catch (error) {
        Alert.alert('Error', 'No se pudo actualizar el servicio. Se guardará para sincronizar cuando tengas conexión.');
      }
    }
  };

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Resumen del Portal</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#10b981" />
          <Text style={styles.statValue}>${currentBalance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Saldo Disponible</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{services.length}</Text>
          <Text style={styles.statLabel}>Servicios Activos</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{totalBookings}</Text>
          <Text style={styles.statLabel}>Total Reservas</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#ef4444" />
          <Text style={styles.statValue}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Calificación Promedio</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowServiceModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.actionButtonText}>Crear Nuevo Servicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={() => setShowWithdrawalModal(true)}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text style={styles.actionButtonText}>Retirar Fondos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Servicios</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowServiceModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {services.map(service => (
        <View key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => toggleServiceStatus(service.id)}
              style={[
                styles.statusToggle,
                { backgroundColor: service.isActive ? '#10b981' : '#6b7280' }
              ]}
            >
              <Text style={styles.statusText}>
                {service.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.serviceDescription}>{service.description}</Text>
          
          <View style={styles.serviceStats}>
            <View style={styles.serviceStat}>
              <Text style={styles.serviceStatValue}>${service.price}</Text>
              <Text style={styles.serviceStatLabel}>Precio</Text>
            </View>
            
            <View style={styles.serviceStat}>
              <Text style={styles.serviceStatValue}>{service.bookings}</Text>
              <Text style={styles.serviceStatLabel}>Reservas</Text>
            </View>
            
            <View style={styles.serviceStat}>
              <Text style={styles.serviceStatValue}>{service.rating.toFixed(1)}</Text>
              <Text style={styles.serviceStatLabel}>Rating</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFinances = () => (
    <View style={styles.tabContent}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
        <Text style={styles.balanceAmount}>${currentBalance.toFixed(2)}</Text>
        
        <TouchableOpacity 
          style={styles.withdrawButton}
          onPress={() => setShowWithdrawalModal(true)}
        >
          <Ionicons name="card" size={16} color="white" />
          <Text style={styles.withdrawButtonText}>Retirar Fondos</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
      
      {transactions.map(transaction => (
        <View key={transaction.id} style={styles.transactionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionDate}>{transaction.date}</Text>
          </View>
          
          <Text style={[
            styles.transactionAmount,
            { color: transaction.amount > 0 ? '#10b981' : '#ef4444' }
          ]}>
            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'dashboard', icon: 'grid', label: 'Dashboard' },
        { key: 'services', icon: 'briefcase', label: 'Servicios' },
        { key: 'finances', icon: 'card', label: 'Finanzas' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab(tab.key)}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityHint={`Cambia a la pestaña ${tab.label}`}
          accessibilityState={{ selected: activeTab === tab.key }}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={20} 
            color={activeTab === tab.key ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.key && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'services':
        return renderServices();
      case 'finances':
        return renderFinances();
      default:
        return renderDashboard();
    }
  };

  if (servicesLoading || transactionsLoading) {
    return (
      <GradientLoadingState 
        message="Cargando portal del creador..."
      />
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d']}
      style={styles.container}
    >
      <View style={styles.container}>
        <ConnectionStatus showWhenOnline={false} position="top" />
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Portal del Creador</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus servicios y finanzas</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="Configuración"
            accessibilityHint="Abre la configuración del portal del creador"
          >
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {renderTabBar()}

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {/* Modal para crear servicio */}
        <Modal
          visible={showServiceModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={styles.modalContainer}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowServiceModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  accessibilityHint="Cierra el modal de nuevo servicio"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Nuevo Servicio</Text>
                <TouchableOpacity 
                  onPress={handleCreateService}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar servicio"
                  accessibilityHint="Guarda el nuevo servicio"
                >
                  <Text style={styles.saveButton}>Guardar</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <ValidatedInput
                    label="Título del Servicio"
                    value={newService.title}
                    onChangeText={(text) => setNewService(prev => ({ ...prev, title: text }))}
                    placeholder="Ej: Coaching de Puntería"
                    rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 5, message: 'Debe tener al menos 5 caracteres' }, { maxLength: 50, message: 'No puede exceder 50 caracteres' }]}
                    containerStyle={styles.textInput}
                    labelStyle={styles.inputLabel}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <ValidatedInput
                    label="Descripción"
                    value={newService.description}
                    onChangeText={(text) => setNewService(prev => ({ ...prev, description: text }))}
                    placeholder="Describe tu servicio..."
                    rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 10, message: 'Debe tener al menos 10 caracteres' }, { maxLength: 500, message: 'No puede exceder 500 caracteres' }]}
                    multiline
                    numberOfLines={4}
                    containerStyle={[styles.textInput, styles.textArea]}
                    labelStyle={styles.inputLabel}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <ValidatedInput
                    label="Precio (USD)"
                    value={newService.price}
                    onChangeText={(text) => setNewService(prev => ({ ...prev, price: text }))}
                    placeholder="25.00"
                    rules={[{ required: true, message: 'Este campo es obligatorio' }, { pattern: /^\d+(\.\d{1,2})?$/, message: 'El precio debe ser un número válido' }]}
                    keyboardType="numeric"
                    containerStyle={styles.textInput}
                    labelStyle={styles.inputLabel}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Categoría</Text>
                  <View style={styles.categoryButtons}>
                    {['Coaching', 'Configuración', 'Análisis', 'Estrategia'].map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          newService.category === category && styles.categoryButtonActive
                        ]}
                        onPress={() => setNewService(prev => ({ ...prev, category }))}
                        accessibilityRole="button"
                        accessibilityLabel={category}
                        accessibilityHint={`Selecciona la categoría ${category}`}
                        accessibilityState={{ selected: newService.category === category }}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          newService.category === category && styles.categoryButtonTextActive
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        {/* Modal para retiro */}
        <Modal
          visible={showWithdrawalModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={styles.modalContainer}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShowWithdrawalModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  accessibilityHint="Cierra el modal de retiro de fondos"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Retirar Fondos</Text>
                <TouchableOpacity 
                  onPress={handleWithdrawal}
                  accessibilityRole="button"
                  accessibilityLabel="Retirar fondos"
                  accessibilityHint="Procesa el retiro de fondos"
                >
                  <Text style={styles.saveButton}>Retirar</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceInfoLabel}>Saldo Disponible</Text>
                  <Text style={styles.balanceInfoAmount}>${currentBalance.toFixed(2)}</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monto a Retirar</Text>
                  <TextInput
                    style={styles.textInput}
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    placeholder="0.00"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cuenta de Destino</Text>
                  {bankAccounts.map(account => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        selectedAccount === account.id && styles.accountOptionSelected
                      ]}
                      onPress={() => setSelectedAccount(account.id)}
                      accessibilityRole="button"
                      accessibilityLabel={account.name}
                      accessibilityHint={`Selecciona la cuenta ${account.name} para el retiro`}
                      accessibilityState={{ selected: selectedAccount === account.id }}
                    >
                      <Ionicons 
                        name={account.type === 'bank' ? 'card' : 'logo-paypal'} 
                        size={20} 
                        color={selectedAccount === account.id ? '#3b82f6' : '#6b7280'} 
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountDetails}>{account.details}</Text>
                      </View>
                      {selectedAccount === account.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1f2937',
  },
  tabLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    width: (width - 44) / 2,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  serviceCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceCategory: {
    color: '#3b82f6',
    fontSize: 12,
    marginTop: 4,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceDescription: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  serviceStat: {
    alignItems: 'center',
  },
  serviceStatValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceStatLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  withdrawButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  transactionCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDescription: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  balanceInfo: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceInfoLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  balanceInfoAmount: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  accountOption: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  accountOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a20',
  },
  accountName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  accountDetails: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
});