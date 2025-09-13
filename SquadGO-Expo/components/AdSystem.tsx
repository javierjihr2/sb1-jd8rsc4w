import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const { width, height } = Dimensions.get('window');

interface AdConfig {
  id: string;
  type: 'banner' | 'interstitial' | 'rewarded';
  position?: 'top' | 'bottom';
  reward?: {
    type: 'coins' | 'boost' | 'item';
    amount: number;
    description: string;
  };
  frequency: number; // minutes between ads
  enabled: boolean;
}

interface AdSystemProps {
  adType: 'banner' | 'interstitial' | 'rewarded';
  position?: 'top' | 'bottom';
  onAdWatched?: (reward?: any) => void;
  style?: any;
}

const AD_CONFIGS: AdConfig[] = [
  {
    id: 'banner_bottom',
    type: 'banner',
    position: 'bottom',
    frequency: 0, // Always show
    enabled: true
  },
  {
    id: 'interstitial_main',
    type: 'interstitial',
    frequency: 10, // Every 10 minutes
    enabled: true
  },
  {
    id: 'rewarded_coins',
    type: 'rewarded',
    reward: {
      type: 'coins',
      amount: 25,
      description: '25 SquadCoins gratis'
    },
    frequency: 5, // Every 5 minutes
    enabled: true
  },
  {
    id: 'rewarded_boost',
    type: 'rewarded',
    reward: {
      type: 'boost',
      amount: 30,
      description: '30 minutos de boost XP'
    },
    frequency: 15, // Every 15 minutes
    enabled: true
  }
];

