import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { PlayerProfile } from '../lib/types';
import { analyticsManager, setAnalyticsUser, clearAnalyticsUser } from '../lib/analytics';
import { pushNotificationManager, registerForPushNotifications, saveTokenToFirestore } from '../lib/push-notifications';
import { handleFirestoreError, diagnoseFirestoreIssues } from '../lib/firestore-utils';
import { globalErrorHandler, handleFirebaseError } from '../lib/global-error-handler';
import { ErrorSeverity } from '../lib/error-logger';

interface AuthContextType {
  user: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastError: Date | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, profileData: Partial<PlayerProfile>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<PlayerProfile>) => Promise<void>;
  clearError: () => void;
  retry: () => Promise<void>;
  // Funciones biométricas simplificadas
  signInWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  enableBiometricAuth: (email: string, password: string) => Promise<boolean>;
  isBiometricAvailable: boolean;
  biometricType: string;
  // Funciones offline simplificadas
  signInOffline: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isOfflineMode: boolean;
  isConnected: boolean;
  getOfflineStatus: () => any;
  // Funciones para el sistema de match mejorado
  isMatchEligible: () => boolean;
  updateMatchData: (data: Partial<PlayerProfile>) => Promise<void>;
  reviewMatchData: () => Promise<boolean>;
  addMatchPhoto: (photoUri: string) => Promise<void>;
  removeMatchPhoto: (photoUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('TouchID');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setError(null); // Limpiar errores previos
      
      if (user) {
        try {
          console.log('🔐 Usuario autenticado, cargando perfil...', user.uid);
          
          const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as PlayerProfile;
            setProfile(profileData);
            
            // Configurar analytics para el usuario (solo una vez)
            try {
              setAnalyticsUser(user.uid, {
                display_name: profileData.displayName,
                username: profileData.username,
                region: profileData.region,
                language: profileData.language
              });
            } catch (analyticsError) {
              console.error('Error configurando analytics:', analyticsError);
            }
            
            // Registrar para notificaciones push (solo una vez)
            try {
              const token = await registerForPushNotifications();
              if (token && typeof token === 'string') {
                await saveTokenToFirestore(user.uid);
              }
            } catch (notificationError) {
              console.warn('⚠️ Error registrando notificaciones:', notificationError);
            }
          }
          
          console.log('✅ Perfil de usuario cargado exitosamente');
          setRetryCount(0); // Resetear contador de reintentos
        } catch (error) {
          console.error('❌ Error loading profile:', error);
          
          const errorMessage = handleFirestoreError(error, 'cargar perfil de usuario');
          setError(errorMessage);
          setLastError(new Date());
          setProfile(null);
          
          // Ejecutar diagnóstico si es un error de Firestore
          if (error && typeof error === 'object' && 'code' in error) {
            try {
              await diagnoseFirestoreIssues();
            } catch (diagError) {
              console.warn('⚠️ Error en diagnóstico:', diagError);
            }
          }
        }
      } else {
        console.log('🚪 Usuario no autenticado, limpiando datos...');
        setProfile(null);
        setError(null);
        setRetryCount(0);
        
        // Limpiar analytics al cerrar sesión
        try {
          clearAnalyticsUser();
        } catch (error) {
          console.error('Error limpiando analytics:', error);
        }
        
        // Limpiar token de notificaciones
        try {
          if (pushNotificationManager && typeof pushNotificationManager.clearToken === 'function') {
            pushNotificationManager.clearToken();
          }
        } catch (error) {
          console.error('Error limpiando token:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Rastrear evento de inicio de sesión
      analyticsManager.trackUserSignIn('email');
      
      return { success: true };
    } catch (error: any) {
      // Manejar error con el sistema global
      await handleFirebaseError(error, 'sign_in', {
        severity: ErrorSeverity.MEDIUM,
        showAlert: false // No mostrar alert aquí, se maneja en el componente
      });
      
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, profileData: Partial<PlayerProfile>): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const newProfile: PlayerProfile = {
      id: user.uid,
      displayName: profileData.displayName || '',
      username: profileData.username || '',
      avatarUrl: profileData.avatarUrl || '',
      bio: profileData.bio || '',
      region: profileData.region || profileData.countryCode || '',
      language: profileData.language || 'es',
      mic: profileData.mic || false,
      roles: profileData.roles || [],
      rankTier: profileData.rankTier || '',
      stats: {
        kda: 0,
        wins: 0,
        matches: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      email: user.email || '',
      location: profileData.location || {
        lat: 0,
        lon: 0
      },
      // Nuevos campos para el sistema de match mejorado
      name: profileData.name || '',
      age: profileData.age || 0,
      gameId: profileData.gameId || '',
      currentServer: profileData.currentServer || '',
      gender: profileData.gender || 'Prefiero no decir',
      pubgId: profileData.pubgId || '',
      country: profileData.country || '',
      profileImage: profileData.profileImage || '',
      coverImage: profileData.coverImage || '',
      matchPhotos: profileData.matchPhotos || [],
      gamePreferences: profileData.gamePreferences || [],
      isMatchEligible: (profileData.age || 0) >= 18,
      lastDataReview: new Date(),
      countryCode: profileData.countryCode || ''
    };

    await setDoc(doc(db, 'profiles', user.uid), newProfile);
    setProfile(newProfile);
    
    // Rastrear evento de registro
    analyticsManager.trackUserSignUp('email');
    
    // Configurar analytics para el nuevo usuario
    setAnalyticsUser(user.uid, {
      display_name: newProfile.displayName,
      username: newProfile.username,
      region: newProfile.region,
      language: newProfile.language
    });
    
    // Registrar para notificaciones push
    registerForPushNotifications().then(token => {
      if (token && typeof token === 'string') {
        saveTokenToFirestore(user.uid);
      }
    }).catch(error => {
      console.error('Error registrando notificaciones:', error);
    });
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Cerrando sesión...');
      setError(null);
      
      // Rastrear evento de cierre de sesión
      analyticsManager.trackEvent('user_sign_out');
      
      await signOut(auth);
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      
      // Manejar error con el sistema global
      await handleFirebaseError(error as any, 'sign_out', {
        severity: ErrorSeverity.MEDIUM,
        context: { operation: 'logout' }
      });
      
      const errorMessage = handleFirestoreError(error, 'cerrar sesión');
      setError(errorMessage);
      setLastError(new Date());
    }
  };

  const updateProfile = async (data: Partial<PlayerProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      console.log('🔄 Actualizando perfil de usuario...', user.uid);
      setError(null);
      
      const updatedData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'profiles', user.uid), updatedData);
      
      if (profile) {
        const updatedProfile = { ...profile, ...updatedData };
        setProfile(updatedProfile);
        
        // Rastrear actualización de perfil
        analyticsManager.trackEvent('profile_update', {
          fields_updated: Object.keys(data)
        });
      }
      
      console.log('✅ Perfil actualizado exitosamente');
      setRetryCount(0);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      
      const errorMessage = handleFirestoreError(error, 'actualizar perfil de usuario');
      setError(errorMessage);
      setLastError(new Date());
      setRetryCount(prev => prev + 1);
      
      throw error; // Re-throw para que el componente pueda manejar el error
    }
  };

  // Funciones biométricas simplificadas
  const signInWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    // Implementación simplificada - siempre falla por ahora
    return { success: false, error: 'Autenticación biométrica no disponible en versión simplificada' };
  };

  const enableBiometricAuth = async (email: string, password: string): Promise<boolean> => {
    // Implementación simplificada - siempre falla por ahora
    return false;
  };

  // Funciones offline simplificadas
  const signInOffline = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Implementación simplificada - siempre falla por ahora
    return { success: false, error: 'Modo offline no disponible en versión simplificada' };
  };

  const getOfflineStatus = () => {
    return {
      isOffline: isOfflineMode,
      isConnected: isConnected,
      lastSync: new Date()
    };
  };

  // Funciones de utilidad para manejo de errores
  const clearError = () => {
    setError(null);
    setLastError(null);
  };
  
  const retry = async () => {
    if (!user) {
      console.warn('⚠️ No se puede reintentar: usuario no autenticado');
      return;
    }
    
    console.log('🔄 Reintentando operación...', { retryCount });
    
    try {
      setError(null);
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as PlayerProfile;
        setProfile(profileData);
        setRetryCount(0);
        console.log('✅ Reintento exitoso');
      }
    } catch (error) {
      console.error('❌ Error en reintento:', error);
      
      // Manejar error con el sistema global
      await handleFirebaseError(error as any, 'retry_profile_load', {
        severity: ErrorSeverity.HIGH,
        context: { 
          operation: 'retry',
          retryCount: retryCount + 1
        }
      });
      
      const errorMessage = handleFirestoreError(error, 'reintentar carga de perfil');
      setError(errorMessage);
      setLastError(new Date());
      setRetryCount(prev => prev + 1);
    }
  };

  // Funciones para el sistema de match mejorado
  const isMatchEligible = (): boolean => {
    if (!profile) return false;
    return (profile.age || 0) >= 18 && 
           !!profile.currentServer && 
           !!profile.pubgId && 
           !!profile.name;
  };

  const updateMatchData = async (data: Partial<PlayerProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    const updatedData = {
      ...data,
      updatedAt: new Date(),
      lastDataReview: new Date(),
      isMatchEligible: (data.age || profile?.age || 0) >= 18
    };
    
    await updateDoc(doc(db, 'profiles', user.uid), updatedData);
    
    if (profile) {
      const updatedProfile = { ...profile, ...updatedData };
      setProfile(updatedProfile);
      
      // Rastrear actualización de datos de match
      analyticsManager.trackEvent('match_data_update', {
        fields_updated: Object.keys(data)
      });
    }
  };

  const reviewMatchData = async (): Promise<boolean> => {
    if (!profile) return false;
    
    const requiredFields = ['name', 'age', 'currentServer', 'pubgId'];
    const missingFields = requiredFields.filter(field => !profile[field as keyof PlayerProfile]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields for match:', missingFields);
      return false;
    }
    
    if ((profile.age || 0) < 18) {
      console.log('User is under 18, not eligible for match');
      return false;
    }
    
    // Actualizar timestamp de revisión
    await updateDoc(doc(db, 'profiles', user!.uid), {
      lastDataReview: new Date()
    });
    
    return true;
  };

  const addMatchPhoto = async (photoUri: string): Promise<void> => {
    if (!user || !profile) throw new Error('No user logged in');
    
    const currentPhotos = profile.matchPhotos || [];
    if (currentPhotos.length >= 6) {
      throw new Error('Maximum 6 photos allowed');
    }
    
    const updatedPhotos = [...currentPhotos, photoUri];
    
    await updateDoc(doc(db, 'profiles', user.uid), {
      matchPhotos: updatedPhotos,
      updatedAt: new Date()
    });
    
    setProfile({ ...profile, matchPhotos: updatedPhotos });
    
    analyticsManager.trackEvent('match_photo_added', {
      total_photos: updatedPhotos.length
    });
  };

  const removeMatchPhoto = async (photoUri: string): Promise<void> => {
    if (!user || !profile) throw new Error('No user logged in');
    
    const currentPhotos = profile.matchPhotos || [];
    const updatedPhotos = currentPhotos.filter(photo => photo !== photoUri);
    
    await updateDoc(doc(db, 'profiles', user.uid), {
      matchPhotos: updatedPhotos,
      updatedAt: new Date()
    });
    
    setProfile({ ...profile, matchPhotos: updatedPhotos });
    
    analyticsManager.trackEvent('match_photo_removed', {
      total_photos: updatedPhotos.length
    });
  };

  const value = {
    user,
    profile,
    loading,
    error,
    retryCount,
    lastError,
    signIn,
    signUp,
    logout,
    updateProfile,
    clearError,
    retry,
    // Funciones biométricas
    signInWithBiometrics,
    enableBiometricAuth,
    isBiometricAvailable,
    biometricType,
    // Funciones offline
    signInOffline,
    isOfflineMode,
    isConnected,
    getOfflineStatus,
    // Funciones para el sistema de match mejorado
    isMatchEligible,
    updateMatchData,
    reviewMatchData,
    addMatchPhoto,
    removeMatchPhoto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};