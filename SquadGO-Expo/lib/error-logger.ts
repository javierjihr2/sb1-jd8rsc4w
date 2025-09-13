// Sistema centralizado de logging y manejo de errores
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { analyticsManager } from './analytics';

// Tipos de errores
export enum ErrorType {
  NETWORK = 'network',
  FIREBASE = 'firebase',
  AUTH = 'auth',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

// Niveles de severidad
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaz para logs de error
interface ErrorLog {
  id: string;
  timestamp: number;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  deviceInfo: {
    platform: string;
    version?: string;
    userAgent?: string;
  };
  resolved: boolean;
  retryCount: number;
}

// Configuración del logger
const LOGGER_CONFIG = {
  maxLogs: 500, // Reducido para mejor performance
  maxRetries: 3,
  storageKey: 'error_logs',
  uploadInterval: 300000, // 5 minutos
  criticalAlertThreshold: 3, // Reducido para detección más temprana
  batchSize: 50, // Procesar logs en lotes
  compressionEnabled: true, // Comprimir logs para storage
};

// Contadores de errores
const errorCounters = new Map<string, number>();
const criticalErrors: ErrorLog[] = [];

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private isInitialized = false;
  private uploadTimer?: NodeJS.Timeout;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Cargar logs existentes
      const storedLogs = await AsyncStorage.getItem(LOGGER_CONFIG.storageKey);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }

      // Configurar upload automático
      this.setupAutoUpload();
      
      // Configurar manejo global de errores
      this.setupGlobalErrorHandling();
      
      this.isInitialized = true;
      console.log('🔧 ErrorLogger inicializado');
    } catch (error) {
      console.error('❌ Error inicializando ErrorLogger:', error);
    }
  }

  // Registrar error
  async logError(
    error: Error | string,
    type: ErrorType = ErrorType.RUNTIME,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: any,
    userId?: string
  ): Promise<string> {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    const errorLog: ErrorLog = {
      id: errorId,
      timestamp,
      type,
      severity,
      message: errorMessage,
      stack,
      context,
      userId,
      deviceInfo: this.getDeviceInfo(),
      resolved: false,
      retryCount: 0
    };

    // Agregar a logs
    this.logs.unshift(errorLog);
    
    // Mantener límite de logs
    if (this.logs.length > LOGGER_CONFIG.maxLogs) {
      this.logs = this.logs.slice(0, LOGGER_CONFIG.maxLogs);
    }

    // Actualizar contadores
    this.updateErrorCounters(type, severity);
    
    // Manejar errores críticos
    if (severity === ErrorSeverity.CRITICAL) {
      await this.handleCriticalError(errorLog);
    }

    // Guardar en storage
    await this.saveToStorage();
    
    // Enviar a analytics
    analyticsManager.trackError(typeof error === 'object' ? error : new Error(error), type);
    
    console.log(`🚨 Error registrado [${severity}]:`, {
      id: errorId,
      type,
      message: errorMessage,
      context
    });

    return errorId;
  }

  // Manejar errores de Firebase específicamente
  async logFirebaseError(error: FirebaseError, operation: string, context?: any): Promise<string> {
    const severity = this.getFirebaseErrorSeverity(error.code);
    
    return this.logError(
      error,
      ErrorType.FIREBASE,
      severity,
      {
        operation,
        firebaseCode: error.code,
        ...context
      }
    );
  }

  // Manejar errores de red
  async logNetworkError(error: Error, url?: string, method?: string): Promise<string> {
    return this.logError(
      error,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        url,
        method,
        isOnline: navigator?.onLine ?? true
      }
    );
  }

  // Marcar error como resuelto
  async resolveError(errorId: string): Promise<boolean> {
    const errorIndex = this.logs.findIndex(log => log.id === errorId);
    if (errorIndex === -1) return false;

    this.logs[errorIndex].resolved = true;
    await this.saveToStorage();
    
    console.log(`✅ Error resuelto: ${errorId}`);
    return true;
  }

  // Obtener estadísticas de errores
  getErrorStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.logs.filter(log => log.timestamp > last24h);
    const recent7d = this.logs.filter(log => log.timestamp > last7d);

    return {
      total: this.logs.length,
      last24h: recent24h.length,
      last7d: recent7d.length,
      byType: this.groupByType(recent24h),
      bySeverity: this.groupBySeverity(recent24h),
      unresolved: this.logs.filter(log => !log.resolved).length,
      critical: criticalErrors.length
    };
  }

  // Obtener logs recientes
  getRecentLogs(limit: number = 50): ErrorLog[] {
    return this.logs.slice(0, limit);
  }

  // Limpiar logs antiguos
  async clearOldLogs(daysOld: number = 30): Promise<number> {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const initialCount = this.logs.length;
    
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    await this.saveToStorage();
    
    const removed = initialCount - this.logs.length;
    console.log(`🧹 Logs limpiados: ${removed} logs eliminados`);
    
    return removed;
  }

  // Métodos privados
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version?.toString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
  }

  private getFirebaseErrorSeverity(code: string): ErrorSeverity {
    const criticalCodes = ['permission-denied', 'unauthenticated', 'data-loss'];
    const highCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted'];
    const mediumCodes = ['not-found', 'already-exists', 'failed-precondition'];
    
    if (criticalCodes.includes(code)) return ErrorSeverity.CRITICAL;
    if (highCodes.includes(code)) return ErrorSeverity.HIGH;
    if (mediumCodes.includes(code)) return ErrorSeverity.MEDIUM;
    
    return ErrorSeverity.LOW;
  }

  private updateErrorCounters(type: ErrorType, severity: ErrorSeverity) {
    const key = `${type}_${severity}`;
    const current = errorCounters.get(key) || 0;
    errorCounters.set(key, current + 1);
  }

  private async handleCriticalError(errorLog: ErrorLog) {
    criticalErrors.unshift(errorLog);
    
    // Mantener solo errores críticos de la última hora
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentCritical = criticalErrors.filter(err => err.timestamp > oneHourAgo);
    
    if (recentCritical.length >= LOGGER_CONFIG.criticalAlertThreshold) {
      await this.sendCriticalAlert(recentCritical);
    }
  }

  private async sendCriticalAlert(errors: ErrorLog[]) {
    console.error('🚨 ALERTA CRÍTICA: Múltiples errores críticos detectados:', {
      count: errors.length,
      timeframe: '1 hora',
      errors: errors.map(e => ({ id: e.id, message: e.message, type: e.type }))
    });
    
    // Aquí se podría implementar notificaciones push, email, etc.
  }

  private groupByType(logs: ErrorLog[]) {
    return logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupBySeverity(logs: ErrorLog[]) {
    return logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Guardar en storage con compresión opcional
  private async saveToStorage(): Promise<void> {
    try {
      // Limpiar logs antiguos antes de guardar
      await this.cleanupOldLogs();
      
      const logsData = JSON.stringify(this.logs);
      await AsyncStorage.setItem(LOGGER_CONFIG.storageKey, logsData);
    } catch (error) {
      console.error('❌ Error guardando logs:', error);
    }
  }

  // Limpiar logs antiguos para optimizar memoria
  private async cleanupOldLogs(): Promise<void> {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Mantener solo logs de los últimos 7 días
    const recentLogs = this.logs.filter(log => log.timestamp > sevenDaysAgo);
    
    // Si hay muchos logs recientes, mantener solo los más importantes
    if (recentLogs.length > LOGGER_CONFIG.maxLogs) {
      // Priorizar errores críticos y de alta severidad
      const criticalLogs = recentLogs.filter(log => 
        log.severity === ErrorSeverity.CRITICAL || log.severity === ErrorSeverity.HIGH
      );
      const otherLogs = recentLogs.filter(log => 
        log.severity !== ErrorSeverity.CRITICAL && log.severity !== ErrorSeverity.HIGH
      );
      
      // Mantener todos los críticos + los más recientes de otros
      const maxOtherLogs = Math.max(0, LOGGER_CONFIG.maxLogs - criticalLogs.length);
      this.logs = [...criticalLogs, ...otherLogs.slice(0, maxOtherLogs)];
    } else {
      this.logs = recentLogs;
    }
  }

  private setupAutoUpload() {
    this.uploadTimer = setInterval(async () => {
      await this.uploadLogs();
    }, LOGGER_CONFIG.uploadInterval);
  }

  private async uploadLogs() {
    // Implementar upload a servidor/analytics
    const unsentLogs = this.logs.filter(log => !log.resolved && log.severity !== ErrorSeverity.LOW);
    
    if (unsentLogs.length > 0) {
      console.log(`📤 Subiendo ${unsentLogs.length} logs de error...`);
      // Aquí se implementaría el envío real
    }
  }

  private setupGlobalErrorHandling() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Capturar errores no manejados
      window.addEventListener('unhandledrejection', (event) => {
        this.logError(
          event.reason || 'Unhandled Promise Rejection',
          ErrorType.RUNTIME,
          ErrorSeverity.HIGH,
          { type: 'unhandledrejection' }
        );
      });
      
      // Capturar errores de JavaScript
      window.addEventListener('error', (event) => {
        this.logError(
          event.error || event.message,
          ErrorType.RUNTIME,
          ErrorSeverity.HIGH,
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );
      });
    }
  }

  // Cleanup
  destroy() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }
  }
}

// Instancia singleton
export const errorLogger = new ErrorLogger();

// Funciones de utilidad
export const logError = (error: Error | string, type?: ErrorType, severity?: ErrorSeverity, context?: any) => {
  return errorLogger.logError(error, type, severity, context);
};

export const logFirebaseError = (error: FirebaseError, operation: string, context?: any) => {
  return errorLogger.logFirebaseError(error, operation, context);
};

export const logNetworkError = (error: Error, url?: string, method?: string) => {
  return errorLogger.logNetworkError(error, url, method);
};

// Inicializar automáticamente
errorLogger.initialize();

export default errorLogger;