const AdSystem: React.FC<AdSystemProps> = ({ 
  adType, 
  position = 'bottom', 
  onAdWatched,
  style 
}) => {
  const { earnCoins } = useCurrency();
  const { hasFeature } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const [lastAdTime, setLastAdTime] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const isAdFree = hasFeature('ad_free');

  useEffect(() => {
    if (isAdFree) return;
    
    const config = AD_CONFIGS.find(c => c.type === adType && c.position === position);
    if (config) {
      setAdConfig(config);
      checkAdAvailability(config);
    }
  }, [adType, position, isAdFree]);

  const checkAdAvailability = (config: AdConfig) => {
    const now = Date.now();
    const timeSinceLastAd = (now - lastAdTime) / (1000 * 60); // minutes
    
    if (config.type === 'banner') {
      setIsVisible(true);
      animateIn();
    } else if (timeSinceLastAd >= config.frequency) {
      if (config.type === 'interstitial') {
        // Auto-show interstitial after delay
        setTimeout(() => {
          setIsVisible(true);
          animateIn();
        }, 2000);
      }
      // Rewarded ads are shown on demand
    }
  };

  const animateIn = () => {
    if (adType === 'banner') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  const animateOut = () => {
    if (adType === 'banner') {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setIsVisible(false));
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start(() => setIsVisible(false));
    }
  };

  const simulateAdLoad = async (): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate ad loading time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    setIsLoading(false);
    
    return success;
  };

  const handleWatchAd = async () => {
    if (!adConfig) return;
    
    const success = await simulateAdLoad();
    
    if (!success) {
      Alert.alert(
        'Error',
        'No se pudo cargar el anuncio. Inténtalo de nuevo más tarde.'
      );
      return;
    }

    // Simulate watching ad
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second ad
    
    setLastAdTime(Date.now());
    
    // Give reward if it's a rewarded ad
    if (adConfig.reward) {
      if (adConfig.reward.type === 'coins') {
        await earnCoins(adConfig.reward.amount, 'Recompensa por ver anuncio');
        Alert.alert(
          '¡Recompensa Obtenida!',
          `Has ganado ${adConfig.reward.amount} SquadCoins por ver el anuncio.`
        );
      }
    }
    
    animateOut();
    onAdWatched?.(adConfig.reward);
  };

  const handleCloseAd = () => {
    if (adType === 'rewarded') {
      Alert.alert(
        'Cerrar Anuncio',
        '¿Estás seguro? No recibirás la recompensa si cierras el anuncio.',
        [
          { text: 'Continuar Viendo', style: 'cancel' },
          { text: 'Cerrar', onPress: animateOut }
        ]
      );
    } else {
      animateOut();
    }
  };

  const showRewardedAd = () => {
    if (isAdFree) {
      Alert.alert(
        'Sin Anuncios',
        'Tienes una suscripción premium sin anuncios. ¡Disfruta de la experiencia sin interrupciones!'
      );
      return;
    }
    
    setIsVisible(true);
    animateIn();
  };

  // Don't show ads for premium users
  if (isAdFree && adType !== 'rewarded') {
    return null;
  }

  // Banner Ad Component
  if (adType === 'banner' && isVisible) {
    return (
      <Animated.View 
        style={[
          styles.bannerContainer,
          position === 'top' ? styles.bannerTop : styles.bannerBottom,
          { opacity: fadeAnim },
          style
        ]}
      >
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.bannerContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>🎮 SquadGO Premium</Text>
            <Text style={styles.bannerSubtitle}>Sin anuncios + Funciones exclusivas</Text>
          </View>
          
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Probar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bannerClose}
            onPress={animateOut}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Rewarded Ad Button
  if (adType === 'rewarded') {
    return (
      <>
        <TouchableOpacity 
          style={[styles.rewardedButton, style]}
          onPress={showRewardedAd}
        >
          <LinearGradient 
            colors={['#f093fb', '#f5576c']} 
            style={styles.rewardedButtonGradient}
          >
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.rewardedButtonText}>Ver Anuncio</Text>
            <Text style={styles.rewardedReward}>+25 🪙</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Rewarded Ad Modal */}
        <Modal 
          visible={isVisible} 
          transparent 
          animationType="none"
          onRequestClose={handleCloseAd}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.adModal,
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>Cargando anuncio...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.adHeader}>
                    <Text style={styles.adTitle}>Anuncio Recompensado</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={handleCloseAd}
                    >
                      <Ionicons name="close" size={24} color="#2c3e50" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.adContent}>
                    <View style={styles.adPlaceholder}>
                      <Ionicons name="play-circle" size={80} color="#667eea" />
                      <Text style={styles.adPlaceholderText}>Anuncio de Video</Text>
                      <Text style={styles.adDuration}>15 segundos</Text>
                    </View>
                    
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardTitle}>Recompensa:</Text>
                      <Text style={styles.rewardDescription}>
                        {adConfig?.reward?.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.adFooter}>
                    <TouchableOpacity 
                      style={styles.watchButton}
                      onPress={handleWatchAd}
                    >
                      <LinearGradient 
                        colors={['#667eea', '#764ba2']} 
                        style={styles.watchButtonGradient}
                      >
                        <Text style={styles.watchButtonText}>Ver Anuncio</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>
      </>
    );
  }

  // Interstitial Ad Modal
  if (adType === 'interstitial' && isVisible) {
    return (
      <Modal 
        visible={isVisible} 
        transparent 
        animationType="none"
        onRequestClose={handleCloseAd}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.interstitialModal,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.interstitialHeader}>
              <Text style={styles.interstitialTitle}>Pausa Publicitaria</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseAd}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.interstitialContent}>
              <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                style={styles.interstitialAd}
              >
                <Text style={styles.interstitialAdTitle}>🚀 Mejora tu Juego</Text>
                <Text style={styles.interstitialAdText}>
                  Únete a SquadGO Premium y accede a estadísticas avanzadas, 
                  coaching AI y mucho más.
                </Text>
                <TouchableOpacity style={styles.interstitialButton}>
                  <Text style={styles.interstitialButtonText}>Saber Más</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            <View style={styles.interstitialFooter}>
              <Text style={styles.skipText}>Puedes cerrar en 5 segundos</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Banner Styles
  bannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000
  },
  bannerTop: {
    top: 0
  },
  bannerBottom: {
    bottom: 0
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 60
  },
  bannerText: {
    flex: 1
  },
  bannerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  bannerClose: {
    padding: 5
  },
  
  // Rewarded Ad Styles
  rewardedButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10
  },
  rewardedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  rewardedButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8
  },
  rewardedReward: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  adModal: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden'
  },
  interstitialModal: {
    width: width * 0.95,
    height: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden'
  },
  
  // Ad Content Styles
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  closeButton: {
    padding: 5
  },
  adContent: {
    padding: 20
  },
  adPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 20
  },
  adPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10
  },
  adDuration: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5
  },
  rewardInfo: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 5
  },
  rewardDescription: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center'
  },
  adFooter: {
    padding: 20
  },
  watchButton: {
    borderRadius: 25,
    overflow: 'hidden'
  },
  watchButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center'
  },
  watchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Interstitial Styles
  interstitialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 20
  },
  interstitialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  interstitialContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  interstitialAd: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center'
  },
  interstitialAdTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center'
  },
  interstitialAdText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25
  },
  interstitialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white'
  },
  interstitialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  interstitialFooter: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ecf0f1'
  },
  skipText: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  
  // Loading Styles
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 15
  }
});

// Export components for easy use
export const BannerAd: React.FC<{ position?: 'top' | 'bottom'; style?: any }> = ({ position, style }) => (
  <AdSystem adType="banner" position={position} style={style} />
);

export const RewardedAdButton: React.FC<{ onAdWatched?: (reward?: any) => void; style?: any }> = ({ onAdWatched, style }) => (
  <AdSystem adType="rewarded" onAdWatched={onAdWatched} style={style} />
);

export const InterstitialAd: React.FC<{ onAdWatched?: () => void }> = ({ onAdWatched }) => (
  <AdSystem adType="interstitial" onAdWatched={onAdWatched} />
);

export default AdSystem;