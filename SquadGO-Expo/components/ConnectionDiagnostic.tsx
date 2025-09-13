import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface ConnectionDiagnosticProps {
  visible: boolean;
  onClose: () => void;
}

export const ConnectionDiagnostic: React.FC<ConnectionDiagnosticProps> = ({ visible, onClose }) => {
  const [authStatus, setAuthStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [testResults, setTestResults] = useState<string[]>([]);

  const runDiagnostic = async () => {
    setTestResults(['🔧 Iniciando diagnóstico...']);
    
    // Test 1: Firebase Auth
    try {
      setTestResults(prev => [...prev, '🔐 Probando Firebase Auth...']);
      // Verificar solo la configuración de auth sin credenciales hardcodeadas
      if (auth && auth.app) {
        setAuthStatus('connected');
        setTestResults(prev => [...prev, '✅ Firebase Auth: Configuración válida']);
      } else {
        throw new Error('Auth no configurado');
      }
      
      // Test 2: Firestore
      try {
        setTestResults(prev => [...prev, '📊 Probando Firestore...']);
        const testDoc = await Promise.race([
          getDoc(doc(db, 'users', auth.currentUser?.uid || 'test-user')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        setFirestoreStatus('connected');
        setTestResults(prev => [...prev, '✅ Firestore: Conectado']);
      } catch (firestoreError) {
        setFirestoreStatus('error');
        setTestResults(prev => [...prev, `❌ Firestore: Error - ${(firestoreError as Error).message}`]);
      }
      
      // Cerrar sesión
      await auth.signOut();
      setTestResults(prev => [...prev, '🚪 Sesión de prueba cerrada']);
      
    } catch (authError) {
      setAuthStatus('error');
      setTestResults(prev => [...prev, `❌ Firebase Auth: Error - ${(authError as Error).message}`]);
    }
  };

  useEffect(() => {
    if (visible) {
      runDiagnostic();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <View style={{
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        maxHeight: '80%'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Diagnóstico de Conexión</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons 
              name={authStatus === 'connected' ? 'checkmark-circle' : authStatus === 'error' ? 'close-circle' : 'time'} 
              size={20} 
              color={authStatus === 'connected' ? 'green' : authStatus === 'error' ? 'red' : 'orange'} 
            />
            <Text style={{ marginLeft: 10 }}>Firebase Auth: {authStatus}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons 
              name={firestoreStatus === 'connected' ? 'checkmark-circle' : firestoreStatus === 'error' ? 'close-circle' : 'time'} 
              size={20} 
              color={firestoreStatus === 'connected' ? 'green' : firestoreStatus === 'error' ? 'red' : 'orange'} 
            />
            <Text style={{ marginLeft: 10 }}>Firestore: {firestoreStatus}</Text>
          </View>
        </View>

        <View style={{ maxHeight: 200 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Resultados del Test:</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={{ fontSize: 12, marginBottom: 5, fontFamily: 'monospace' }}>
              {result}
            </Text>
          ))}
        </View>

        <TouchableOpacity 
          onPress={runDiagnostic}
          style={{
            backgroundColor: '#007AFF',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginTop: 20
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Ejecutar Diagnóstico Nuevamente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};