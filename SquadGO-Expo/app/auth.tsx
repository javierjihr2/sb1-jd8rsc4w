import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Picker } from '@react-native-picker/picker';
import { registerUser, loginUser, checkUsernameAvailability } from '../lib/auth';

const { width, height } = Dimensions.get('window');

// Listas de opciones para los selectores
const countries = [
  { label: 'Selecciona tu país', value: '' },
  { label: '🇦🇷 Argentina', value: 'AR' },
  { label: '🇧🇷 Brasil', value: 'BR' },
  { label: '🇨🇱 Chile', value: 'CL' },
  { label: '🇨🇴 Colombia', value: 'CO' },
  { label: '🇪🇸 España', value: 'ES' },
  { label: '🇲🇽 México', value: 'MX' },
  { label: '🇵🇪 Perú', value: 'PE' },
  { label: '🇺🇸 Estados Unidos', value: 'US' },
  { label: '🇺🇾 Uruguay', value: 'UY' },
  { label: '🇻🇪 Venezuela', value: 'VE' },
];

const gameServers = [
  { label: 'Selecciona tu servidor', value: '' },
  { label: '🌎 América del Norte', value: 'NA' },
  { label: '🌎 América del Sur', value: 'SA' },
  { label: '🌍 Europa Occidental', value: 'EUW' },
  { label: '🌍 Europa Nórdica y Este', value: 'EUNE' },
  { label: '🌏 Asia-Pacífico', value: 'APAC' },
  { label: '🌏 Japón', value: 'JP' },
  { label: '🌏 Corea', value: 'KR' },
];

