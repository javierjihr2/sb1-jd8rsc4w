import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePayment, PaymentMethod } from '../contexts/PaymentContext';

interface PaymentMethodsProps {
  visible: boolean;
  onClose: () => void;
  onSelectMethod?: (methodId: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  visible,
  onClose,
  onSelectMethod
}) => {
  const {
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    isProcessing
  } = usePayment();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: 'card' as const,
    name: '',
    last4: '',
    expiryDate: '',
    isDefault: false
  });

  const paymentTypeIcons = {
    card: 'card',
    paypal: 'logo-paypal',
    google_pay: 'logo-google',
    apple_pay: 'logo-apple',
    bank_transfer: 'business'
  };

  const paymentTypeNames = {
    card: 'Tarjeta de Crédito/Débito',
    paypal: 'PayPal',
    google_pay: 'Google Pay',
    apple_pay: 'Apple Pay',
    bank_transfer: 'Transferencia Bancaria'
  };

  const handleAddMethod = async () => {
    if (!newMethod.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el método de pago');
      return;
    }

    if (newMethod.type === 'card') {
      if (!newMethod.last4 || newMethod.last4.length !== 4) {
        Alert.alert('Error', 'Por favor ingresa los últimos 4 dígitos de la tarjeta');
        return;
      }
      if (!newMethod.expiryDate || !/^\d{2}\/\d{2}$/.test(newMethod.expiryDate)) {
        Alert.alert('Error', 'Por favor ingresa la fecha de vencimiento (MM/YY)');
        return;
      }
    }

    const success = await addPaymentMethod(newMethod);
    if (success) {
      setNewMethod({
        type: 'card',
        name: '',
        last4: '',
        expiryDate: '',
        isDefault: false
      });
      setShowAddForm(false);
    }
  };

  const handleRemoveMethod = (methodId: string) => {
    Alert.alert(
      'Eliminar Método de Pago',
      '¿Estás seguro de que quieres eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removePaymentMethod(methodId)
        }
      ]
    );
  };

  const handleSetDefault = async (methodId: string) => {
    await setDefaultPaymentMethod(methodId);
  };

  const handleSelectMethod = (methodId: string) => {
    if (onSelectMethod) {
      onSelectMethod(methodId);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Métodos de Pago</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Payment Methods List */}
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                method.isDefault && styles.defaultMethodCard
              ]}
              onPress={() => onSelectMethod ? handleSelectMethod(method.id) : handleSetDefault(method.id)}
            >
              <LinearGradient
                colors={method.isDefault ? ['#1e40af', '#3b82f6'] : ['#1e293b', '#334155']}
                style={styles.methodCardGradient}
              >
                <View style={styles.methodInfo}>
                  <View style={styles.methodHeader}>
                    <Ionicons
                      name={paymentTypeIcons[method.type] as any}
                      size={24}
                      color={method.isDefault ? '#ffffff' : '#94a3b8'}
                    />
                    <Text style={[
                      styles.methodName,
                      method.isDefault && styles.defaultMethodText
                    ]}>
                      {method.name}
                    </Text>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Predeterminado</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.methodType,
                    method.isDefault && styles.defaultMethodText
                  ]}>
                    {paymentTypeNames[method.type]}
                    {method.type === 'card' && method.last4 && ` •••• ${method.last4}`}
                  </Text>
                  
                  {method.type === 'card' && method.expiryDate && (
                    <Text style={[
                      styles.methodExpiry,
                      method.isDefault && styles.defaultMethodText
                    ]}>
                      Vence: {method.expiryDate}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  onPress={() => handleRemoveMethod(method.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {paymentMethods.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#64748b" />
              <Text style={styles.emptyStateText}>No hay métodos de pago</Text>
              <Text style={styles.emptyStateSubtext}>
                Agrega un método de pago para realizar compras
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add Payment Method Form */}
        <Modal
          visible={showAddForm}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setShowAddForm(false)}
        >
          <LinearGradient
            colors={['#0f172a', '#1e293b']}
            style={styles.formContainer}
          >
            <View style={styles.formHeader}>
              <TouchableOpacity
                onPress={() => setShowAddForm(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#f8fafc" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Agregar Método de Pago</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.formContent}>
              {/* Payment Type Selection */}
              <Text style={styles.fieldLabel}>Tipo de Pago</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeSelector}>
                  {Object.entries(paymentTypeNames).map(([type, name]) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newMethod.type === type && styles.selectedTypeOption
                      ]}
                      onPress={() => setNewMethod({ ...newMethod, type: type as any })}
                    >
                      <Ionicons
                        name={paymentTypeIcons[type as keyof typeof paymentTypeIcons] as any}
                        size={24}
                        color={newMethod.type === type ? '#3b82f6' : '#64748b'}
                      />
                      <Text style={[
                        styles.typeOptionText,
                        newMethod.type === type && styles.selectedTypeOptionText
                      ]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Name Field */}
              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.textInput}
                value={newMethod.name}
                onChangeText={(text) => setNewMethod({ ...newMethod, name: text })}
                placeholder="Ej: Mi Tarjeta Principal"
                placeholderTextColor="#64748b"
              />

              {/* Card-specific fields */}
              {newMethod.type === 'card' && (
                <>
                  <Text style={styles.fieldLabel}>Últimos 4 dígitos</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newMethod.last4}
                    onChangeText={(text) => setNewMethod({ ...newMethod, last4: text.slice(0, 4) })}
                    placeholder="1234"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={4}
                  />

                  <Text style={styles.fieldLabel}>Fecha de Vencimiento</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newMethod.expiryDate}
                    onChangeText={(text) => {
                      // Auto-format MM/YY
                      let formatted = text.replace(/\D/g, '');
                      if (formatted.length >= 2) {
                        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
                      }
                      setNewMethod({ ...newMethod, expiryDate: formatted });
                    }}
                    placeholder="MM/YY"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </>
              )}

              {/* Default checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setNewMethod({ ...newMethod, isDefault: !newMethod.isDefault })}
              >
                <View style={[
                  styles.checkbox,
                  newMethod.isDefault && styles.checkedCheckbox
                ]}>
                  {newMethod.isDefault && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Establecer como predeterminado</Text>
              </TouchableOpacity>

              {/* Add Button */}
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={handleAddMethod}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.addMethodButtonGradient}
                >
                  <Text style={styles.addMethodButtonText}>
                    {isProcessing ? 'Agregando...' : 'Agregar Método'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  methodCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  defaultMethodCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  methodCardGradient: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginLeft: 12,
    flex: 1,
  },
  defaultMethodText: {
    color: '#ffffff',
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  methodType: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 2,
  },
  methodExpiry: {
    fontSize: 12,
    color: '#64748b',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  placeholder: {
    width: 40,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  selectedTypeOption: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: '#3b82f6',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#64748b',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#f8fafc',
  },
  addMethodButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  addMethodButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addMethodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});