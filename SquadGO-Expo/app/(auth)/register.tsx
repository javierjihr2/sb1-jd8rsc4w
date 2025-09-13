import React, { useState } from 'react';
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
import { ValidatedInput } from '../../components/ValidatedInput';
import { useFormValidation } from '../../utils/validation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const { validateField, validateForm, errors, isValid } = useFormValidation();

  const handleRegister = async () => {
    // Validar todos los campos usando el sistema de validación
    const formData = {
      username,
      displayName,
      country,
      email,
      password,
      confirmPassword
    };

    const validationRules = {
      username: ['required', 'username'],
      displayName: ['required', 'minLength:2'],
      country: ['required', 'minLength:2'],
      email: ['required', 'email'],
      password: ['required', 'password'],
      confirmPassword: ['required']
    };

    const validationResult = validateForm(formData, validationRules);
    
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('Error de validación', firstError);
      return;
    }

    // Validación adicional para confirmar contraseña
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Iniciando proceso de registro...');
      
      await signUp(email, password, {
        displayName,
        username,
        countryCode: country,
        bio: 'Nuevo jugador de PUBG Mobile',
        region: 'S.A.',
        language: 'es',
        mic: false,
        roles: ['Jugador'],
        rankTier: 'Bronce'
      });
      
      console.log('✅ Registro completado, navegando a feed...');
      
      // Navegación directa después del registro exitoso
      setTimeout(() => {
        router.replace('/(tabs)/feed');
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      Alert.alert('Error', error.message || 'Error al crear la cuenta');
      setLoading(false); // Solo quitar loading si hay error
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
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Image
                source={require('../../assets/logo.png')}
                style={{
                  width: 40,
                  height: 40,
                  marginRight: 10
                }}
              />
              <View style={{ flexDirection: 'row' }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#fbbf24'
                }}>Squad</Text>
                <Text style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>GO</Text>
              </View>
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: 8
            }}>
              Crear Cuenta
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              Únete a la comunidad de SquadGO
            </Text>
          </View>

          {/* Formulario */}
          <View style={{ marginBottom: 30 }}>
            <ValidatedInput
              label="Nombre de Usuario"
              value={username}
              onChangeText={setUsername}
              placeholder="3-20 caracteres, solo letras, números y _"
              rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 3, maxLength: 20, pattern: /^[a-zA-Z0-9_]+$/, message: 'El nombre de usuario debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos' }]}
              autoCapitalize="none"
              containerStyle={{ marginBottom: 16 }}
            />

            <ValidatedInput
              label="Nombre Completo"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tu nombre completo"
              rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 2, message: 'Debe tener al menos 2 caracteres' }]}
              containerStyle={{ marginBottom: 16 }}
            />

            <ValidatedInput
              label="País"
              value={country}
              onChangeText={setCountry}
              placeholder="Ej: México, Colombia, Argentina..."
              rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 2, message: 'Debe tener al menos 2 caracteres' }]}
              containerStyle={{ marginBottom: 16 }}
            />

            <ValidatedInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              rules={[{ required: true, message: 'Este campo es obligatorio' }, { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresa un email válido' }]}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={{ marginBottom: 16 }}
            />

            <ValidatedInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mín. 8 caracteres, mayús., minús., número y símbolo"
              rules={[{ required: true, message: 'Este campo es obligatorio' }, { minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial' }]}
              secureTextEntry
              containerStyle={{ marginBottom: 16 }}
            />

            <ValidatedInput
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              rules={[{ required: true, message: 'Este campo es obligatorio' }]}
              secureTextEntry
              containerStyle={{ marginBottom: 20 }}
            />

            {/* Botón de registro */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Crear cuenta"
              accessibilityHint="Registra una nueva cuenta con los datos proporcionados"
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
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600'
                }}>
                  Crear Cuenta
                </Text>
              )}
            </TouchableOpacity>

            {/* Link a login */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Ir a iniciar sesión"
              accessibilityHint="Navega a la pantalla de inicio de sesión si ya tienes una cuenta"
              style={{ alignItems: 'center' }}
            >
              <Text style={{
                color: '#9ca3af',
                fontSize: 16
              }}>
                ¿Ya tienes cuenta?{' '}
                <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                  Inicia Sesión
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}