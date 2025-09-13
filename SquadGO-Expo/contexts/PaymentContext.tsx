import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'google_pay' | 'apple_pay' | 'bank_transfer';
  name: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'coins' | 'premium_item';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethodId: string;
  description: string;
  timestamp: number;
  receiptUrl?: string;
}

export interface PaymentContextType {
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  isProcessing: boolean;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (methodId: string) => Promise<boolean>;
  setDefaultPaymentMethod: (methodId: string) => Promise<boolean>;
  processPayment: (amount: number, currency: string, type: string, description: string, methodId?: string) => Promise<Transaction | null>;
  getTransactionHistory: () => Transaction[];
  refundTransaction: (transactionId: string) => Promise<boolean>;
  validatePaymentMethod: (method: Partial<PaymentMethod>) => boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      const [methodsData, transactionsData] = await Promise.all([
        AsyncStorage.getItem('payment_methods'),
        AsyncStorage.getItem('transactions')
      ]);

      if (methodsData) {
        setPaymentMethods(JSON.parse(methodsData));
      }
      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const savePaymentMethods = async (methods: PaymentMethod[]) => {
    try {
      await AsyncStorage.setItem('payment_methods', JSON.stringify(methods));
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error saving payment methods:', error);
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const validatePaymentMethod = (method: Partial<PaymentMethod>): boolean => {
    if (!method.type || !method.name) return false;
    
    if (method.type === 'card') {
      if (!method.last4 || method.last4.length !== 4) return false;
      if (!method.expiryDate || !/^\d{2}\/\d{2}$/.test(method.expiryDate)) return false;
    }
    
    return true;
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
    try {
      if (!validatePaymentMethod(method)) {
        Alert.alert('Error', 'Datos de método de pago inválidos');
        return false;
      }

      const newMethod: PaymentMethod = {
        ...method,
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Si es el primer método o se marca como predeterminado, hacer que sea el predeterminado
      if (paymentMethods.length === 0 || method.isDefault) {
        const updatedMethods = paymentMethods.map(pm => ({ ...pm, isDefault: false }));
        await savePaymentMethods([...updatedMethods, newMethod]);
      } else {
        await savePaymentMethods([...paymentMethods, newMethod]);
      }

      Alert.alert('Éxito', 'Método de pago agregado correctamente');
      return true;
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'No se pudo agregar el método de pago');
      return false;
    }
  };

  const removePaymentMethod = async (methodId: string): Promise<boolean> => {
    try {
      const updatedMethods = paymentMethods.filter(pm => pm.id !== methodId);
      
      // Si se elimina el método predeterminado y hay otros métodos, hacer el primero predeterminado
      if (updatedMethods.length > 0) {
        const removedMethod = paymentMethods.find(pm => pm.id === methodId);
        if (removedMethod?.isDefault) {
          updatedMethods[0].isDefault = true;
        }
      }
      
      await savePaymentMethods(updatedMethods);
      Alert.alert('Éxito', 'Método de pago eliminado');
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      Alert.alert('Error', 'No se pudo eliminar el método de pago');
      return false;
    }
  };

  const setDefaultPaymentMethod = async (methodId: string): Promise<boolean> => {
    try {
      const updatedMethods = paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === methodId
      }));
      
      await savePaymentMethods(updatedMethods);
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  };

  const processPayment = async (
    amount: number,
    currency: string,
    type: string,
    description: string,
    methodId?: string
  ): Promise<Transaction | null> => {
    try {
      setIsProcessing(true);
      
      // Usar método predeterminado si no se especifica uno
      const paymentMethodId = methodId || paymentMethods.find(pm => pm.isDefault)?.id;
      
      if (!paymentMethodId) {
        Alert.alert('Error', 'No hay método de pago disponible');
        return null;
      }

      // Simular procesamiento de pago (en producción, aquí iría la integración real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular éxito/fallo (95% éxito)
      const isSuccess = Math.random() > 0.05;
      
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        type: type as 'subscription' | 'coins' | 'premium_item',
        status: isSuccess ? 'completed' : 'failed',
        paymentMethodId,
        description,
        timestamp: Date.now(),
        receiptUrl: isSuccess ? `https://receipts.squadgo.com/txn_${Date.now()}` : undefined
      };

      const updatedTransactions = [transaction, ...transactions];
      await saveTransactions(updatedTransactions);

      if (isSuccess) {
        Alert.alert('Pago Exitoso', `Se procesó el pago de ${amount} ${currency}`);
      } else {
        Alert.alert('Pago Fallido', 'No se pudo procesar el pago. Intenta nuevamente.');
      }

      return transaction;
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Error al procesar el pago');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionHistory = (): Transaction[] => {
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  };

  const refundTransaction = async (transactionId: string): Promise<boolean> => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction || transaction.status !== 'completed') {
        Alert.alert('Error', 'Transacción no válida para reembolso');
        return false;
      }

      // Simular procesamiento de reembolso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedTransactions = transactions.map(t => 
        t.id === transactionId ? { ...t, status: 'refunded' as const } : t
      );
      
      await saveTransactions(updatedTransactions);
      Alert.alert('Reembolso Exitoso', 'El reembolso ha sido procesado');
      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      Alert.alert('Error', 'No se pudo procesar el reembolso');
      return false;
    }
  };

  const value: PaymentContextType = {
    paymentMethods,
    transactions,
    isProcessing,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    processPayment,
    getTransactionHistory,
    refundTransaction,
    validatePaymentMethod
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};