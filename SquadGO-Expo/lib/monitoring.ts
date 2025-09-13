// Sistema de monitoreo avanzado con Firebase Performance y Crashlytics
import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import perf from '@react-native-firebase/perf';
import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nativeFirebaseService } from './firebase-native';

// Tipos de métricas personalizadas
export enum CustomMetrics {
  APP_STARTUP = 'app_startup_time',
  SCREEN_LOAD = 'screen_load_time',
  API_CALL = 'api_call_duration',
  USER_ACTION = 'user_action_time',
  FIREBASE_OPERATION = 'firebase_operation_time',
  AUTHENTICATION = 'auth_operation_time',
  IMAGE_LOAD = 'image_load_time',
  SEARCH_OPERATION = 'search_operation_time'
}

// Tipos de eventos personalizados
export enum CustomEvents {
  USER_ENGAGEMENT = 'user_engagement',
  FEATURE_USAGE = 'feature_usage',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_ISSUE = 'performance_issue',
  USER_JOURNEY = 'user_journey',
  CONVERSION = 'conversion_event'
}

// Configuración del sistema de monitoreo
const MONITORING_CONFIG = {
  enableCrashlytics: true,
  enablePerformance: true,
  enableAnalytics: true,
  enableCustomMetrics: true,
  performanceThresholds: {
    screenLoad: 3000, // 3 segundos
    apiCall: 5000, // 5 segundos
    userAction: 1000, // 1 segundo
    firebaseOperation: 3000 // 3 segundos
  },
  crashlyticsConfig: {
    enableInDevMode: false,
    enableAutoCollection: true
  }
};

class MonitoringService {
  private static instance: MonitoringService;
  private isInitialized = false;
  private performanceTraces: Map<string, any> = new Map();
  private sessionStartTime: number = Date.now();

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Inicializar Crashlytics
      if (MONITORING_CONFIG.enableCrashlytics) {
        await this.initializeCrashlytics();
      }

      // Inicializar Performance Monitoring
      if (MONITORING_CONFIG.enablePerformance) {
        await this.initializePerformance();
      }

      // Inicializar Analytics
      if (MONITORING_CONFIG.enableAnalytics) {
        await this.initializeAnalytics();
      }

      // Verificar disponibilidad de servicios nativos
      if (nativeFirebaseService.isAvailable()) {
        console.log('📱 Servicios nativos de Firebase disponibles');
      }

      this.isInitialized = true;
      console.log('✅ Sistema de monitoreo inicializado correctamente');
      
