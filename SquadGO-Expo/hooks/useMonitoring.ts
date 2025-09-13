import { useEffect, useCallback, useRef } from 'react';
import { monitoringService, CustomEvents, PerformanceMetrics } from '../lib/monitoring';
import { nativeFirebaseService } from '../lib/firebase-native';

interface UseMonitoringOptions {
  screenName?: string;
  autoTrackScreenView?: boolean;
  trackComponentMount?: boolean;
}

interface MonitoringHookReturn {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackError: (error: Error, context?: string) => void;
  startTrace: (traceName: string) => () => void;
  trackScreenView: (screenName: string) => void;
  trackUserAction: (action: string, details?: Record<string, any>) => void;
  trackPerformance: (metric: PerformanceMetrics, value: number, attributes?: Record<string, string>) => void;
  setUserAttribute: (key: string, value: string) => void;
}

export function useMonitoring(options: UseMonitoringOptions = {}): MonitoringHookReturn {
  const {
    screenName,
    autoTrackScreenView = true,
    trackComponentMount = true
  } = options;

  const mountTimeRef = useRef<number>(Date.now());
  const activeTracesRef = useRef<Map<string, any>>(new Map());

  // Track screen view automáticamente
  useEffect(() => {
    if (autoTrackScreenView && screenName) {
      trackScreenView(screenName);
    }
  }, [screenName, autoTrackScreenView]);

  // Track component mount
  useEffect(() => {
    if (trackComponentMount) {
      const mountTime = Date.now() - mountTimeRef.current;
      
      monitoringService.trackEvent(CustomEvents.COMPONENT_MOUNTED, {
        component_name: screenName || 'unknown',
        mount_time_ms: mountTime,
        timestamp: Date.now()
      });
    }

    // Cleanup al desmontar
    return () => {
      // Finalizar todas las trazas activas
      activeTracesRef.current.forEach((trace, traceName) => {
        try {
          if (trace && typeof trace.stop === 'function') {
            trace.stop();
          }
        } catch (error) {
          console.warn(`Error finalizando traza ${traceName}:`, error);
        }
      });
      activeTracesRef.current.clear();

      if (trackComponentMount && screenName) {
        monitoringService.trackEvent(CustomEvents.COMPONENT_UNMOUNTED, {
          component_name: screenName,
          timestamp: Date.now()
        });
      }
    };
  }, [trackComponentMount, screenName]);

  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    try {
      monitoringService.trackEvent(eventName, {
        ...parameters,
        screen_name: screenName,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [screenName]);

  const trackError = useCallback((error: Error, context?: string) => {
    try {
      const errorContext = context || screenName || 'unknown_screen';
      monitoringService.recordError(error, errorContext);
    } catch (err) {
      console.error('Error tracking error:', err);
    }
  }, [screenName]);

  const startTrace = useCallback((traceName: string) => {
    try {
      const fullTraceName = screenName ? `${screenName}_${traceName}` : traceName;
      
      // Crear traza nativa si está disponible
      let nativeTrace = null;
      if (nativeFirebaseService.isAvailable()) {
        nativeTrace = nativeFirebaseService.newTrace(fullTraceName);
        if (nativeTrace) {
          nativeTrace.start();
        }
      }

      // Crear traza web
      const webTrace = monitoringService.startTrace(fullTraceName);
      
      // Guardar referencia
      activeTracesRef.current.set(fullTraceName, { native: nativeTrace, web: webTrace });

      // Retornar función para finalizar la traza
      return () => {
        try {
          const traces = activeTracesRef.current.get(fullTraceName);
          if (traces) {
            if (traces.native && typeof traces.native.stop === 'function') {
              traces.native.stop();
            }
            if (traces.web && typeof traces.web.stop === 'function') {
              traces.web.stop();
            }
            activeTracesRef.current.delete(fullTraceName);
          }
        } catch (error) {
          console.error(`Error finalizando traza ${fullTraceName}:`, error);
        }
      };
    } catch (error) {
      console.error('Error starting trace:', error);
      return () => {}; // Retornar función vacía en caso de error
    }
  }, [screenName]);

  const trackScreenView = useCallback((screenName: string) => {
    try {
      // Track en analytics web
      monitoringService.trackEvent('screen_view', {
        screen_name: screenName,
        timestamp: Date.now()
      });

      // Track en analytics nativo
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.logScreenView(screenName);
      }
    } catch (error) {
      console.error('Error tracking screen view:', error);
    }
  }, []);

  const trackUserAction = useCallback((action: string, details?: Record<string, any>) => {
    try {
      monitoringService.trackEvent(CustomEvents.USER_ACTION, {
        action,
        screen_name: screenName,
        ...details,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }, [screenName]);

  const trackPerformance = useCallback((metric: PerformanceMetrics, value: number, attributes?: Record<string, string>) => {
    try {
      monitoringService.recordCustomMetric(metric, value, {
        ...attributes,
        screen_name: screenName || 'unknown'
      });
    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  }, [screenName]);

  const setUserAttribute = useCallback((key: string, value: string) => {
    try {
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.setAttribute(key, value);
      }
      
      // También trackear como evento para analytics web
      monitoringService.trackEvent('user_attribute_set', {
        attribute_key: key,
        attribute_value: value,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error setting user attribute:', error);
    }
  }, []);

  return {
    trackEvent,
    trackError,
    startTrace,
    trackScreenView,
    trackUserAction,
    trackPerformance,
    setUserAttribute
  };
}

// Hook especializado para tracking de performance
export function usePerformanceTracking(traceName: string, dependencies: any[] = []) {
  const { startTrace } = useMonitoring();
  const stopTraceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Iniciar traza
    stopTraceRef.current = startTrace(traceName);

    // Cleanup
    return () => {
      if (stopTraceRef.current) {
        stopTraceRef.current();
        stopTraceRef.current = null;
      }
    };
  }, dependencies);

  return {
    stopTrace: () => {
      if (stopTraceRef.current) {
        stopTraceRef.current();
        stopTraceRef.current = null;
      }
    }
  };
}

// Hook para tracking de errores con boundary
export function useErrorTracking(componentName: string) {
  const { trackError } = useMonitoring({ screenName: componentName });

  const trackComponentError = useCallback((error: Error, errorInfo?: any) => {
    trackError(error, `${componentName}_error_boundary`);
    
    // Log adicional para debugging
    console.error(`Error en componente ${componentName}:`, {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }, [trackError, componentName]);

  return { trackComponentError };
}

export default useMonitoring;