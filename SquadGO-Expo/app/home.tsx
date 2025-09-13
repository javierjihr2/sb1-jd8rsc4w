import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Easing,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingParticles } from '../components/ui/MicroInteractions';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { AccessCountdown } from '../components/AccessCountdown';
import { SponsorshipHub } from '../components/SponsorshipHub';
import { RecommendationsHub } from '../components/RecommendationsHub';
import { useAccessControl } from '../lib/access-control';
import QRCodeGenerator from '../components/QRCodeGenerator';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Estados para modales
  const [showSponsorshipHub, setShowSponsorshipHub] = useState(false);
  const [showRecommendationsHub, setShowRecommendationsHub] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  // Hook de control de acceso
  const { stats, loading, canAccessMatch, canSendMessages, canCreateTournaments, canAccessPremiumFeatures, progressInfo } = useAccessControl();

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animación de rotación del logo (más suave y visible)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000, // Más rápido para ser más visible
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Easing más suave
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const navigateToSection = (section: string) => {
    router.push(`/(tabs)/${section}` as any);
  };

  const modernFeatures = [
    {
      icon: '🎮',
      title: 'Gaming Hub',
      subtitle: 'Conecta con gamers',
      route: 'chat',
      gradient: ['#667eea', '#764ba2'],
      requiresAccess: true,
    },
    {
      icon: '🌍',
      title: 'Explorar',
      subtitle: 'Descubre mundos',
      route: 'maps',
      gradient: ['#f093fb', '#f5576c'],
      requiresAccess: false,
    },
    {
      icon: '⚡',
      title: 'Noticias',
      subtitle: 'Últimas tendencias',
      route: 'feed',
      gradient: ['#4facfe', '#00f2fe'],
      requiresAccess: false,
    },
    {
      icon: '👑',
      title: 'Perfil',
      subtitle: 'Tu reino digital',
      route: 'settings',
      gradient: ['#43e97b', '#38f9d7'],
      requiresAccess: false,
    },
  ];
  
  const premiumFeatures = [
    {
      icon: 'qr-code',
      title: 'QR Revisor',
      subtitle: 'Revisar todas las páginas',
      action: () => setShowQRGenerator(true),
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      icon: 'business',
      title: 'Patrocinios',
      subtitle: 'Conecta con marcas',
      action: () => setShowSponsorshipHub(true),
      gradient: ['#667eea', '#764ba2'],
    },
    {
      icon: 'rocket',
      title: 'Recomendaciones',
      subtitle: 'Mejora tu app',
      action: () => setShowRecommendationsHub(true),
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      icon: 'star',
      title: 'Premium',
      subtitle: 'Funciones avanzadas',
      action: () => router.push('/subscriptions'),
      gradient: ['#f093fb', '#f5576c'],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Fondo simplificado */}
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientLayer1} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Logo y título compactos */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.heroContent}>
              {/* Logo con animación */}
              <View style={styles.logoContainer}>
                <FloatingParticles 
                  count={15} 
                  colors={['#667eea', '#764ba2', '#43e97b']} 
                  style={styles.logoParticles} 
                />
                <Animated.View 
                  style={[styles.logoWrapper, {
                    transform: [{ rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })}]
                  }]}
                >
                  <BlurView intensity={20} tint="dark" style={styles.logoBlur}>
                    <Image 
                      source={require('../assets/logo.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </BlurView>
                </Animated.View>
              </View>

              {/* Título simplificado */}
              <View style={styles.titleSection}>
                <Text style={styles.appName}>SQUADGO</Text>
                <Text style={styles.appTagline}>• CONECTA • JUEGA • CONQUISTA •</Text>
              </View>
            </View>
          </Animated.View>

          {/* Botones de Inicio de Sesión y Registro (Compactos) */}
          <Animated.View
            style={[
              styles.authSectionTop,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity
                style={styles.modernButton}
                onPress={() => router.push('/auth?mode=login')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4776E6', '#8E54E9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.modernButtonText}>Iniciar Sesión</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.secondaryButtonCompact}
              onPress={() => router.push('/auth?mode=register')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Features Grid Simplificado */}
          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.featuresGrid}>
              {modernFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCardCompact}
                  onPress={() => navigateToSection(feature.route)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureCardGradient}
                  >
                    <View style={styles.featureContent}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Access Control Countdown */}
          <Animated.View
            style={[
              styles.accessSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <AccessCountdown />
          </Animated.View>

          {/* Premium Features Section */}
          <Animated.View
            style={[
              styles.premiumSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="diamond" size={24} color="#43e97b" />
              <Text style={styles.sectionTitle}>Funciones Premium</Text>
            </View>
            
            <View style={styles.premiumGrid}>
              {premiumFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.premiumCard}
                  onPress={feature.action}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumCardGradient}
                  >
                    <View style={styles.premiumContent}>
                      <Ionicons name={feature.icon as any} size={28} color="white" />
                      <View style={styles.premiumText}>
                        <Text style={styles.premiumTitle}>{feature.title}</Text>
                        <Text style={styles.premiumSubtitle}>{feature.subtitle}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
      
      {/* Modales */}
      <SponsorshipHub 
        visible={showSponsorshipHub} 
        onClose={() => setShowSponsorshipHub(false)} 
      />
      
      <RecommendationsHub 
        visible={showRecommendationsHub} 
        onClose={() => setShowRecommendationsHub(false)} 
      />
      
      {/* Modal QR Generator */}
      <Modal
        visible={showQRGenerator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRGenerator(false)}
      >
        <QRCodeGenerator />
        <TouchableOpacity
          style={styles.closeQRButton}
          onPress={() => setShowQRGenerator(false)}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroSection: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoBlur: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoParticles: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  titleSection: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 14,
    color: '#43e97b',
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '600',
  },
  featuresSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  featuresGrid: {
    gap: 10,
  },
  featureCardCompact: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    height: 70,
  },
  featureCardGradient: {
    flex: 1,
    padding: 15,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  accessSection: {
    marginVertical: 20,
  },
  premiumSection: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumGrid: {
    gap: 12,
  },
  premiumCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 80,
  },
  premiumCardGradient: {
    flex: 1,
    padding: 16,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumText: {
    flex: 1,
    marginLeft: 16,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  authSectionTop: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  authButtonsContainer: {
    width: '100%',
    marginBottom: 15,
  },
  modernButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButtonCompact: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  closeQRButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1000,
  },
});