import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContextSimple';
import { analyticsManager } from '../lib/analytics';
import { monitoringManager } from '../lib/monitoring';
import { monetizationService } from '../lib/monetization-service';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  email?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  createdAt: Date;
}

interface PaymentManagerProps {
  visible: boolean;
  onClose: () => void;
  selectedPlan?: any;
  onPaymentSuccess?: (paymentData: any) => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
  visible,
  onClose,
  selectedPlan,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const { subscribeToPlan, currentSubscription } = useSubscription();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'billing' | 'history'>('methods');
  const [autoRenew, setAutoRenew] = useState(true);
  
  // Card form state
  const [cardForm, setCardForm] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    holderName: '',
    saveCard: true
  });
  
  // PayPal form state
  const [paypalEmail, setPaypalEmail] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'paypal' | 'apple_pay' | 'google_pay'>('card');

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
      analyticsManager.trackEvent('payment_manager_opened', {
        userId: user?.uid,
        planId: selectedPlan?.id
      });
    }
  }, [visible]);

  const loadPaymentMethods = async () => {
    try {
      // Simular carga de métodos de pago guardados
      const mockMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true,
          expiryMonth: 12,
          expiryYear: 2025,
          holderName: 'John Doe',
          createdAt: new Date()
        }
      ];
      setPaymentMethods(mockMethods);
      if (mockMethods.length > 0) {
        setSelectedPaymentMethod(mockMethods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      monitoringManager.logError(error as Error, {
        context: 'PaymentManager.loadPaymentMethods',
        userId: user?.uid
      });
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsProcessing(true);
      
      let newMethod: PaymentMethod;
      
      if (selectedPaymentType === 'card') {
        if (!cardForm.number || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.cvc) {
          Alert.alert('Error', 'Por favor completa todos los campos de la tarjeta');
          return;
        }
        
        newMethod = {
          id: Date.now().toString(),
          type: 'card',
          last4: cardForm.number.slice(-4),
          brand: detectCardBrand(cardForm.number),
          isDefault: paymentMethods.length === 0,
          expiryMonth: parseInt(cardForm.expiryMonth),
          expiryYear: parseInt(cardForm.expiryYear),
          holderName: cardForm.holderName,
          createdAt: new Date()
        };
      } else if (selectedPaymentType === 'paypal') {
        if (!paypalEmail) {
          Alert.alert('Error', 'Por favor ingresa tu email de PayPal');
          return;
        }
        
        newMethod = {
          id: Date.now().toString(),
          type: 'paypal',
          email: paypalEmail,
          isDefault: paymentMethods.length === 0,
          createdAt: new Date()
        };
      } else {
        newMethod = {
          id: Date.now().toString(),
          type: selectedPaymentType,
          isDefault: paymentMethods.length === 0,
          createdAt: new Date()
        };
      }
      
      setPaymentMethods([...paymentMethods, newMethod]);
      setSelectedPaymentMethod(newMethod.id);
      setShowAddPayment(false);
      resetForms();
      
      analyticsManager.trackEvent('payment_method_added', {
        userId: user?.uid,
        methodType: selectedPaymentType
      });
      
      Alert.alert('Éxito', 'Método de pago agregado correctamente');
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'No se pudo agregar el método de pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan || !selectedPaymentMethod) {
      Alert.alert('Error', 'Selecciona un plan y método de pago');
      return;
    }

    try {
      setIsProcessing(true);
      
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      if (!paymentMethod) {
        throw new Error('Método de pago no encontrado');
      }

      // Procesar pago con el servicio de monetización
      const paymentResult = await monetizationService.processSubscriptionPayment(
        user?.uid || '',
        selectedPlan.id,
        selectedPlan.price,
        selectedPaymentMethod
      );

      if (paymentResult && paymentResult.status === 'completed') {
        // Suscribir al plan
        const subscriptionSuccess = await subscribeToPlan(selectedPlan.id);
        
        if (subscriptionSuccess) {
          analyticsManager.trackEvent('subscription_payment_success', {
            userId: user?.uid,
            planId: selectedPlan.id,
            amount: selectedPlan.price,
            paymentMethod: paymentMethod.type
          });
          
          onPaymentSuccess?.({
            planId: selectedPlan.id,
            amount: selectedPlan.price,
            paymentMethod: paymentMethod.type,
            transactionId: paymentResult.transactionId
          });
          
          Alert.alert(
            '¡Pago Exitoso!',
            `Te has suscrito a ${selectedPlan.name}. ¡Disfruta de todas las funciones premium!`,
            [{ text: 'OK', onPress: onClose }]
          );
        } else {
          throw new Error('Error al activar la suscripción');
        }
      } else {
        throw new Error('Error al procesar el pago');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      analyticsManager.trackEvent('subscription_payment_failed', {
        userId: user?.uid,
        planId: selectedPlan?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      Alert.alert(
        'Error de Pago',
        'No se pudo procesar tu pago. Por favor verifica tu información e inténtalo de nuevo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const resetForms = () => {
    setCardForm({
      number: '',
      expiryMonth: '',
      expiryYear: '',
      cvc: '',
      holderName: '',
      saveCard: true
    });
    setPaypalEmail('');
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Métodos de Pago</Text>
      
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethodCard,
            selectedPaymentMethod === method.id && styles.selectedPaymentMethod
          ]}
          onPress={() => setSelectedPaymentMethod(method.id)}
        >
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons
                name={getPaymentMethodIcon(method.type)}
                size={24}
                color={selectedPaymentMethod === method.id ? '#8B5CF6' : '#6B7280'}
              />
            </View>
            
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.paymentMethodTitle}>
                {getPaymentMethodTitle(method)}
              </Text>
              <Text style={styles.paymentMethodSubtitle}>
                {getPaymentMethodSubtitle(method)}
              </Text>
            </View>
            
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Predeterminado</Text>
              </View>
            )}
          </View>
          
          {selectedPaymentMethod === method.id && (
            <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
          )}
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={styles.addPaymentButton}
        onPress={() => setShowAddPayment(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#8B5CF6" />
        <Text style={styles.addPaymentText}>Agregar Método de Pago</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddPaymentModal = () => (
    <Modal
      visible={showAddPayment}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Agregar Método de Pago</Text>
          <TouchableOpacity onPress={() => setShowAddPayment(false)}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Payment Type Selector */}
          <View style={styles.paymentTypeSelector}>
            {[
              { type: 'card', icon: 'card-outline', label: 'Tarjeta' },
              { type: 'paypal', icon: 'logo-paypal', label: 'PayPal' },
              { type: 'apple_pay', icon: 'logo-apple', label: 'Apple Pay' },
              { type: 'google_pay', icon: 'logo-google', label: 'Google Pay' }
            ].map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.paymentTypeOption,
                  selectedPaymentType === option.type && styles.selectedPaymentType
                ]}
                onPress={() => setSelectedPaymentType(option.type as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={selectedPaymentType === option.type ? '#8B5CF6' : '#6B7280'}
                />
                <Text style={[
                  styles.paymentTypeLabel,
                  selectedPaymentType === option.type && styles.selectedPaymentTypeLabel
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Card Form */}
          {selectedPaymentType === 'card' && (
            <View style={styles.cardForm}>
              <Text style={styles.formLabel}>Número de Tarjeta</Text>
              <TextInput
                style={styles.input}
                value={formatCardNumber(cardForm.number)}
                onChangeText={(text) => setCardForm({...cardForm, number: text.replace(/\s/g, '')})}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                maxLength={19}
              />
              
              <View style={styles.cardRow}>
                <View style={styles.cardColumn}>
                  <Text style={styles.formLabel}>Mes</Text>
                  <TextInput
                    style={styles.input}
                    value={cardForm.expiryMonth}
                    onChangeText={(text) => setCardForm({...cardForm, expiryMonth: text})}
                    placeholder="MM"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                
                <View style={styles.cardColumn}>
                  <Text style={styles.formLabel}>Año</Text>
                  <TextInput
                    style={styles.input}
                    value={cardForm.expiryYear}
                    onChangeText={(text) => setCardForm({...cardForm, expiryYear: text})}
                    placeholder="YYYY"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                
                <View style={styles.cardColumn}>
                  <Text style={styles.formLabel}>CVC</Text>
                  <TextInput
                    style={styles.input}
                    value={cardForm.cvc}
                    onChangeText={(text) => setCardForm({...cardForm, cvc: text})}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <Text style={styles.formLabel}>Nombre del Titular</Text>
              <TextInput
                style={styles.input}
                value={cardForm.holderName}
                onChangeText={(text) => setCardForm({...cardForm, holderName: text})}
                placeholder="Nombre completo"
                placeholderTextColor="#6B7280"
              />
            </View>
          )}
          
          {/* PayPal Form */}
          {selectedPaymentType === 'paypal' && (
            <View style={styles.paypalForm}>
              <Text style={styles.formLabel}>Email de PayPal</Text>
              <TextInput
                style={styles.input}
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPaymentMethod}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.addButtonText}>Agregar Método</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return 'card-outline';
      case 'paypal': return 'logo-paypal';
      case 'apple_pay': return 'logo-apple';
      case 'google_pay': return 'logo-google';
      default: return 'card-outline';
    }
  };

  const getPaymentMethodTitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card': return `${method.brand?.toUpperCase()} •••• ${method.last4}`;
      case 'paypal': return 'PayPal';
      case 'apple_pay': return 'Apple Pay';
      case 'google_pay': return 'Google Pay';
      default: return 'Método de Pago';
    }
  };

  const getPaymentMethodSubtitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card': return `Expira ${method.expiryMonth}/${method.expiryYear}`;
      case 'paypal': return method.email;
      default: return 'Configurado';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Gestión de Pagos</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {selectedPlan && (
          <View style={styles.planSummary}>
            <Text style={styles.planName}>{selectedPlan.name}</Text>
            <Text style={styles.planPrice}>${selectedPlan.price}/mes</Text>
            
            <View style={styles.autoRenewContainer}>
              <Text style={styles.autoRenewLabel}>Renovación automática</Text>
              <Switch
                value={autoRenew}
                onValueChange={setAutoRenew}
                trackColor={{ false: '#374151', true: '#8B5CF6' }}
                thumbColor={autoRenew ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>
        )}
        
        <ScrollView style={styles.content}>
          {renderPaymentMethods()}
          
          {selectedPlan && (
            <TouchableOpacity
              style={[
                styles.payButton,
                (!selectedPaymentMethod || isProcessing) && styles.payButtonDisabled
              ]}
              onPress={handleProcessPayment}
              disabled={!selectedPaymentMethod || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pagar ${selectedPlan.price}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
        
        {renderAddPaymentModal()}
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  planSummary: {
    backgroundColor: '#374151',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  autoRenewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoRenewLabel: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentMethod: {
    borderColor: '#8B5CF6',
    backgroundColor: '#4C1D95',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B5563',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  payButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  payButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  paymentTypeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  paymentTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentType: {
    borderColor: '#8B5CF6',
    backgroundColor: '#4C1D95',
  },
  paymentTypeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  selectedPaymentTypeLabel: {
    color: 'white',
  },
  cardForm: {
    marginBottom: 24,
  },
  paypalForm: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardColumn: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default PaymentManager;