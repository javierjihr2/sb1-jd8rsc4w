import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContextSimple';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ConnectionDiagnostic } from '../../components/ConnectionDiagnostic';
import { ValidatedInput } from '../../components/ValidatedInput';
import { useFormValidation } from '../../utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const { validateField, validateForm, errors, isValid } = useFormValidation();
  const { 
    signIn, 
    signInWithBiometrics, 
    enableBiometricAuth, 
    isBiometricAvailable, 
    biometricType,
    signInOffline,
    isOfflineMode,
    isConnected,
    getOfflineStatus
  } = useAuth();

  const handleLogin = async () => {
    // Validar campos usando el sistema de validación
    const formData = { email, password };
    const validationRules = {
      email: ['required', 'email'],
      password: ['required', 'minLength:6']
    };

    const validationResult = validateForm(formData, validationRules);
    
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('Error de validación', firstError);
      return;
    }

    try {
      setLoading(true);
      
      // Verificar conectividad
      if (!isConnected) {
        setLoginProgress('Modo offline - Verificando credenciales...');
        
        // Intentar autenticación offline
        const offlineResult = await signInOffline(email, password);
        
        if (offlineResult.success) {
          setLoginProgress('¡Acceso offline concedido!');
          console.log('✅ Login offline exitoso');
          router.replace('/(tabs)/feed');
          return;
        } else {
          setLoginProgress('');
          Alert.alert(
            'Sin conexión', 
            'No hay credenciales offline disponibles. Conecta a internet para iniciar sesión.'
          );
          return;
        }
      }
      
      setLoginProgress('Conectando...');
      const result = await signIn(email, password);
      
      if (result.success) {
        setLoginProgress('¡Acceso concedido!');
        console.log('✅ Login exitoso');
        // Navegación inmediata sin delay
        router.replace('/(tabs)/feed');
      } else {
        setLoginProgress('');
        
        // Si falla online, intentar offline como respaldo
        if (result.error?.includes('Sin conexión') || result.error?.includes('network')) {
          setLoginProgress('Intentando modo offline...');
          const offlineResult = await signInOffline(email, password);
          
          if (offlineResult.success) {
            setLoginProgress('¡Acceso offline concedido!');
            console.log('✅ Login offline como respaldo exitoso');
            router.replace('/(tabs)/feed');
          } else {
            Alert.alert('Error de autenticación', 'No se pudo iniciar sesión online ni offline');
          }
        } else {
          Alert.alert('Error de autenticación', result.error || 'No se pudo iniciar sesión');
        }
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      setLoginProgress('');
      Alert.alert(
        'Error de autenticación',
        error.message || 'No se pudo iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestUser = async () => {
    setEmail('test@squadgo.com');
    setPassword('SquadGo2024!');
    // Auto-login después de establecer credenciales
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setLoginProgress(`Autenticando con ${biometricType}...`);
      
      const result = await signInWithBiometrics();
      
      if (result.success) {
        setLoginProgress('¡Acceso biométrico concedido!');
        console.log('✅ Login biométrico exitoso');
        router.replace('/(tabs)/feed');
      } else {
        setLoginProgress('');
        Alert.alert('Error de autenticación biométrica', result.error || 'No se pudo autenticar');
      }
    } catch (error: any) {
      console.error('❌ Error en login biométrico:', error);
      setLoginProgress('');
      Alert.alert('Error', 'Error en autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Primero inicia sesión para habilitar la autenticación biométrica');
      return;
    }

    try {
      const enabled = await enableBiometricAuth(email, password);
      if (enabled) {
        Alert.alert(
          'Éxito', 
          `Autenticación con ${biometricType} habilitada. Ahora puedes usar tu ${biometricType.toLowerCase()} para acceder rápidamente.`
        );
      } else {
        Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al configurar autenticación biométrica');
    }
  };



  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20
          }}
        >
          {/* Logo y título */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Image
                source={require('../../assets/logo.png')}
                style={{
                  width: 48,
                  height: 48,
                  marginRight: 12
                }}
              />
              <View style={{ flexDirection: 'row' }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#fbbf24'
                }}>Squad</Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>GO</Text>
              </View>
            </View>
            <Text style={{
              fontSize: 16,
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              Conecta con jugadores del Battle Royale
            </Text>
            
            {/* Indicador de conectividad */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: isConnected ? '#10b981' : '#f59e0b',
              borderRadius: 20,
              opacity: 0.9
            }}>
              <Ionicons 
                name={isConnected ? 'wifi' : 'wifi-outline'} 
                size={16} 
                color="white" 
                style={{ marginRight: 6 }}
              />
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600'
              }}>
                {isConnected ? 'Conectado' : 'Modo Offline'}
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={{ marginBottom: 30 }}>
            <ValidatedInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              rules={[
                { required: true, message: 'El email es requerido' },
                { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <ValidatedInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              rules={[
                { required: true, message: 'La contraseña es requerida' },
                { minLength: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
              ]}
              secureTextEntry
              icon="lock-closed-outline"
            />

            {/* Botón de usuario de prueba */}
            <TouchableOpacity
              onPress={handleTestUser}
              accessibilityRole="button"
              accessibilityLabel="Usar usuario de prueba"
              accessibilityHint="Llena automáticamente los campos con credenciales de prueba"
              style={{
                backgroundColor: '#059669',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 16
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600'
              }}>
                🧪 Usar Usuario de Prueba
              </Text>
            </TouchableOpacity>

            {/* Botón de login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
              accessibilityHint="Toca para iniciar sesión con tu email y contraseña"
              accessibilityState={{ disabled: loading }}
              style={{
                backgroundColor: loading ? '#6b7280' : '#3b82f6',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 16
              }}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="white" size="small" />
                  {loginProgress ? (
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '600',
                      marginLeft: 8
                    }}>
                      {loginProgress}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  Iniciar Sesión
                </Text>
              )}
            </TouchableOpacity>

            {/* Botón de autenticación biométrica */}
            {isBiometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Acceder con ${biometricType}`}
                accessibilityHint={`Usa tu ${biometricType} para iniciar sesión de forma rápida y segura`}
                accessibilityState={{ disabled: loading }}
                style={{
                  backgroundColor: loading ? '#6b7280' : '#8b5cf6',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 16,
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Ionicons 
                  name={biometricType.includes('Face') ? 'scan-outline' : 'finger-print-outline'} 
                  size={20} 
                  color="white" 
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Acceder con {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {/* Botón para habilitar biometría (solo si hay credenciales) */}
            {isBiometricAvailable && email && password && (
              <TouchableOpacity
                onPress={handleEnableBiometric}
                accessibilityRole="button"
                accessibilityLabel={`Habilitar ${biometricType}`}
                accessibilityHint={`Configura tu ${biometricType} para futuros inicios de sesión`}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: '#8b5cf6',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 16
                }}
              >
                <Text style={{
                  color: '#8b5cf6',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  🔐 Habilitar {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {/* Información del estado offline */}
            {isOfflineMode && (
              <View style={{
                backgroundColor: '#f59e0b',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons 
                  name="information-circle-outline" 
                  size={20} 
                  color="white" 
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 2
                  }}>
                    Modo Offline Activo
                  </Text>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    opacity: 0.9
                  }}>
                    Solo puedes acceder con credenciales guardadas previamente
                  </Text>
                </View>
              </View>
            )}

            {/* Link a registro */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
              accessibilityLabel="Ir a registro"
              accessibilityHint="Navega a la pantalla de registro para crear una nueva cuenta"
              style={{ alignItems: 'center' }}
            >
              <Text style={{
                color: '#9ca3af',
                fontSize: 16
              }}>
                ¿No tienes cuenta?{' '}
                <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                  Regístrate
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={{
            backgroundColor: '#374151',
            padding: 16,
            borderRadius: 12,
            marginTop: 20
          }}>
            <Text style={{
              color: '#3b82f6',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 8
            }}>
              👤 Usuario de Prueba:
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
              Email: test@squadgo.com
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
              Contraseña: SquadGo2024!
            </Text>
          </View>

          {/* Botón de diagnóstico */}
          <TouchableOpacity
            onPress={() => setShowDiagnostic(true)}
            accessibilityRole="button"
            accessibilityLabel="Diagnóstico de conexión"
            accessibilityHint="Abre herramientas para diagnosticar problemas de conexión"
            style={{
              backgroundColor: '#374151',
              padding: 12,
              borderRadius: 8,
              marginTop: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="medical" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={{ color: '#3b82f6', fontSize: 14 }}>
              Diagnóstico de Conexión
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Componente de diagnóstico */}
      <ConnectionDiagnostic 
        visible={showDiagnostic} 
        onClose={() => setShowDiagnostic(false)} 
      />
    </LinearGradient>
  );
}