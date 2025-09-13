// Sistema de optimización de rendimiento para React Native
import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { Image, ImageProps, Platform } from 'react-native';
import { performanceMonitor, MetricType } from './performance-monitor';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  imageCache: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    compressionQuality: 0.8
  },
  lazyLoading: {
    threshold: 100, // pixels
    rootMargin: '50px'
  },
  memoization: {
    maxCacheSize: 100,
    ttl: 5 * 60 * 1000 // 5 minutos
  }
};

// Cache para memoización
const memoCache = new Map<string, { value: any; timestamp: number; ttl: number }>();
const imageCache = new Map<string, { uri: string; timestamp: number; size: number }>();

// Interfaz para componentes optimizados
interface OptimizedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

// HOC para optimización automática de componentes
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: boolean;
    displayName?: string;
    measureRender?: boolean;
  } = {}
) {
  const { memo: useMemo = true, displayName, measureRender = false } = options;
  
  let OptimizedComponent = Component;
  
  // Aplicar memoización si está habilitada
  if (useMemo) {
    OptimizedComponent = memo(Component) as React.ComponentType<P>;
  }
  
  // Wrapper con medición de rendimiento
  const WrappedComponent: React.FC<P> = (props) => {
    if (measureRender) {
      return (
        <>
          <PerformanceMeasurer 
            name={displayName || Component.displayName || Component.name || 'Component'} 
            type="render" 
          />
          <OptimizedComponent {...props} />
        </>
      );
    }
    
    return <OptimizedComponent {...props} />;
  };
  
  if (displayName) {
    WrappedComponent.displayName = displayName;
  }
  
  return WrappedComponent;
}

// Componente para medir rendimiento
const PerformanceMeasurer: React.FC<{
  name: string;
  type: string;
}> = ({ name, type }) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      if (performanceMonitor && performanceMonitor.recordMetric) {
        performanceMonitor.recordMetric(type as any, endTime - startTime, { component: name });
      }
    };
  });
  
  return null;
};

// Hook optimizado para memoización con TTL
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  ttl: number = OPTIMIZATION_CONFIG.memoization.ttl
): T {
  const key = useMemo(() => {
    return JSON.stringify(deps) + Date.now().toString();
  }, deps);
  
  return useMemo(() => {
    const cached = memoCache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.value;
    }
    
    const value = factory();
    
    // Limpiar cache si está lleno
    if (memoCache.size >= OPTIMIZATION_CONFIG.memoization.maxCacheSize) {
      const oldestKey = memoCache.keys().next().value;
      memoCache.delete(oldestKey);
    }
    
    memoCache.set(key, { value, timestamp: now, ttl });
    return value;
  }, deps);
}

// Hook optimizado para callbacks
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Interfaz para imagen optimizada
interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  lazy?: boolean;
  cacheKey?: string;
  compressionQuality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  uri,
  placeholder,
  errorComponent,
  lazy = true,
  cacheKey,
  compressionQuality = OPTIMIZATION_CONFIG.imageCache.compressionQuality,
  ...imageProps
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [cachedUri, setCachedUri] = React.useState<string | null>(null);
  
  const finalCacheKey = cacheKey || uri;
  
  React.useEffect(() => {
    loadOptimizedImage();
  }, [uri]);
  
  const loadOptimizedImage = async () => {
    try {
      // Verificar cache primero
      const cached = imageCache.get(finalCacheKey);
      if (cached && (Date.now() - cached.timestamp) < OPTIMIZATION_CONFIG.imageCache.maxAge) {
        setCachedUri(cached.uri);
        return;
      }
      
      // Optimizar imagen si es necesario
      const optimizedUri = await optimizeImageUri(uri, compressionQuality);
      
      // Guardar en cache
      const size = estimateImageSize(optimizedUri);
      
      // Verificar límites de cache
      let currentSize = Array.from(imageCache.values()).reduce((sum, item) => sum + item.size, 0);
      
      while (currentSize + size > OPTIMIZATION_CONFIG.imageCache.maxSize && imageCache.size > 0) {
        const oldestKey = imageCache.keys().next().value;
        const oldestItem = imageCache.get(oldestKey);
        if (oldestItem) {
          currentSize -= oldestItem.size;
        }
        imageCache.delete(oldestKey);
      }
      
      imageCache.set(finalCacheKey, {
        uri: optimizedUri,
        timestamp: Date.now(),
        size
      });
      
      setCachedUri(optimizedUri);
    } catch (error) {
      console.warn('Error loading optimized image:', error);
      setCachedUri(uri); // Fallback a URI original
    }
  };
  
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };
  
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };
  
  if (hasError && errorComponent) {
    return <>{errorComponent}</>;
  }
  
  if (!isLoaded && placeholder) {
    return <>{placeholder}</>;
  }
  
  return (
    <Image
      {...imageProps}
      source={{ uri: cachedUri || uri }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
});

