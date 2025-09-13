import { analytics } from './firebase';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { monitoringService } from './monitoring';
import { nativeFirebaseService } from './firebase-native';

// Tipos de eventos personalizados
export interface AnalyticsEvent {
  name: string;
  parameters?: { [key: string]: any };
}

// Eventos predefinidos para SquadGO
export const ANALYTICS_EVENTS = {
  // Autenticación
  USER_SIGN_UP: 'user_sign_up',
  USER_SIGN_IN: 'user_sign_in',
  USER_SIGN_OUT: 'user_sign_out',
  
  // Perfil de usuario
  PROFILE_UPDATE: 'profile_update',
  AVATAR_UPLOAD: 'avatar_upload',
  
  // Matchmaking
  MATCH_SEARCH_START: 'match_search_start',
  MATCH_FOUND: 'match_found',
  MATCH_JOINED: 'match_joined',
  MATCH_LEFT: 'match_left',
  
  // Posts y contenido
  POST_CREATE: 'post_create',
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  POST_SHARE: 'post_share',
  
  // Torneos
  TOURNAMENT_VIEW: 'tournament_view',
  TOURNAMENT_JOIN: 'tournament_join',
  TOURNAMENT_LEAVE: 'tournament_leave',
  
  // Configuraciones
  SETTINGS_CHANGE: 'settings_change',
  NOTIFICATION_PERMISSION: 'notification_permission',
  
  // Errores
  ERROR_OCCURRED: 'error_occurred',
  
  // Navegación
  SCREEN_VIEW: 'screen_view',
  
  // Engagement
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  APP_OPEN: 'app_open',
  
  // Eventos de engagement avanzado
  FEATURE_DISCOVERY: 'feature_discovery',
  TUTORIAL_STEP: 'tutorial_step',
  SEARCH_QUERY: 'search_query',
  FILTER_APPLIED: 'filter_applied',
  SHARE_CONTENT: 'share_content',
  DEEP_LINK_OPENED: 'deep_link_opened',
  PUSH_NOTIFICATION_RECEIVED: 'push_notification_received',
  PUSH_NOTIFICATION_OPENED: 'push_notification_opened',
  
  // Eventos de monetización
  PREMIUM_FEATURE_VIEWED: 'premium_feature_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  IN_APP_PURCHASE: 'in_app_purchase',
  
  // Eventos de performance
  SLOW_NETWORK_DETECTED: 'slow_network_detected',
  APP_BACKGROUND: 'app_background',
  APP_FOREGROUND: 'app_foreground',
  MEMORY_WARNING: 'memory_warning'
} as const;

// Métricas de usuario avanzadas
export interface UserMetrics {
  totalSessions: number;
  totalScreenViews: number;
  totalEvents: number;
  averageSessionDuration: number;
  lastActiveDate: string;
  retentionDay1: boolean;
  retentionDay7: boolean;
  retentionDay30: boolean;
  lifetimeValue: number;
  engagementScore: number;
}

// Propiedades de sesión
export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  screenViews: string[];
  eventsCount: number;
  crashOccurred: boolean;
}

// Clase para manejar analíticas
class AnalyticsManager {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private currentSession: SessionData | null = null;
  private userMetrics: UserMetrics | null = null;
  private eventQueue: Array<{ event: string; params: any; timestamp: number }> = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 segundos
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Verificar si analytics está disponible
    this.isEnabled = analytics !== null;
    if (!this.isEnabled) {
      console.log('📊 Analytics - Deshabilitado (no disponible en este entorno)');
    }
    