      // Registrar inicio de sesión
      this.trackEvent(CustomEvents.USER_JOURNEY, {
        action: 'app_start',
        platform: Platform.OS,
        timestamp: Date.now(),
        native_available: nativeFirebaseService.isAvailable()
      });

    } catch (error) {
      console.error('❌ Error inicializando sistema de monitoreo:', error);
      this.recordError(error as Error, 'monitoring_initialization');
    }
  }

  private async initializeCrashlytics(): Promise<void> {
    try {
      // Configurar Crashlytics
      await crashlytics().setCrashlyticsCollectionEnabled(
        MONITORING_CONFIG.crashlyticsConfig.enableAutoCollection
      );
      
      // Configurar información del usuario
      await crashlytics().setUserId('anonymous_user');
      
      console.log('✅ Crashlytics inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Crashlytics:', error);
    }
  }

  private async initializePerformance(): Promise<void> {
    try {
      // Performance Monitoring se inicializa automáticamente
      console.log('✅ Performance Monitoring inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Performance Monitoring:', error);
    }
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Configurar Analytics
      await analytics().setAnalyticsCollectionEnabled(true);
      console.log('✅ Analytics inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Analytics:', error);
    }
  }

  // Métodos para Performance Monitoring
  startTrace(traceName: string): string {
    try {
      const traceId = `${traceName}_${Date.now()}`;
      const trace = perf().newTrace(traceName);
      trace.start();
      
      this.performanceTraces.set(traceId, {
        trace,
        startTime: Date.now(),
        name: traceName
      });
      
      return traceId;
    } catch (error) {
      console.error('❌ Error iniciando trace:', error);
      return '';
    }
  }

  stopTrace(traceId: string, attributes?: Record<string, string>): void {
    try {
      const traceData = this.performanceTraces.get(traceId);
      if (!traceData) return;

      const { trace, startTime, name } = traceData;
      const duration = Date.now() - startTime;

      // Añadir atributos personalizados
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
      }

      // Añadir métricas de duración
      trace.putMetric('duration_ms', duration);
      trace.stop();

      // Verificar si excede umbrales
      this.checkPerformanceThreshold(name, duration);

      this.performanceTraces.delete(traceId);
    } catch (error) {
      console.error('❌ Error deteniendo trace:', error);
    }
  }

  // Método simplificado para operaciones rápidas
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const traceId = this.startTrace(operationName);
    
    try {
      const result = await operation();
      this.stopTrace(traceId, { ...attributes, status: 'success' });
      return result;
    } catch (error) {
      this.stopTrace(traceId, { ...attributes, status: 'error' });
      this.recordError(error as Error, operationName);
      throw error;
    }
  }

  // Métodos para Crashlytics
  recordError(error: Error, context?: string): void {
    try {
      if (context) {
        crashlytics().setAttribute('error_context', context);
      }
      
      crashlytics().setAttribute('platform', Platform.OS);
      crashlytics().setAttribute('timestamp', new Date().toISOString());
      
      crashlytics().recordError(error);
      
      // Usar servicio nativo si está disponible
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.recordError(error, context);
        if (context) {
          nativeFirebaseService.log(`Error in ${context}: ${error.message}`);
        }
      }
      
      // También registrar en Analytics
      this.trackEvent(CustomEvents.ERROR_OCCURRED, {
        error_message: error.message,
        error_context: context || 'unknown',
        platform: Platform.OS,
        native_recorded: nativeFirebaseService.isAvailable()
      });
    } catch (err) {
      console.error('❌ Error registrando error en Crashlytics:', err);
    }
  }

  logMessage(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    try {
      crashlytics().log(`[${level.toUpperCase()}] ${message}`);
    } catch (error) {
      console.error('❌ Error registrando mensaje:', error);
    }
  }

  setUserIdentifier(userId: string): void {
    try {
      crashlytics().setUserId(userId);
      analytics().setUserId(userId);
      
      // Configurar usuario en servicios nativos
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.setUserId(userId);
      }
    } catch (error) {
      console.error('❌ Error configurando ID de usuario:', error);
    }
  }

  setUserAttributes(attributes: Record<string, string>): void {
    try {
      Object.entries(attributes).forEach(([key, value]) => {
        crashlytics().setAttribute(key, value);
      });
      
      analytics().setUserProperties(attributes);
      
      // Configurar propiedades en servicios nativos
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.setUserProperties(attributes);
      }
    } catch (error) {
      console.error('❌ Error configurando atributos de usuario:', error);
    }
  }

  // Métodos para Analytics
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    try {
      analytics().logEvent(eventName, {
        ...parameters,
        platform: Platform.OS,
        timestamp: Date.now()
      });
      
      // Registrar evento en servicios nativos
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.logEvent(eventName, parameters);
      }
    } catch (error) {
      console.error('❌ Error registrando evento:', error);
    }
  }

  trackScreenView(screenName: string, screenClass?: string): void {
    try {
      analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName
      });
    } catch (error) {
      console.error('❌ Error registrando vista de pantalla:', error);
    }
  }

  // Métodos de utilidad
  private checkPerformanceThreshold(operationName: string, duration: number): void {
    const thresholds = MONITORING_CONFIG.performanceThresholds;
    let threshold = 5000; // Default

    if (operationName.includes('screen')) threshold = thresholds.screenLoad;
    else if (operationName.includes('api')) threshold = thresholds.apiCall;
    else if (operationName.includes('user')) threshold = thresholds.userAction;
    else if (operationName.includes('firebase')) threshold = thresholds.firebaseOperation;

    if (duration > threshold) {
      this.trackEvent(CustomEvents.PERFORMANCE_ISSUE, {
        operation_name: operationName,
        duration_ms: duration,
        threshold_ms: threshold,
        severity: duration > threshold * 2 ? 'high' : 'medium'
      });
    }
  }

  // Métricas de sesión
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  trackSessionEnd(): void {
    const sessionDuration = this.getSessionDuration();
    
    this.trackEvent(CustomEvents.USER_ENGAGEMENT, {
      action: 'session_end',
      session_duration_ms: sessionDuration,
      platform: Platform.OS
    });
  }

  // Método para limpiar recursos
  cleanup(): void {
    this.performanceTraces.clear();
    this.trackSessionEnd();
  }
}

// Instancia singleton
export const monitoringService = MonitoringService.getInstance();

// Funciones de utilidad para uso fácil
export const trackError = (error: Error, context?: string) => {
  monitoringService.recordError(error, context);
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  monitoringService.trackEvent(eventName, parameters);
};

export const trackScreenView = (screenName: string) => {
  monitoringService.trackScreenView(screenName);
};

export const measureAsync = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> => {
  return monitoringService.measureOperation(operationName, operation, attributes);
};

// Hook para React components
export const useMonitoring = () => {
  return {
    trackError,
    trackEvent,
    trackScreenView,
    measureAsync,
    startTrace: (name: string) => monitoringService.startTrace(name),
    stopTrace: (id: string, attrs?: Record<string, string>) => monitoringService.stopTrace(id, attrs)
  };
};

export default monitoringService;