// Función para optimizar URI de imagen
const optimizeImageUri = async (
  uri: string,
  quality: number = 0.8
): Promise<string> => {
  // En una implementación real, aquí se aplicarían optimizaciones
  // como redimensionamiento, compresión, etc.
  // Por ahora, retornamos la URI original
  return uri;
};

// Función para estimar el tamaño de imagen
const estimateImageSize = (uri: string): number => {
  // Estimación básica basada en la longitud de la URI
  return uri.length * 1024; // Estimación aproximada
};

// Interfaz para componente lazy
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = null,
  threshold = OPTIMIZATION_CONFIG.lazyLoading.threshold
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const elementRef = React.useRef<any>(null);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Simulación de Intersection Observer para React Native
    // En una implementación real, usarías una librería como react-native-intersection-observer
    const checkVisibility = () => {
      // Lógica simplificada para determinar visibilidad
      setIsIntersecting(true);
      setIsVisible(true);
    };
    
    // Simular delay para lazy loading
    const timer = setTimeout(checkVisibility, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  if (!isVisible) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Hook para carga lazy de datos
export function useLazyData<T>(
  dataLoader: () => Promise<T>,
  deps: React.DependencyList = [],
  options: {
    enabled?: boolean;
    cacheKey?: string;
    ttl?: number;
  } = {}
) {
  const { enabled = true, cacheKey, ttl = 5 * 60 * 1000 } = options;
  
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const loadData = React.useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Verificar cache si hay cacheKey
      if (cacheKey) {
        const cached = memoCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
          setData(cached.value);
          setLoading(false);
          return;
        }
      }
      
      const result = await dataLoader();
      
      // Guardar en cache si hay cacheKey
      if (cacheKey) {
        memoCache.set(cacheKey, {
          value: result,
          timestamp: Date.now(),
          ttl
        });
      }
      
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, cacheKey, ttl, ...deps]);
  
  React.useEffect(() => {
    loadData();
  }, [loadData]);
  
  return {
    data,
    loading,
    error,
    refetch: loadData
  };
}

// Función para limpiar caches
export const clearOptimizationCaches = async (): Promise<void> => {
  try {
    // Limpiar cache de memoización
    memoCache.clear();
    
    // Limpiar cache de imágenes
    imageCache.clear();
    
    // Limpiar AsyncStorage relacionado
    const keys = await AsyncStorage.getAllKeys();
    const optimizationKeys = keys.filter(key => 
      key.startsWith('optimization_') || 
      key.startsWith('image_cache_') ||
      key.startsWith('memo_cache_')
    );
    
    if (optimizationKeys.length > 0) {
      await AsyncStorage.multiRemove(optimizationKeys);
    }
    
    console.log('Optimization caches cleared successfully');
  } catch (error) {
    console.error('Error clearing optimization caches:', error);
  }
};

// Función para obtener estadísticas de optimización
export const getOptimizationStats = () => {
  const memoSize = memoCache.size;
  const imageSize = imageCache.size;
  const totalImageCacheSize = Array.from(imageCache.values())
    .reduce((sum, item) => sum + item.size, 0);
  
  return {
    memoization: {
      cacheSize: memoSize,
      maxSize: OPTIMIZATION_CONFIG.memoization.maxCacheSize
    },
    imageCache: {
      itemCount: imageSize,
      totalSize: totalImageCacheSize,
      maxSize: OPTIMIZATION_CONFIG.imageCache.maxSize
    }
  };
};

// Configuración global de optimizaciones
export const setupGlobalOptimizations = () => {
  // Configurar limpieza automática de caches
  setInterval(cleanupExpiredCaches, 10 * 60 * 1000); // Cada 10 minutos
  
  console.log('Global optimizations setup completed');
};

// Función para limpiar caches expirados
const cleanupExpiredCaches = () => {
  const now = Date.now();
  
  // Limpiar cache de memoización
  for (const [key, item] of memoCache.entries()) {
    if (now - item.timestamp > item.ttl) {
      memoCache.delete(key);
    }
  }
  
  // Limpiar cache de imágenes
  for (const [key, item] of imageCache.entries()) {
    if (now - item.timestamp > OPTIMIZATION_CONFIG.imageCache.maxAge) {
      imageCache.delete(key);
    }
  }
};

// Inicializar optimizaciones globales
setupGlobalOptimizations();

export default {
  withPerformanceOptimization,
  useOptimizedMemo,
  useOptimizedCallback,
  OptimizedImage,
  LazyComponent,
  useLazyData,
  clearOptimizationCaches,
  getOptimizationStats
};