    // Inicializar sistema de analytics avanzado
    this.initializeAdvancedAnalytics();
  }
  
  private async initializeAdvancedAnalytics() {
    try {
      // Cargar métricas de usuario
      await this.loadUserMetrics();
      
      // Iniciar nueva sesión
      await this.startNewSession();
      
      // Configurar flush automático
      this.setupAutoFlush();
      
      console.log('📊 Analytics avanzado inicializado');
    } catch (error) {
      console.error('Error inicializando analytics avanzado:', error);
    }
  }

  // Configurar usuario
  setUser(userId: string, properties?: { [key: string]: any }) {
    if (!this.isEnabled || !analytics) return;
    
    try {
      this.userId = userId;
      setUserId(analytics, userId);
      
      if (properties) {
        setUserProperties(analytics, properties);
      }
      
      console.log('📊 Analytics - Usuario configurado:', userId);
    } catch (error) {
      console.error('📊 Analytics - Error configurando usuario:', error);
    }
  }

  // Limpiar usuario (logout)
  clearUser() {
    if (!this.isEnabled || !analytics) return;
    
    try {
      this.userId = null;
      setUserId(analytics, null);
      console.log('📊 Analytics - Usuario limpiado');
    } catch (error) {
      console.error('📊 Analytics - Error limpiando usuario:', error);
    }
  }

  // Rastrear evento
  trackEvent(eventName: string, parameters?: { [key: string]: any }) {
    if (!this.isEnabled) return;
    
    try {
      const eventParams = {
        ...parameters,
        timestamp: new Date().toISOString(),
        user_id: this.userId,
        session_id: this.currentSession?.sessionId,
        platform: Platform.OS,
        app_version: '1.0.0' // Obtener de package.json
      };
      
      // Agregar a la cola para procesamiento en lote
      this.eventQueue.push({
        event: eventName,
        params: eventParams,
        timestamp: Date.now()
      });
      
      // Enviar inmediatamente a Firebase si está disponible
      if (analytics) {
        logEvent(analytics, eventName, eventParams);
      }
      
      // Enviar a servicios nativos
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.logEvent(eventName, eventParams);
      }
      
      // Actualizar métricas de sesión
      this.updateSessionMetrics(eventName);
      
      // Actualizar métricas de usuario
      this.updateUserMetrics(eventName);
      
      // Flush si alcanzamos el tamaño del lote
      if (this.eventQueue.length >= this.batchSize) {
        this.flushEvents();
      }
      
      console.log('📊 Analytics - Evento rastreado:', eventName, eventParams);
    } catch (error) {
      console.error('📊 Analytics - Error rastreando evento:', error);
      monitoringService.recordError(error as Error, 'analytics_track_event');
    }
  }

  // Métodos de conveniencia para eventos comunes
  trackScreenView(screenName: string, screenClass?: string) {
    this.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
  }

  trackUserSignUp(method: string) {
    this.trackEvent(ANALYTICS_EVENTS.USER_SIGN_UP, {
      method: method
    });
  }

  trackUserSignIn(method: string) {
    this.trackEvent(ANALYTICS_EVENTS.USER_SIGN_IN, {
      method: method
    });
  }

  trackMatchmaking(action: 'start' | 'found' | 'joined' | 'left', gameMode?: string) {
    const eventMap = {
      start: ANALYTICS_EVENTS.MATCH_SEARCH_START,
      found: ANALYTICS_EVENTS.MATCH_FOUND,
      joined: ANALYTICS_EVENTS.MATCH_JOINED,
      left: ANALYTICS_EVENTS.MATCH_LEFT
    };
    
    this.trackEvent(eventMap[action], {
      game_mode: gameMode
    });
  }

  trackPostInteraction(action: 'create' | 'like' | 'comment' | 'share', postId?: string) {
    const eventMap = {
      create: ANALYTICS_EVENTS.POST_CREATE,
      like: ANALYTICS_EVENTS.POST_LIKE,
      comment: ANALYTICS_EVENTS.POST_COMMENT,
      share: ANALYTICS_EVENTS.POST_SHARE
    };
    
    this.trackEvent(eventMap[action], {
      post_id: postId
    });
  }

  trackTournament(action: 'view' | 'join' | 'leave', tournamentId: string) {
    const eventMap = {
      view: ANALYTICS_EVENTS.TOURNAMENT_VIEW,
      join: ANALYTICS_EVENTS.TOURNAMENT_JOIN,
      leave: ANALYTICS_EVENTS.TOURNAMENT_LEAVE
    };
    
    this.trackEvent(eventMap[action], {
      tournament_id: tournamentId
    });
  }

  trackError(error: Error, context?: string) {
    this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      context: context
    });
  }

  trackSettingsChange(setting: string, value: any) {
    this.trackEvent(ANALYTICS_EVENTS.SETTINGS_CHANGE, {
      setting_name: setting,
      setting_value: String(value)
    });
  }

  // Habilitar/deshabilitar analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled && analytics !== null;
    console.log('📊 Analytics - Estado:', this.isEnabled ? 'Habilitado' : 'Deshabilitado');
  }

  // Obtener estado
  getStatus() {
    return {
      enabled: this.isEnabled,
      userId: this.userId,
      analyticsAvailable: analytics !== null,
      currentSession: this.currentSession,
      userMetrics: this.userMetrics,
      queuedEvents: this.eventQueue.length
    };
  }

  // Métodos privados para analytics avanzado
  private async loadUserMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('user_metrics');
      if (stored) {
        this.userMetrics = JSON.parse(stored);
      } else {
        this.userMetrics = {
          totalSessions: 0,
          totalScreenViews: 0,
          totalEvents: 0,
          averageSessionDuration: 0,
          lastActiveDate: new Date().toISOString(),
          retentionDay1: false,
          retentionDay7: false,
          retentionDay30: false,
          lifetimeValue: 0,
          engagementScore: 0
        };
      }
    } catch (error) {
      console.error('Error cargando métricas de usuario:', error);
    }
  }

  private async saveUserMetrics(): Promise<void> {
    try {
      if (this.userMetrics) {
        await AsyncStorage.setItem('user_metrics', JSON.stringify(this.userMetrics));
      }
    } catch (error) {
      console.error('Error guardando métricas de usuario:', error);
    }
  }

  private async startNewSession(): Promise<void> {
    try {
      // Finalizar sesión anterior si existe
      if (this.currentSession) {
        await this.endCurrentSession();
      }

      // Crear nueva sesión
      this.currentSession = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        screenViews: [],
        eventsCount: 0,
        crashOccurred: false
      };

      // Actualizar métricas de usuario
      if (this.userMetrics) {
        this.userMetrics.totalSessions++;
        this.userMetrics.lastActiveDate = new Date().toISOString();
        await this.saveUserMetrics();
      }

      // Trackear inicio de sesión
      this.trackEvent(ANALYTICS_EVENTS.SESSION_START, {
        session_id: this.currentSession.sessionId,
        platform: Platform.OS
      });

      console.log('📊 Nueva sesión iniciada:', this.currentSession.sessionId);
    } catch (error) {
      console.error('Error iniciando nueva sesión:', error);
    }
  }

  private async endCurrentSession(): Promise<void> {
    try {
      if (!this.currentSession) return;

      const sessionDuration = Date.now() - this.currentSession.startTime;
      this.currentSession.endTime = Date.now();

      // Trackear fin de sesión
      this.trackEvent(ANALYTICS_EVENTS.SESSION_END, {
        session_id: this.currentSession.sessionId,
        session_duration: sessionDuration,
        screen_views: this.currentSession.screenViews.length,
        events_count: this.currentSession.eventsCount,
        crash_occurred: this.currentSession.crashOccurred
      });

      // Actualizar métricas de usuario
      if (this.userMetrics) {
        const totalDuration = (this.userMetrics.averageSessionDuration * (this.userMetrics.totalSessions - 1)) + sessionDuration;
        this.userMetrics.averageSessionDuration = totalDuration / this.userMetrics.totalSessions;
        await this.saveUserMetrics();
      }

      // Flush eventos pendientes
      await this.flushEvents();

      console.log('📊 Sesión finalizada:', this.currentSession.sessionId, `Duración: ${sessionDuration}ms`);
      this.currentSession = null;
    } catch (error) {
      console.error('Error finalizando sesión:', error);
    }
  }

  private updateSessionMetrics(eventName: string): void {
    if (!this.currentSession) return;

    this.currentSession.eventsCount++;

    if (eventName === ANALYTICS_EVENTS.SCREEN_VIEW) {
      // Agregar a la lista de pantallas vistas (evitar duplicados consecutivos)
      const lastScreen = this.currentSession.screenViews[this.currentSession.screenViews.length - 1];
      if (lastScreen !== eventName) {
        this.currentSession.screenViews.push(eventName);
      }
    }
  }

  private updateUserMetrics(eventName: string): void {
    if (!this.userMetrics) return;

    this.userMetrics.totalEvents++;

    if (eventName === ANALYTICS_EVENTS.SCREEN_VIEW) {
      this.userMetrics.totalScreenViews++;
    }

    // Calcular engagement score basado en actividad
    this.calculateEngagementScore();
  }

  private calculateEngagementScore(): void {
    if (!this.userMetrics || !this.currentSession) return;

    // Fórmula simple de engagement basada en:
    // - Número de sesiones
    // - Duración promedio de sesión
    // - Pantallas vistas
    // - Eventos totales
    const sessionScore = Math.min(this.userMetrics.totalSessions / 10, 1) * 25;
    const durationScore = Math.min(this.userMetrics.averageSessionDuration / 300000, 1) * 25; // 5 min max
    const screenScore = Math.min(this.userMetrics.totalScreenViews / 100, 1) * 25;
    const eventScore = Math.min(this.userMetrics.totalEvents / 500, 1) * 25;

    this.userMetrics.engagementScore = sessionScore + durationScore + screenScore + eventScore;
  }

  private setupAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    try {
      if (this.eventQueue.length === 0) return;

      console.log(`📊 Enviando ${this.eventQueue.length} eventos en lote`);
      
      // En un entorno real, aquí enviarías los eventos a tu backend analytics
      // await this.sendEventsToBackend(this.eventQueue);
      
      this.eventQueue = [];
    } catch (error) {
      console.error('Error enviando eventos en lote:', error);
    }
  }

  // Métodos públicos adicionales
  async getAdvancedMetrics(): Promise<UserMetrics | null> {
    return this.userMetrics;
  }

  async getCurrentSession(): Promise<SessionData | null> {
    return this.currentSession;
  }

  trackCustomConversion(conversionType: string, value: number, currency: string = 'USD'): void {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      value: value,
      currency: currency,
      session_duration: this.currentSession ? Date.now() - this.currentSession.startTime : 0
    });

    // Actualizar lifetime value
    if (this.userMetrics) {
      this.userMetrics.lifetimeValue += value;
      this.saveUserMetrics();
    }
  }

  trackFeatureUsage(featureName: string, context?: string): void {
    this.trackEvent(ANALYTICS_EVENTS.FEATURE_DISCOVERY, {
      feature_name: featureName,
      context: context || 'unknown',
      first_time: false // Implementar lógica para detectar primera vez
    });
  }

  trackSearchQuery(query: string, resultsCount: number, category?: string): void {
    this.trackEvent(ANALYTICS_EVENTS.SEARCH_QUERY, {
      search_query: query.toLowerCase(),
      results_count: resultsCount,
      category: category || 'general',
      query_length: query.length
    });
  }

  trackTutorialProgress(step: number, completed: boolean, stepName?: string): void {
    this.trackEvent(ANALYTICS_EVENTS.TUTORIAL_STEP, {
      tutorial_step: step,
      step_name: stepName || `step_${step}`,
      completed: completed,
      total_time: this.currentSession ? Date.now() - this.currentSession.startTime : 0
    });
  }

  // Cleanup al destruir
  async cleanup(): Promise<void> {
    try {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }

      await this.endCurrentSession();
      await this.flushEvents();
      
      console.log('📊 Analytics cleanup completado');
    } catch (error) {
      console.error('Error en cleanup de analytics:', error);
    }
  }
}

// Instancia singleton
export const analyticsManager = new AnalyticsManager();

// Funciones de conveniencia
export const trackEvent = (eventName: string, parameters?: { [key: string]: any }) => {
  analyticsManager.trackEvent(eventName, parameters);
};

export const trackScreenView = (screenName: string, screenClass?: string) => {
  analyticsManager.trackScreenView(screenName, screenClass);
};

export const setAnalyticsUser = (userId: string, properties?: { [key: string]: any }) => {
  analyticsManager.setUser(userId, properties);
};

export const clearAnalyticsUser = () => {
  analyticsManager.clearUser();
};

export default analyticsManager;