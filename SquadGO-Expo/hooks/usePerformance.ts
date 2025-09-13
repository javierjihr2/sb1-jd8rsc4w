import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform } from 'react-native';

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (Date.now() - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Hook para operaciones después de las interacciones
export function useAfterInteractions() {
  const [interactionsComplete, setInteractionsComplete] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionsComplete(true);
    });

    return () => task.cancel();
  }, []);

  return interactionsComplete;
}

// Hook para memoización pesada con cleanup
export function useHeavyMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  cleanup?: (value: T) => void
): T {
  const memoizedValue = useMemo(factory, deps);
  const previousValue = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (previousValue.current && cleanup) {
      cleanup(previousValue.current);
    }
    previousValue.current = memoizedValue;
  }, [memoizedValue, cleanup]);

  useEffect(() => {
    return () => {
      if (previousValue.current && cleanup) {
        cleanup(previousValue.current);
      }
    };
  }, [cleanup]);

  return memoizedValue;
}

// Hook para lazy state (estado que se inicializa solo cuando se necesita)
export function useLazyState<T>(
  initializer: () => T
): [T | undefined, () => T, (value: T) => void] {
  const [state, setState] = useState<T | undefined>(undefined);
  const initializerRef = useRef(initializer);
  const initializedRef = useRef(false);

  const getValue = useCallback(() => {
    if (!initializedRef.current) {
      const value = initializerRef.current();
      setState(value);
      initializedRef.current = true;
      return value;
    }
    return state as T;
  }, [state]);

  const setValue = useCallback((value: T) => {
    setState(value);
    initializedRef.current = true;
  }, []);

  return [state, getValue, setValue];
}

// Hook para batching de actualizaciones
export function useBatchedUpdates<T>(
  initialValue: T,
  batchDelay: number = 16
): [T, (updater: (prev: T) => T) => void] {
  const [state, setState] = useState(initialValue);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const batchedSetState = useCallback(
    (updater: (prev: T) => T) => {
      pendingUpdates.current.push(updater);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setState(prevState => {
          let newState = prevState;
          pendingUpdates.current.forEach(update => {
            newState = update(newState);
          });
          pendingUpdates.current = [];
          return newState;
        });
      }, batchDelay);
    },
    [batchDelay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
}

// Hook para monitoreo de rendimiento
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (__DEV__) {
      console.log(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceMount,
        timeSinceLastRender,
      });
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
  };
}

// Hook para lazy loading de datos
export function useLazyData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
} {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const fetch = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(undefined);

    try {
      const result = await fetcherRef.current();
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err as Error);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { data, loading, error, refetch: fetch };
}

// Utilidades de rendimiento
export const PerformanceUtils = {
  // Función para medir tiempo de ejecución
  measureTime: <T>(fn: () => T, label?: string): T => {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    
    if (__DEV__ && label) {
      console.log(`[Performance] ${label}: ${end - start}ms`);
    }
    
    return result;
  },

  // Función para ejecutar en el siguiente frame
  nextFrame: (callback: () => void): void => {
    if (Platform.OS === 'web') {
      requestAnimationFrame(callback);
    } else {
      InteractionManager.runAfterInteractions(callback);
    }
  },

  // Función para chunking de arrays grandes
  processInChunks: async <T, R>(
    array: T[],
    processor: (item: T) => R,
    chunkSize: number = 10,
    delay: number = 0
  ): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const chunkResults = chunk.map(processor);
      results.push(...chunkResults);
      
      if (delay > 0 && i + chunkSize < array.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  },
};