const genders = [
  { label: 'Selecciona tu género', value: '' },
  { label: '👨 Masculino', value: 'M' },
  { label: '👩 Femenino', value: 'F' },
  { label: '🏳️‍⚧️ No binario', value: 'NB' },
  { label: '🤐 Prefiero no decir', value: 'X' },
];

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [registrationStep, setRegistrationStep] = useState(1); // 1: credenciales, 2: perfil
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Campos del perfil (paso 2)
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [gameServer, setGameServer] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [usernameExists, setUsernameExists] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación del logo
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Animaciones de partículas flotantes
    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Función para verificar disponibilidad del username
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const isAvailable = await checkUsernameAvailability(username);
      return !isAvailable; // Invertir porque checkUsernameAvailability retorna true si está disponible
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleAuth = async () => {
    if (loading) return;
    
    setLoading(true);
    setUsernameExists(false);

    try {
      if (isLogin) {
        // Lógica de login con Firebase
        if (!email || !password) {
          Alert.alert('Error', 'Por favor completa todos los campos');
          return;
        }

        const result = await loginUser(email, password);
        
        if (result.success) {
          Alert.alert('¡Éxito!', '¡Bienvenido de vuelta! 🎮', [
            { text: 'Continuar', onPress: () => router.replace('/(tabs)') }
          ]);
        } else {
          Alert.alert('Error', result.error || 'Error al iniciar sesión');
        }
      } else {
        // Lógica de registro multi-paso con Firebase
        if (registrationStep === 1) {
          // Validar credenciales básicas
          if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
          }

          if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
          }

          if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
          }

          // Avanzar al paso 2
          setRegistrationStep(2);
        } else if (registrationStep === 2) {
          // Validar campos de perfil
          if (!fullName || !username || !country || !gameServer || !age || !gender) {
            Alert.alert('Error', 'Por favor completa todos los campos del perfil');
            return;
          }

          if (parseInt(age) < 13 || parseInt(age) > 99) {
            Alert.alert('Error', 'La edad debe estar entre 13 y 99 años');
            return;
          }

          // Verificar username único con Firebase
          const usernameAlreadyExists = await checkUsernameExists(username);
          if (usernameAlreadyExists) {
            setUsernameExists(true);
            Alert.alert('Error', 'Este nombre de usuario ya está en uso');
            return;
          }

          // Registrar usuario con Firebase
          const result = await registerUser(email, password, {
            fullName,
            username,
            country,
            gameServer,
            age: parseInt(age),
            gender
          });
          
          if (result.success) {
            Alert.alert('¡Cuenta creada!', '¡Bienvenido a SquadGO! 🚀', [
              { text: 'Comenzar', onPress: () => router.replace('/(tabs)') }
            ]);
          } else {
            Alert.alert('Error', result.error || 'Error al crear la cuenta');
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Algo salió mal. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLogin(!isLogin);
    setRegistrationStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFullName('');
    setCountry('');
    setGameServer('');
    setAge('');
    setGender('');
    setUsernameExists(false);
  };

  const goBackToStep1 = () => {
    setRegistrationStep(1);
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Fondo animado con gradiente */}
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E', '#0F3460']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Partículas flotantes */}
      {particleAnims.map((anim, index) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [height, -100],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: (width / 6) * index + Math.random() * 50,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              {/* Header Premium */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Animated.View
                    style={[
                      styles.logoWrapper,
                      { transform: [{ rotate: logoRotate }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
                      style={styles.logoGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Image 
                        source={require('../assets/logo.png')} 
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.logoText}>SquadGO</Text>
                    <View style={styles.logoUnderline} />
                  </View>
                </View>
                <Text style={styles.tagline}>
                  🚀 La experiencia gaming definitiva
                </Text>
                <Text style={styles.subtitle}>
                  Conecta • Compite • Conquista
                </Text>
              </View>

              {/* Tarjeta de autenticación premium */}
              <BlurView intensity={20} style={styles.authCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} 
                  style={styles.cardGradient}
                >
                  <View style={styles.authHeader}>
                    <Text style={styles.authTitle}>
                      {isLogin 
                        ? '🎮 Bienvenido de vuelta' 
                        : (registrationStep === 1 
                          ? '✨ Únete a la élite' 
                          : '🎯 Completa tu perfil'
                        )
                      }
                    </Text>
                    <Text style={styles.authSubtitle}>
                      {isLogin 
                        ? 'Tu squad te está esperando' 
                        : (registrationStep === 1 
                          ? 'Crea tu leyenda gaming' 
                          : 'Personaliza tu experiencia'
                        )
                      }
                    </Text>
                    {!isLogin && registrationStep === 2 && (
                      <TouchableOpacity onPress={goBackToStep1} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.form}>
                    {/* PASO 1: Credenciales básicas */}
                    {(isLogin || (!isLogin && registrationStep === 1)) && (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>📧 Email</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'email' && styles.inputFocused
                          ]}>
                            <TextInput
                              style={styles.input}
                              placeholder="tu@email.com"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              value={email}
                              onChangeText={setEmail}
                              onFocus={() => setFocusedInput('email')}
                              onBlur={() => setFocusedInput(null)}
                              keyboardType="email-address"
                              autoCapitalize="none"
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>🔒 Contraseña</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'password' && styles.inputFocused
                          ]}>
                            <TextInput
                              style={styles.input}
                              placeholder="••••••••"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              value={password}
                              onChangeText={setPassword}
                              onFocus={() => setFocusedInput('password')}
                              onBlur={() => setFocusedInput(null)}
                              secureTextEntry
                            />
                          </View>
                        </View>

                        {!isLogin && (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>🔐 Confirmar contraseña</Text>
                            <View style={[
                              styles.inputContainer,
                              focusedInput === 'confirmPassword' && styles.inputFocused
                            ]}>
                              <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                onFocus={() => setFocusedInput('confirmPassword')}
                                onBlur={() => setFocusedInput(null)}
                                secureTextEntry
                              />
                            </View>
                          </View>
                        )}
                      </>
                    )}

                    {/* PASO 2: Información del perfil */}
                    {!isLogin && registrationStep === 2 && (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>👤 Nombre completo</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'fullName' && styles.inputFocused
                          ]}>
                            <TextInput
                              style={styles.input}
                              placeholder="Tu nombre real"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              value={fullName}
                              onChangeText={setFullName}
                              onFocus={() => setFocusedInput('fullName')}
                              onBlur={() => setFocusedInput(null)}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>🎮 Nombre de usuario</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'username' && styles.inputFocused
                          ]}>
                            <TextInput
                              style={styles.input}
                              placeholder="Tu alias de leyenda"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              value={username}
                              onChangeText={setUsername}
                              onFocus={() => setFocusedInput('username')}
                              onBlur={() => setFocusedInput(null)}
                              autoCapitalize="none"
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>🌍 País</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'country' && styles.inputFocused
                          ]}>
                            <Picker
                              selectedValue={country}
                              onValueChange={(value) => setCountry(value)}
                              style={styles.picker}
                              dropdownIconColor="#FFFFFF"
                            >
                              {countries.map((item) => (
                                <Picker.Item
                                  key={item.value}
                                  label={item.label}
                                  value={item.value}
                                  color={Platform.OS === 'ios' ? '#FFFFFF' : '#000000'}
                                />
                              ))}
                            </Picker>
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>🎯 Servidor de juego</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'gameServer' && styles.inputFocused
                          ]}>
                            <Picker
                              selectedValue={gameServer}
                              onValueChange={(value) => setGameServer(value)}
                              style={styles.picker}
                              dropdownIconColor="#FFFFFF"
                            >
                              {gameServers.map((item) => (
                                <Picker.Item
                                  key={item.value}
                                  label={item.label}
                                  value={item.value}
                                  color={Platform.OS === 'ios' ? '#FFFFFF' : '#000000'}
                                />
                              ))}
                            </Picker>
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>🎂 Edad</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'age' && styles.inputFocused
                          ]}>
                            <TextInput
                              style={styles.input}
                              placeholder="Tu edad"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              value={age}
                              onChangeText={setAge}
                              onFocus={() => setFocusedInput('age')}
                              onBlur={() => setFocusedInput(null)}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>⚧ Género</Text>
                          <View style={[
                            styles.inputContainer,
                            focusedInput === 'gender' && styles.inputFocused
                          ]}>
                            <Picker
                              selectedValue={gender}
                              onValueChange={(value) => setGender(value)}
                              style={styles.picker}
                              dropdownIconColor="#FFFFFF"
                            >
                              {genders.map((item) => (
                                <Picker.Item
                                  key={item.value}
                                  label={item.label}
                                  value={item.value}
                                  color={Platform.OS === 'ios' ? '#FFFFFF' : '#000000'}
                                />
                              ))}
                            </Picker>
                          </View>
                        </View>
                      </>
                    )}

                    {!isLogin && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>🔐 Confirmar contraseña</Text>
                        <View style={[
                          styles.inputContainer,
                          focusedInput === 'confirmPassword' && styles.inputFocused
                        ]}>
                          <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onFocus={() => setFocusedInput('confirmPassword')}
                            onBlur={() => setFocusedInput(null)}
                            secureTextEntry
                          />
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.authButton, loading && styles.authButtonDisabled]}
                      onPress={handleAuth}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={loading ? ['#64748B', '#475569'] : ['#FF6B6B', '#4ECDC4']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.authButtonText}>
                          {loading ? '⚡ Procesando...' : 
                            isLogin ? '🚀 Iniciar Sesión' : 
                            registrationStep === 1 ? '➡️ Continuar' : '✨ Crear Cuenta'
                          }
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {isLogin && (
                      <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>
                          ¿Olvidaste tu contraseña? 🤔
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </BlurView>

              {/* Toggle de modo */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin ? '¿Nuevo en SquadGO?' : '¿Ya tienes cuenta?'}
                </Text>
                <TouchableOpacity onPress={toggleAuthMode}>
                  <Text style={styles.toggleButton}>
                    {isLogin ? '🌟 Únete ahora' : '🎮 Inicia sesión'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Features premium */}
              <View style={styles.features}>
                <Text style={styles.featuresTitle}>🏆 Experiencia Premium</Text>
                <View style={styles.featuresList}>
                  <View style={styles.feature}>
                    <LinearGradient
                      colors={['rgba(255,107,107,0.2)', 'rgba(78,205,196,0.2)']}
                      style={styles.featureGradient}
                    >
                      <Text style={styles.featureIcon}>🎯</Text>
                      <Text style={styles.featureText}>Matchmaking inteligente</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.feature}>
                    <LinearGradient
                      colors={['rgba(69,183,209,0.2)', 'rgba(150,206,180,0.2)']}
                      style={styles.featureGradient}
                    >
                      <Text style={styles.featureIcon}>🏅</Text>
                      <Text style={styles.featureText}>Torneos épicos</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.feature}>
                    <LinearGradient
                      colors={['rgba(150,206,180,0.2)', 'rgba(255,107,107,0.2)']}
                      style={styles.featureGradient}
                    >
                      <Text style={styles.featureIcon}>💬</Text>
                      <Text style={styles.featureText}>Chat en tiempo real</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* Botón para volver al home */}
              <TouchableOpacity 
                style={styles.backToHomeButton}
                onPress={() => router.push('/home')}
                activeOpacity={0.8}
              >
                <Text style={styles.backToHomeText}>← Volver al inicio</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 15,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  titleContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255,107,107,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  logoUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#FF6B6B',
    marginTop: 5,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#4ECDC4',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  authCard: {
    borderRadius: 25,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  cardGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  inputFocused: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78,205,196,0.1)',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  authButton: {
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 15,
  },
  authButtonDisabled: {
    shadowOpacity: 0.1,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    gap: 8,
  },
  toggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  toggleButton: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
  features: {
    marginTop: 10,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    gap: 15,
  },
  feature: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  backToHomeButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
  },
  backToHomeText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
});