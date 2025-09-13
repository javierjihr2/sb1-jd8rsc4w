import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

// Hook para optimización de rendimiento con memoización
export const usePerformanceOptimization = () => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (__DEV__) {
      console.log(`Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

// Hook para memoización de cálculos pesados
export const useHeavyComputation = <T>(computeFn: () => T, deps: React.DependencyList): T => {
  return useMemo(() => {
    const startTime = Date.now();
    const result = computeFn();
    const endTime = Date.now();
    
    if (__DEV__) {
      console.log(`Heavy computation took ${endTime - startTime}ms`);
    }
    
    return result;
  }, deps);
};

// Hook para callbacks optimizados
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Hook para ejecutar tareas después de las interacciones
export const useAfterInteractions = () => {
  const runAfterInteractions = useCallback((task: () => void) => {
    InteractionManager.runAfterInteractions(() => {
      task();
    });
  }, []);

  return { runAfterInteractions };
};

// Hook para debounce optimizado
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle optimizado
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (Date.now() - lastRun.current));
    }
  }, [callback, delay]) as T;
};

// Hook para memoización de estilos
export const useMemoizedStyles = <T>(stylesFn: () => T, deps: React.DependencyList): T => {
  return useMemo(stylesFn, deps);
};

// Hook para optimización de listas
export const useListOptimization = () => {
  const getItemLayout = useCallback(
    (data: any, index: number, itemHeight: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id?.toString() || index.toString();
  }, []);

  return {
    getItemLayout,
    keyExtractor,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
  };
};

// Hook para optimización de imágenes
export const useImageOptimization = () => {
  const getOptimizedImageUri = useCallback((uri: string, width?: number, height?: number) => {
    if (!uri) return uri;
    
    // Si es una URL de imagen, agregar parámetros de optimización
    if (uri.startsWith('http')) {
      const url = new URL(uri);
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('q', '80'); // Calidad 80%
      url.searchParams.set('f', 'webp'); // Formato WebP
      return url.toString();
    }
    
    return uri;
  }, []);

  return { getOptimizedImageUri };
};

// Hook para monitoreo de rendimiento
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (__DEV__ && renderTime > 16.67) { // Más de 16.67ms = menos de 60 FPS
        console.warn(
          `${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        );
      }
    }
  });

  return {
    renderCount: renderCount.current,
  };
};