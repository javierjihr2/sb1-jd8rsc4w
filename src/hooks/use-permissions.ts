import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { getCityFromCoordinates, LocationInfo } from '@/utils/geocoding';

export interface PermissionStatus {
  location: boolean;
  camera: boolean;
  microphone: boolean;
  isLoading: boolean;
  error: string | null;
  hasAskedBefore: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
  };
  deniedPermanently: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  locationInfo?: LocationInfo | null;
  source?: 'gps' | 'network' | 'manual' | 'cached';
  timestamp?: number;
}

export interface ManualLocationData {
  city: string;
  region?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: number;
  source?: 'manual';
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    location: false,
    camera: false,
    microphone: false,
    isLoading: true,
    error: null,
    hasAskedBefore: {
      location: false,
      camera: false,
      microphone: false
    },
    deniedPermanently: {
      location: false,
      camera: false,
      microphone: false
    }
  });

  const [cachedLocation, setCachedLocation] = useState<LocationData | null>(null);
  const [manualLocation, setManualLocation] = useState<ManualLocationData | null>(null);

  const checkAllPermissions = useCallback(async () => {
    try {
      setPermissions(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [locationStatus, cameraStatus, microphoneStatus] = await Promise.all([
        checkLocationPermission(),
        checkCameraPermission(),
        checkMicrophonePermission()
      ]);

      setPermissions(prev => ({
        ...prev,
        location: locationStatus,
        camera: cameraStatus,
        microphone: microphoneStatus,
        isLoading: false,
        error: null
      }));
    } catch {
      setPermissions(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al verificar permisos'
      }));
    }
  }, []);

  // Verificar permisos al cargar
  useEffect(() => {
    checkAllPermissions();
  }, []); // Remover dependencia circular

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // En web, verificar si geolocation está disponible
        if (!('geolocation' in navigator)) {
          console.log('🚫 Geolocalización no disponible en este navegador');
          return false;
        }
        
        // Verificar el estado del permiso usando la API de permisos si está disponible
        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            console.log('🔍 Estado del permiso de geolocalización:', result.state);
            return result.state === 'granted';
          } catch (e) {
            console.log('⚠️ No se pudo verificar el estado del permiso, asumiendo disponible');
            return true; // Asumir que está disponible si no se puede verificar
          }
        }
        
        return true; // Si no hay API de permisos, asumir que está disponible
      }
      
      const permission = await Geolocation.checkPermissions();
      return permission.location === 'granted';
    } catch (error: unknown) {
      console.error('Error checking location permission:', error);
      return false;
    }
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // En web, verificar si getUserMedia está disponible
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      }
      
      const permission = await Camera.checkPermissions();
      return permission.camera === 'granted';
    } catch (error: unknown) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  };

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // En web, verificar si getUserMedia está disponible
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      }
      
      // En dispositivos nativos, verificar permisos de micrófono
      try {
        // Intentar acceder al micrófono para verificar permisos
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        // Si falla, probablemente no tiene permisos
        return false;
      }
    } catch (error: unknown) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      // Marcar que ya se ha preguntado antes
      setPermissions(prev => ({
        ...prev,
        hasAskedBefore: { ...prev.hasAskedBefore, location: true },
        isLoading: true,
        error: null
      }));

      if (!Capacitor.isNativePlatform()) {
        // En web, verificar primero si geolocation está disponible
        if (!('geolocation' in navigator)) {
          setPermissions(prev => ({
            ...prev,
            location: false,
            isLoading: false,
            error: 'Geolocalización no disponible en este navegador'
          }));
          return false;
        }

        // Solicitar permiso de geolocalización en web
        console.log('🔄 Solicitando permiso de geolocalización...');
        
        return new Promise((resolve) => {
          // Usar un timeout más corto para la solicitud de permiso
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('✅ Permiso de geolocalización concedido:', position);
              setPermissions(prev => ({ 
                ...prev, 
                location: true, 
                isLoading: false,
                error: null 
              }));
              resolve(true);
            },
            (error) => {
              console.error('❌ Error en solicitud de geolocalización:', error);
              let errorMessage = 'Error al acceder a la ubicación';
              let isDeniedPermanently = false;
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Permiso de ubicación denegado. Para activarlo:\n1. Haz clic en el ícono de ubicación en la barra de direcciones\n2. Selecciona "Permitir" para este sitio\n3. Recarga la página si es necesario';
                  isDeniedPermanently = true;
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Ubicación no disponible. Verifica que:\n1. Tu dispositivo tenga GPS activado\n2. Estés en un lugar con buena señal\n3. El navegador tenga acceso a servicios de ubicación';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Tiempo de espera agotado. Intenta:\n1. Verificar tu conexión a internet\n2. Activar el GPS de tu dispositivo\n3. Intentar nuevamente';
                  break;
                default:
                  errorMessage = 'Error desconocido al obtener ubicación. Intenta recargar la página.';
              }
              
              setPermissions(prev => ({
                ...prev,
                location: false,
                isLoading: false,
                deniedPermanently: { ...prev.deniedPermanently, location: isDeniedPermanently },
                error: errorMessage
              }));
              resolve(false);
            },
            { 
              timeout: 10000, // Reducir timeout a 10 segundos
              enableHighAccuracy: false, // Usar precisión normal para solicitud de permiso
              maximumAge: 600000 // 10 minutos
            }
          );
        });
      }
      
      // En plataforma nativa
      const permission = await Geolocation.requestPermissions();
      const granted = permission.location === 'granted';
      const denied = permission.location === 'denied';
      
      setPermissions(prev => ({
        ...prev,
        location: granted,
        isLoading: false,
        deniedPermanently: { ...prev.deniedPermanently, location: denied },
        error: denied ? 'Permiso de ubicación denegado. Habilítalo en la configuración de la aplicación.' : null
      }));
      
      return granted;
    } catch (error: unknown) {
      console.error('Error requesting location permission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al solicitar permiso de ubicación';
      setPermissions(prev => ({
        ...prev,
        location: false,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Marcar que ya se ha preguntado antes
      setPermissions(prev => ({
        ...prev,
        hasAskedBefore: { ...prev.hasAskedBefore, camera: true }
      }));

      if (!Capacitor.isNativePlatform()) {
        // En web, solicitar permiso de cámara
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissions(prev => ({ ...prev, camera: true }));
          return true;
        } catch (error: unknown) {
          const isDenied = (error as any)?.name === 'NotAllowedError';
          setPermissions(prev => ({
            ...prev,
            camera: false,
            deniedPermanently: { ...prev.deniedPermanently, camera: isDenied },
            error: isDenied ? 'Permiso de cámara denegado. Puedes habilitarlo haciendo clic en el ícono de cámara en la barra de direcciones.' : 'Error al acceder a la cámara'
          }));
          return false;
        }
      }
      
      const permission = await Camera.requestPermissions();
      const granted = permission.camera === 'granted';
      const denied = permission.camera === 'denied';
      
      setPermissions(prev => ({
        ...prev,
        camera: granted,
        deniedPermanently: { ...prev.deniedPermanently, camera: denied },
        error: denied ? 'Para tomar fotos, habilita la cámara en Configuración > Aplicaciones > SquadGO > Permisos' : null
      }));
      
      return granted;
    } catch (error: unknown) {
      console.error('Error requesting camera permission:', error);
      setPermissions(prev => ({
        ...prev,
        error: 'Error al solicitar permiso de cámara. Inténtalo de nuevo.'
      }));
      return false;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Marcar que ya se ha preguntado antes
      setPermissions(prev => ({
        ...prev,
        hasAskedBefore: { ...prev.hasAskedBefore, microphone: true }
      }));

      if (!Capacitor.isNativePlatform()) {
        // En web, solicitar permiso de micrófono
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissions(prev => ({ ...prev, microphone: true }));
          return true;
        } catch (error: unknown) {
          const isDenied = (error as any)?.name === 'NotAllowedError';
          setPermissions(prev => ({
            ...prev,
            microphone: false,
            deniedPermanently: { ...prev.deniedPermanently, microphone: isDenied },
            error: isDenied ? 'Permiso de micrófono denegado. Puedes habilitarlo haciendo clic en el ícono de micrófono en la barra de direcciones.' : 'Error al acceder al micrófono'
          }));
          return false;
        }
      }
      
      // En dispositivos nativos, solicitar permiso de micrófono directamente
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: true }));
        return true;
      } catch (error: unknown) {
        const isDenied = (error as any)?.name === 'NotAllowedError';
        setPermissions(prev => ({
          ...prev,
          microphone: false,
          deniedPermanently: { ...prev.deniedPermanently, microphone: isDenied },
          error: isDenied ? 'Para usar mensajes de voz, habilita el micrófono en Configuración > Aplicaciones > SquadGO > Permisos' : 'Error al acceder al micrófono'
        }));
        return false;
      }
    } catch (error: unknown) {
      console.error('Error requesting microphone permission:', error);
      setPermissions(prev => ({
        ...prev,
        error: 'Error al solicitar permiso de micrófono. Inténtalo de nuevo.'
      }));
      return false;
    }
  };

  const requestAllPermissions = async (): Promise<boolean> => {
    try {
      setPermissions(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [locationGranted, cameraGranted, microphoneGranted] = await Promise.all([
        requestLocationPermission(),
        requestCameraPermission(),
        requestMicrophonePermission()
      ]);

      const allGranted = locationGranted && cameraGranted && microphoneGranted;
      
      setPermissions(prev => ({
        ...prev,
        location: locationGranted,
        camera: cameraGranted,
        microphone: microphoneGranted,
        isLoading: false,
        error: allGranted ? null : 'Algunos permisos no fueron concedidos'
      }));

      return allGranted;
    } catch {
      setPermissions(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al solicitar permisos'
      }));
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationData> => {
    try {
      setPermissions(prev => ({ ...prev, isLoading: true, error: null }));

      if (!permissions.location) {
        const granted = await requestLocationPermission();
        if (!granted) {
          throw new Error('Permiso de ubicación denegado');
        }
      }

      let coordinates;
      
      if (!Capacitor.isNativePlatform()) {
        // En web, usar navigator.geolocation con mejor manejo de errores
        coordinates = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!('geolocation' in navigator)) {
            reject(new Error('Geolocalización no disponible en este navegador'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => {
              let errorMessage = 'Error al obtener ubicación';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Permiso de ubicación denegado';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Ubicación no disponible. Verifica tu GPS';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Tiempo de espera agotado. Intenta nuevamente';
                  break;
              }
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000 // 5 minutos
            }
          );
        });
      } else {
        // En plataforma nativa, usar Capacitor Geolocation
        coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
      }

      // Obtener información de la ciudad/comuna con manejo de errores
      let locationInfo: LocationInfo | null = null;
      try {
        locationInfo = await getCityFromCoordinates(
          coordinates.coords.latitude,
          coordinates.coords.longitude
        );
      } catch (geocodingError) {
        console.warn('Error obteniendo información de geocodificación:', geocodingError);
        // Continuar sin información de ciudad, no es crítico
      }

      setPermissions(prev => ({ ...prev, isLoading: false }));

      const locationData: LocationData = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        locationInfo,
        source: Capacitor.isNativePlatform() ? 'gps' : 'network',
        timestamp: Date.now()
      };

      // Cachear la ubicación para uso futuro
      setCachedLocation(locationData);
      
      return locationData;
    } catch (error: unknown) {
      console.error('Error getting location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener ubicación';
      setPermissions(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage
      }));
      
      // Intentar usar ubicación cacheada como respaldo
      if (cachedLocation && Date.now() - (cachedLocation.timestamp || 0) < 3600000) { // 1 hora
        console.log('Usando ubicación cacheada como respaldo');
        return {
          ...cachedLocation,
          source: 'cached'
        };
      }
      
      throw new Error(errorMessage);
    }
  };

  const setManualLocationData = (locationData: ManualLocationData) => {
    setManualLocation(locationData);
    setPermissions(prev => ({ ...prev, error: null }));
  };

  const getManualLocation = (): LocationData | null => {
    if (!manualLocation) return null;
    
    return {
      latitude: manualLocation.coordinates?.latitude || 0,
      longitude: manualLocation.coordinates?.longitude || 0,
      accuracy: 10000, // Baja precisión para ubicación manual
      locationInfo: {
        city: manualLocation.city,
        state: manualLocation.region || 'Unknown',
        country: manualLocation.country || 'Unknown',
        fullAddress: `${manualLocation.city}, ${manualLocation.region || 'Unknown'}, ${manualLocation.country || 'Unknown'}`
      },
      source: 'manual',
      timestamp: Date.now()
    };
  };

  const getCachedLocation = (): LocationData | null => {
    if (!cachedLocation) return null;
    
    // Verificar si la ubicación cacheada no es muy antigua (1 hora)
    const isStale = Date.now() - (cachedLocation.timestamp || 0) > 3600000;
    if (isStale) {
      setCachedLocation(null);
      return null;
    }
    
    return {
      ...cachedLocation,
      source: 'cached'
    };
  };

  const clearLocationCache = () => {
    setCachedLocation(null);
    setManualLocation(null);
  };

  const getLocationWithFallback = async (): Promise<LocationData> => {
    try {
      // Intentar obtener ubicación GPS primero
      return await getCurrentLocation();
    } catch (gpsError) {
      console.warn('GPS falló, intentando respaldos:', gpsError);
      
      // Intentar ubicación cacheada
      const cached = getCachedLocation();
      if (cached) {
        console.log('Usando ubicación cacheada');
        return cached;
      }
      
      // Intentar ubicación manual
      const manual = getManualLocation();
      if (manual && manual.latitude !== 0 && manual.longitude !== 0) {
        console.log('Usando ubicación manual');
        return manual;
      }
      
      // Si todo falla, lanzar el error original
      throw gpsError;
    }
  };

  const takePhoto = async () => {
    try {
      if (!permissions.camera) {
        const granted = await requestCameraPermission();
        if (!granted) {
          throw new Error('Permiso de cámara denegado');
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      return image;
    } catch (error: unknown) {
      console.error('Error taking photo:', error);
      throw error;
    }
  };

  return {
    permissions,
    checkAllPermissions,
    requestLocationPermission,
    requestCameraPermission,
    requestMicrophonePermission,
    requestAllPermissions,
    getCurrentLocation,
    getLocationWithFallback,
    setManualLocationData,
    getManualLocation,
    getCachedLocation,
    clearLocationCache,
    cachedLocation,
    manualLocation,
    takePhoto
  };
};