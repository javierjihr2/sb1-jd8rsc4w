import React, { Suspense, ComponentType, lazy, useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMonitoring } from '../hooks/useMonitoring';

const { width, height } = Dimensions.get('window');

interface LazyLoadOptions {
  fallback?: ComponentType;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  timeout?: number;
  retryAttempts?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: Error) => void;
}

interface LazyComponentProps {
  [key: string]: any;
}

/**
 * Hook para lazy loading con analytics y error handling
 */
export function useLazyLoad<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback: CustomFallback,
    errorBoundary: CustomErrorBoundary,
    preload = false,
    timeout = 10000,
    retryAttempts = 3,
    onLoadStart,
    onLoadEnd,
    onError
  } = options;

  const [isPreloaded, setIsPreloaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { trackEvent } = useAnalytics();
  const { trackError } = useMonitoring();

  // Preload component if requested
  useEffect(() => {
    if (preload && !isPreloaded) {
      preloadComponent();
    }
  }, [preload]);

  const preloadComponent = async () => {
    try {
      onLoadStart?.();
      trackEvent('component_preload_start', {
        component: importFunction.toString(),
        timestamp: Date.now()
      });

      const startTime = Date.now();
      await importFunction();
      const loadTime = Date.now() - startTime;

      setIsPreloaded(true);
      onLoadEnd?.();
      
      trackEvent('component_preload_success', {
        component: importFunction.toString(),
        load_time: loadTime,
        timestamp: Date.now()
      });
    } catch (error) {
      const err = error as Error;
      setLoadError(err);
      onError?.(err);
      trackError(err, 'component_preload_failed');
    }
  };

  const createLazyComponent = () => {
    return lazy(() => {
      const startTime = Date.now();
      
      return Promise.race([
        importFunction().then(module => {
          const loadTime = Date.now() - startTime;
          trackEvent('component_lazy_load_success', {
            component: importFunction.toString(),
            load_time: loadTime,
            was_preloaded: isPreloaded,
            timestamp: Date.now()
          });
          return module;
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error(`Component load timeout after ${timeout}ms`);
            trackError(timeoutError, 'component_load_timeout');
            reject(timeoutError);
          }, timeout);
        })
      ]).catch(error => {
        const err = error as Error;
        trackError(err, 'component_lazy_load_failed');
        throw err;
      });
    });
  };

  const LazyComponent = createLazyComponent();

  const WrappedComponent: ComponentType<LazyComponentProps> = (props) => {
    const ErrorBoundary = CustomErrorBoundary || DefaultErrorBoundary;
    const Fallback = CustomFallback || DefaultLoadingFallback;

    return (
      <ErrorBoundary
        error={loadError}
        retry={() => {
          if (retryCount < retryAttempts) {
            setRetryCount(prev => prev + 1);
            setLoadError(null);
            trackEvent('component_load_retry', {
              component: importFunction.toString(),
              retry_count: retryCount + 1,
              timestamp: Date.now()
            });
          }
        }}
      >
        <Suspense fallback={<Fallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  return {
    Component: WrappedComponent,
    preload: preloadComponent,
    isPreloaded,
    loadError,
    retryCount
  };
}

/**
 * Componente de loading por defecto con animación
 */
const DefaultLoadingFallback: React.FC = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.loadingContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Cargando...</Text>
    </Animated.View>
  );
};

/**
 * Componente de error por defecto
 */
interface DefaultErrorBoundaryProps {
  error: Error | null;
  retry: () => void;
  children: React.ReactNode;
}

const DefaultErrorBoundary: React.FC<DefaultErrorBoundaryProps> = ({ 
  error, 
  retry, 
  children 
}) => {
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorMessage}>
          {error.message || 'Ocurrió un error inesperado'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

/**
 * Utility function para crear lazy components con configuración predeterminada
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
) {
  const { Component } = useLazyLoad(importFunction, options);
  return Component;
}

/**
 * Hook para precargar múltiples componentes
 */
export function usePreloadComponents(
  components: Array<{
    name: string;
    importFunction: () => Promise<{ default: ComponentType<any> }>;
    priority?: 'high' | 'medium' | 'low';
  }>
) {
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());
  const [preloadErrors, setPreloadErrors] = useState<Record<string, Error>>({});
  const { trackEvent } = useAnalytics();
  const { trackError } = useMonitoring();

  const preloadComponent = async (component: typeof components[0]) => {
    try {
      const startTime = Date.now();
      await component.importFunction();
      const loadTime = Date.now() - startTime;

      setPreloadedComponents(prev => new Set([...prev, component.name]));
      
      trackEvent('component_preload_batch_success', {
        component_name: component.name,
        load_time: loadTime,
        priority: component.priority || 'medium',
        timestamp: Date.now()
      });
    } catch (error) {
      const err = error as Error;
      setPreloadErrors(prev => ({ ...prev, [component.name]: err }));
      trackError(err, 'component_preload_batch_failed', {
        component_name: component.name
      });
    }
  };

  const preloadAll = async () => {
    // Ordenar por prioridad
    const sortedComponents = [...components].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return aPriority - bPriority;
    });

    // Precargar componentes de alta prioridad primero
    const highPriorityComponents = sortedComponents.filter(c => c.priority === 'high');
    const otherComponents = sortedComponents.filter(c => c.priority !== 'high');

    // Precargar componentes de alta prioridad en paralelo
    if (highPriorityComponents.length > 0) {
      await Promise.allSettled(
        highPriorityComponents.map(component => preloadComponent(component))
      );
    }

    // Precargar otros componentes con delay para no bloquear la UI
    for (const component of otherComponents) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      preloadComponent(component);
    }
  };

  const preloadByPriority = async (priority: 'high' | 'medium' | 'low') => {
    const componentsToPreload = components.filter(c => c.priority === priority);
    await Promise.allSettled(
      componentsToPreload.map(component => preloadComponent(component))
    );
  };

  return {
    preloadAll,
    preloadByPriority,
    preloadedComponents,
    preloadErrors,
    isComponentPreloaded: (name: string) => preloadedComponents.has(name),
    getPreloadError: (name: string) => preloadErrors[name]
  };
}

/**
 * HOC para lazy loading con configuración avanzada
 */
export function withLazyLoading<P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  options?: LazyLoadOptions & {
    displayName?: string;
    preloadCondition?: () => boolean;
  }
) {
  const { displayName, preloadCondition, ...lazyOptions } = options || {};

  return function LazyWrapper(props: P) {
    const shouldPreload = preloadCondition ? preloadCondition() : false;
    
    const { Component } = useLazyLoad(importFunction, {
      ...lazyOptions,
      preload: shouldPreload
    });

    Component.displayName = displayName || 'LazyComponent';
    
    return <Component {...props} />;
  };
}

/**
 * Utility para lazy loading de rutas/pantallas
 */
export function createLazyScreen<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  screenName: string
) {
  return withLazyLoading(importFunction, {
    displayName: `LazyScreen(${screenName})`,
    fallback: () => (
      <View style={styles.screenLoadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.screenLoadingText}>Cargando {screenName}...</Text>
      </View>
    ),
    onLoadStart: () => {
      console.log(`Loading screen: ${screenName}`);
    },
    onLoadEnd: () => {
      console.log(`Screen loaded: ${screenName}`);
    }
  });
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    minHeight: 200
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    minHeight: 200
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  screenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  screenLoadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center'
  }
});

export default {
  useLazyLoad,
  createLazyComponent,
  usePreloadComponents,
  withLazyLoading,
  createLazyScreen
};