// Sistema de monitoreo de performance y métricas
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorLogger, ErrorType, ErrorSeverity } from './error-logger';
import { analyticsManager } from './analytics';

// Tipos de métricas
export enum MetricType {
  LOAD_TIME = 'load_time',
  API_RESPONSE = 'api_response',
  RENDER_TIME = 'render_time',
  MEMORY_USAGE = 'memory_usage',
  NETWORK_LATENCY = 'network_latency',
  USER_INTERACTION = 'user_interaction',
  FIREBASE_OPERATION = 'firebase_operation'
}

// Interfaz para métricas
interface PerformanceMetric {
  id: string;
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: any;
  userId?: string;
  sessionId: string;
}

// Interfaz para alertas de performance
interface PerformanceAlert {
  id: string;
  type: MetricType;
  threshold: number;
  actualValue: number;
  severity: ErrorSeverity;
  timestamp: number;
  context?: any;
}

// Configuración del monitor
const PERFORMANCE_CONFIG = {
  maxMetrics: 1000,
  storageKey: 'performance_metrics',
  alertsKey: 'performance_alerts',
  uploadInterval: 300000, // 5 minutos
  thresholds: {
    [MetricType.LOAD_TIME]: 3000, // 3 segundos
    [MetricType.API_RESPONSE]: 5000, // 5 segundos
    [MetricType.RENDER_TIME]: 100, // 100ms
    [MetricType.MEMORY_USAGE]: 100 * 1024 * 1024, // 100MB
    [MetricType.NETWORK_LATENCY]: 2000, // 2 segundos
    [MetricType.USER_INTERACTION]: 500, // 500ms
    [MetricType.FIREBASE_OPERATION]: 3000 // 3 segundos
  }
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;
  private isInitialized = false;
  private uploadTimer?: NodeJS.Timeout;
  private activeTimers = new Map<string, number>();

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Cargar métricas existentes
      await this.loadStoredData();
      
      // Configurar upload automático
      this.setupAutoUpload();
      
      // Configurar monitoreo automático
      this.setupAutoMonitoring();
      
      this.isInitialized = true;
      console.log('📊 PerformanceMonitor inicializado');
    } catch (error) {
      console.error('❌ Error inicializando PerformanceMonitor:', error);
    }
  }

  // Iniciar medición de tiempo
  startTimer(name: string, type: MetricType = MetricType.LOAD_TIME): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTimers.set(timerId, performance.now());
    
    console.log(`⏱️ Timer iniciado: ${name} [${timerId}]`);
    return timerId;
  }

  // Finalizar medición de tiempo
  async endTimer(
    timerId: string,
    name: string,
    type: MetricType = MetricType.LOAD_TIME,
    context?: any
  ): Promise<number> {
    const startTime = this.activeTimers.get(timerId);
    if (!startTime) {
      console.warn(`⚠️ Timer no encontrado: ${timerId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(timerId);
    
    await this.recordMetric(type, name, duration, 'ms', context);
    
    console.log(`✅ Timer finalizado: ${name} - ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Registrar métrica
  async recordMetric(
    type: MetricType,
    name: string,
    value: number,
    unit: string = 'ms',
    context?: any,
    userId?: string
  ): Promise<string> {
    const metricId = this.generateMetricId();
    
    const metric: PerformanceMetric = {
      id: metricId,
      type,
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
      userId,
      sessionId: this.sessionId
    };

    // Agregar métrica
    this.metrics.unshift(metric);
    
    // Mantener límite de métricas
    if (this.metrics.length > PERFORMANCE_CONFIG.maxMetrics) {
      this.metrics = this.metrics.slice(0, PERFORMANCE_CONFIG.maxMetrics);
    }

    // Verificar umbrales
    await this.checkThresholds(metric);
    
    // Guardar en storage
    await this.saveToStorage();
    
    // Enviar a analytics
    analyticsManager.trackEvent('performance_metric', {
      metric_type: type,
      metric_name: name,
      metric_value: value,
      metric_unit: unit
    });

    return metricId;
  }

  // Medir tiempo de carga de componente
  measureComponentLoad<T>(
    componentName: string,
    loadFunction: () => Promise<T>
  ): Promise<T> {
    return this.measureAsync(
      `component_load_${componentName}`,
      MetricType.LOAD_TIME,
      loadFunction,
      { component: componentName }
    );
  }

  // Medir tiempo de respuesta de API
  measureApiCall<T>(
    endpoint: string,
    apiFunction: () => Promise<T>
  ): Promise<T> {
    return this.measureAsync(
      `api_call_${endpoint}`,
      MetricType.API_RESPONSE,
      apiFunction,
      { endpoint }
    );
  }

  // Medir operación de Firebase
  measureFirebaseOperation<T>(
    operation: string,
    firebaseFunction: () => Promise<T>
  ): Promise<T> {
    return this.measureAsync(
      `firebase_${operation}`,
      MetricType.FIREBASE_OPERATION,
      firebaseFunction,
      { operation }
    );
  }

  // Función genérica para medir operaciones async
  async measureAsync<T>(
    name: string,
    type: MetricType,
    asyncFunction: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const timerId = this.startTimer(name, type);
    
    try {
      const result = await asyncFunction();
      await this.endTimer(timerId, name, type, { ...context, success: true });
      return result;
    } catch (error) {
      await this.endTimer(timerId, name, type, { ...context, success: false, error: error.message });
      throw error;
    }
  }

  // Registrar uso de memoria
  async recordMemoryUsage(context?: any): Promise<void> {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      
      await this.recordMetric(
        MetricType.MEMORY_USAGE,
        'heap_used',
        memInfo.usedJSHeapSize,
        'bytes',
        {
          total: memInfo.totalJSHeapSize,
          limit: memInfo.jsHeapSizeLimit,
          ...context
        }
      );
    }
  }

  // Obtener estadísticas de performance
  getPerformanceStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = this.metrics.filter(m => m.timestamp > last24h);
    const recent7d = this.metrics.filter(m => m.timestamp > last7d);

    return {
      total: this.metrics.length,
      last24h: recent24h.length,
      last7d: recent7d.length,
      byType: this.groupByType(recent24h),
      averages: this.calculateAverages(recent24h),
      alerts: this.alerts.length,
      recentAlerts: this.alerts.filter(a => a.timestamp > last24h).length
    };
  }

  // Obtener métricas recientes
  getRecentMetrics(limit: number = 50): PerformanceMetric[] {
    return this.metrics.slice(0, limit);
  }

  // Obtener alertas recientes
  getRecentAlerts(limit: number = 20): PerformanceAlert[] {
    return this.alerts.slice(0, limit);
  }

  // Limpiar datos antiguos
  async clearOldData(daysOld: number = 7): Promise<{ metrics: number; alerts: number }> {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const initialMetrics = this.metrics.length;
    const initialAlerts = this.alerts.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    await this.saveToStorage();
    
    const removed = {
      metrics: initialMetrics - this.metrics.length,
      alerts: initialAlerts - this.alerts.length
    };
    
    console.log(`🧹 Datos de performance limpiados:`, removed);
    return removed;
  }

  // Métodos privados
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async checkThresholds(metric: PerformanceMetric): Promise<void> {
    const threshold = PERFORMANCE_CONFIG.thresholds[metric.type];
    if (!threshold || metric.value <= threshold) return;

    // Determinar severidad basada en qué tanto se excedió el umbral
    const exceedRatio = metric.value / threshold;
    let severity: ErrorSeverity;
    
    if (exceedRatio > 3) {
      severity = ErrorSeverity.CRITICAL;
    } else if (exceedRatio > 2) {
      severity = ErrorSeverity.HIGH;
    } else {
      severity = ErrorSeverity.MEDIUM;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: metric.type,
      threshold,
      actualValue: metric.value,
      severity,
      timestamp: Date.now(),
      context: metric.context
    };

    this.alerts.unshift(alert);
    
    // Registrar como error en el sistema
    await errorLogger.logError(
      `Performance threshold exceeded: ${metric.name}`,
      ErrorType.PERFORMANCE,
      severity,
      {
        metric: metric.name,
        type: metric.type,
        value: metric.value,
        threshold,
        unit: metric.unit,
        exceedRatio
      }
    );

    console.warn(`⚠️ Umbral de performance excedido:`, {
      metric: metric.name,
      value: metric.value,
      threshold,
      severity
    });
  }

  private groupByType(metrics: PerformanceMetric[]) {
    return metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverages(metrics: PerformanceMetric[]) {
    const byType = metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = { total: 0, count: 0 };
      }
      acc[metric.type].total += metric.value;
      acc[metric.type].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(byType).reduce((acc, [type, data]) => {
      acc[type] = data.total / data.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [storedMetrics, storedAlerts] = await Promise.all([
        AsyncStorage.getItem(PERFORMANCE_CONFIG.storageKey),
        AsyncStorage.getItem(PERFORMANCE_CONFIG.alertsKey)
      ]);
      
      if (storedMetrics) {
        this.metrics = JSON.parse(storedMetrics);
      }
      
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      }
    } catch (error) {
      console.error('❌ Error cargando datos de performance:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(PERFORMANCE_CONFIG.storageKey, JSON.stringify(this.metrics)),
        AsyncStorage.setItem(PERFORMANCE_CONFIG.alertsKey, JSON.stringify(this.alerts))
      ]);
    } catch (error) {
      console.error('❌ Error guardando datos de performance:', error);
    }
  }

  private setupAutoUpload(): void {
    this.uploadTimer = setInterval(async () => {
      await this.uploadMetrics();
    }, PERFORMANCE_CONFIG.uploadInterval);
  }

  private async uploadMetrics(): Promise<void> {
    const unsentMetrics = this.metrics.filter(m => {
      // Solo enviar métricas de las últimas 24 horas
      const last24h = Date.now() - (24 * 60 * 60 * 1000);
      return m.timestamp > last24h;
    });

    if (unsentMetrics.length > 0) {
      console.log(`📤 Subiendo ${unsentMetrics.length} métricas de performance...`);
      // Aquí se implementaría el envío real a un servicio de analytics
    }
  }

  private setupAutoMonitoring(): void {
    // Monitorear memoria cada 30 segundos
    setInterval(() => {
      this.recordMemoryUsage({ auto: true });
    }, 30000);

    // Monitorear performance de red si está disponible
    if (Platform.OS === 'web' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.recordMetric(
          MetricType.NETWORK_LATENCY,
          'connection_rtt',
          connection.rtt || 0,
          'ms',
          {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink
          }
        );
      }
    }
  }

  // Cleanup
  destroy(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }
    this.activeTimers.clear();
  }
}

// Instancia singleton
export const performanceMonitor = new PerformanceMonitor();

// Funciones de utilidad
export const measureTime = (name: string, type?: MetricType) => {
  return performanceMonitor.startTimer(name, type);
};

export const endMeasurement = (timerId: string, name: string, type?: MetricType, context?: any) => {
  return performanceMonitor.endTimer(timerId, name, type, context);
};

export const measureAsync = <T>(
  name: string,
  type: MetricType,
  asyncFunction: () => Promise<T>,
  context?: any
) => {
  return performanceMonitor.measureAsync(name, type, asyncFunction, context);
};

// Decorador para medir métodos
export function measureMethod(name?: string, type: MetricType = MetricType.USER_INTERACTION) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        methodName,
        type,
        () => originalMethod.apply(this, args),
        { method: propertyKey, args: args.length }
      );
    };

    return descriptor;
  };
}

// Inicializar automáticamente
performanceMonitor.initialize();

export default performanceMonitor;