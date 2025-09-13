import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, FieldValue } from 'firebase/firestore';
import { log } from './secure-logger';

export interface SecurityEvent {
  id?: string;
  type: 'sql_injection' | 'xss_attempt' | 'rate_limit_exceeded' | 'invalid_input' | 'auth_failure' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  endpoint?: string;
  payload?: unknown;
  timestamp: Date | string | FieldValue;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlert {
  id: string;
  type: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  severity: string;
  description: string;
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private alertThresholds = {
    sql_injection: 1, // Cualquier intento es crítico
    xss_attempt: 3,
    rate_limit_exceeded: 10,
    invalid_input: 20,
    auth_failure: 5,
    suspicious_activity: 5
  };

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Registra un evento de seguridad en Firestore
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: serverTimestamp()
      };

      // Registrar en Firestore
      await addDoc(collection(db, 'security_logs'), securityEvent);

      // Verificar si necesitamos generar una alerta
      await this.checkForAlerts(event.type, event.severity);

      // Log en consola para desarrollo
      if ((process.env.NODE_ENV as string) === 'development') {
        log.security(`${event.type}: ${event.description}`, {
      severity: event.severity,
      endpoint: event.endpoint,
      userAgent: event.userAgent,
      ipAddress: event.ipAddress
    });
      }
    } catch (error) {
      log.error('Error logging security event:', error);
    // Fallback a logger seguro si Firestore falla
    log.security(`FALLBACK - ${event.type}: ${event.description}`);
    }
  }

  /**
   * Registra un intento de inyección SQL
   */
  async logSQLInjectionAttempt(payload: string, endpoint: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'sql_injection',
      severity: 'critical',
      description: `Intento de inyección SQL detectado: ${payload.substring(0, 100)}`,
      endpoint,
      userAgent,
      ipAddress,
      payload: { suspiciousContent: payload.substring(0, 200) }
    });
  }

  /**
   * Registra un intento de XSS
   */
  async logXSSAttempt(payload: string, endpoint: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'xss_attempt',
      severity: 'high',
      description: `Intento de XSS detectado: ${payload.substring(0, 100)}`,
      endpoint,
      userAgent,
      ipAddress,
      payload: { suspiciousContent: payload.substring(0, 200) }
    });
  }

  /**
   * Registra exceso de rate limit
   */
  async logRateLimitExceeded(endpoint: string, userAgent?: string, ipAddress?: string, userId?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      description: `Rate limit excedido en ${endpoint}`,
      endpoint,
      userAgent,
      ipAddress,
      userId
    });
  }

  /**
   * Registra fallo de autenticación
   */
  async logAuthFailure(reason: string, userAgent?: string, ipAddress?: string, email?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'auth_failure',
      severity: 'medium',
      description: `Fallo de autenticación: ${reason}`,
      userAgent,
      ipAddress,
      metadata: { email: email?.substring(0, 3) + '***' } // Ocultar email parcialmente
    });
  }

  /**
   * Registra entrada inválida
   */
  async logInvalidInput(field: string, value: string, endpoint: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'invalid_input',
      severity: 'low',
      description: `Entrada inválida en campo ${field}`,
      endpoint,
      userAgent,
      ipAddress,
      payload: { field, value: value.substring(0, 50) }
    });
  }

  /**
   * Verifica si se deben generar alertas basadas en la frecuencia de eventos
   */
  private async checkForAlerts(eventType: SecurityEvent['type'], severity: SecurityEvent['severity']): Promise<void> {
    try {
      const threshold = this.alertThresholds[eventType];
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Contar eventos del mismo tipo en la última hora
      const recentEventsQuery = query(
        collection(db, 'security_logs'),
        where('type', '==', eventType),
        where('timestamp', '>=', oneHourAgo),
        orderBy('timestamp', 'desc'),
        limit(threshold + 1)
      );

      const recentEvents = await getDocs(recentEventsQuery);
      
      if (recentEvents.size >= threshold) {
        await this.generateAlert(eventType, recentEvents.size, severity);
      }
    } catch (error) {
      log.error('Error checking for alerts:', error);
    }
  }

  /**
   * Genera una alerta de seguridad
   */
  private async generateAlert(eventType: SecurityEvent['type'], count: number, severity: SecurityEvent['severity']): Promise<void> {
    try {
      const alert = {
        type: eventType,
        count,
        severity,
        description: `Se detectaron ${count} eventos de tipo ${eventType} en la última hora`,
        timestamp: serverTimestamp(),
        status: 'active'
      };

      await addDoc(collection(db, 'security_alerts'), alert);
      
      // En producción, aquí se podría enviar notificaciones por email, Slack, etc.
      log.security(`ALERT - ${alert.description}`);
    } catch (error) {
      log.error('Error generating security alert:', error);
    }
  }

  /**
   * Obtiene eventos de seguridad recientes
   */
  async getRecentSecurityEvents(hours: number = 24, eventType?: SecurityEvent['type']): Promise<SecurityEvent[]> {
    try {
      const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let eventsQuery = query(
        collection(db, 'security_logs'),
        where('timestamp', '>=', timeAgo),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      if (eventType) {
        eventsQuery = query(
          collection(db, 'security_logs'),
          where('type', '==', eventType),
          where('timestamp', '>=', timeAgo),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          severity: data.severity,
          description: data.description,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          userId: data.userId,
          endpoint: data.endpoint,
          payload: data.payload,
          timestamp: data.timestamp,
          metadata: data.metadata
        } as SecurityEvent;
      });
    } catch (error) {
      log.error('Error fetching security events:', error);
      return [];
    }
  }

  /**
   * Obtiene alertas de seguridad activas
   */
  async getActiveAlerts(): Promise<SecurityAlert[]> {
    try {
      const alertsQuery = query(
        collection(db, 'security_alerts'),
        where('status', '==', 'active'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(alertsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityAlert));
    } catch (error) {
      log.error('Error fetching security alerts:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const securityLogger = SecurityLogger.getInstance();

// Funciones de conveniencia
export const logSQLInjection = (payload: string, endpoint: string, userAgent?: string, ipAddress?: string) => 
  securityLogger.logSQLInjectionAttempt(payload, endpoint, userAgent, ipAddress);

export const logXSS = (payload: string, endpoint: string, userAgent?: string, ipAddress?: string) => 
  securityLogger.logXSSAttempt(payload, endpoint, userAgent, ipAddress);

export const logRateLimit = (endpoint: string, userAgent?: string, ipAddress?: string, userId?: string) => 
  securityLogger.logRateLimitExceeded(endpoint, userAgent, ipAddress, userId);

export const logAuthFailure = (reason: string, userAgent?: string, ipAddress?: string, email?: string) => 
  securityLogger.logAuthFailure(reason, userAgent, ipAddress, email);

export const logInvalidInput = (field: string, value: string, endpoint: string, userAgent?: string, ipAddress?: string) => 
  securityLogger.logInvalidInput(field, value, endpoint, userAgent, ipAddress);