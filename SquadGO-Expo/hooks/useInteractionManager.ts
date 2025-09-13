import { useEffect, useRef, useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';

// Hook para ejecutar operaciones después de las interacciones
export const useInteractionManager = () => {
  const interactionHandle = useRef<number | null>(null);

  const runAfterInteractions = useCallback(<T>(
    task: () => T | Promise<T>,
    timeout?: number
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const executeTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (timeout) {
        // Con timeout para evitar esperas indefinidas
        const timeoutId = setTimeout(() => {
          executeTask();
        }, timeout);

        InteractionManager.runAfterInteractions(() => {
          clearTimeout(timeoutId);
          executeTask();
        });
      } else {
        InteractionManager.runAfterInteractions(executeTask);
      }
    });
  }, []);

  const createInteractionHandle = useCallback(() => {
    if (interactionHandle.current) {
      InteractionManager.clearInteractionHandle(interactionHandle.current);
    }
    interactionHandle.current = InteractionManager.createInteractionHandle();
    return interactionHandle.current;
  }, []);

  const clearInteractionHandle = useCallback(() => {
    if (interactionHandle.current) {
      InteractionManager.clearInteractionHandle(interactionHandle.current);
      interactionHandle.current = null;
    }
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearInteractionHandle();
    };
  }, [clearInteractionHandle]);

  return {
    runAfterInteractions,
    createInteractionHandle,
    clearInteractionHandle,
  };
};

// Hook para operaciones pesadas con estado de carga
export const useHeavyOperation = <T>() => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { runAfterInteractions } = useInteractionManager();

  const execute = useCallback(async (
    operation: () => T | Promise<T>,
    options?: {
      timeout?: number;
      onStart?: () => void;
      onComplete?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    setLoading(true);
    setError(null);
    options?.onStart?.();

    try {
      const result = await runAfterInteractions(operation, options?.timeout);
      setResult(result);
      options?.onComplete?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [runAfterInteractions]);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    result,
    error,
    execute,
    reset,
  };
};

// Hook para batch de operaciones pesadas
export const useBatchOperations = () => {
  const { runAfterInteractions } = useInteractionManager();
  const [operations, setOperations] = useState<Array<() => void>>([]);
  const [processing, setProcessing] = useState(false);
  const batchTimeout = useRef<NodeJS.Timeout>();

  const addOperation = useCallback((operation: () => void) => {
    setOperations(prev => [...prev, operation]);
  }, []);

  const processBatch = useCallback(async () => {
    if (operations.length === 0 || processing) return;

    setProcessing(true);
    
    try {
      await runAfterInteractions(async () => {
        // Procesar operaciones en chunks para no bloquear la UI
        const chunkSize = 5;
        for (let i = 0; i < operations.length; i += chunkSize) {
          const chunk = operations.slice(i, i + chunkSize);
          
          // Ejecutar chunk
          await Promise.all(chunk.map(op => 
            new Promise<void>(resolve => {
              op();
              resolve();
            })
          ));
          
          // Pequeña pausa entre chunks para mantener la UI fluida
          if (i + chunkSize < operations.length) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
      });
    } finally {
      setOperations([]);
      setProcessing(false);
    }
  }, [operations, processing, runAfterInteractions]);

  const scheduleBatch = useCallback((delay = 100) => {
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }
    
    batchTimeout.current = setTimeout(() => {
      processBatch();
    }, delay);
  }, [processBatch]);

  // Auto-procesar cuando se agregan operaciones
  useEffect(() => {
    if (operations.length > 0 && !processing) {
      scheduleBatch();
    }
  }, [operations.length, processing, scheduleBatch]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, []);

  return {
    addOperation,
    processBatch,
    processing,
    pendingOperations: operations.length,
  };
};

// Hook para operaciones de red optimizadas
export const useOptimizedNetworkOperation = <T>() => {
  const { runAfterInteractions } = useInteractionManager();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController>();

  const execute = useCallback(async (
    networkOperation: (signal: AbortSignal) => Promise<T>,
    options?: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
    }
  ) => {
    // Cancelar operación anterior si existe
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;
    
    setLoading(true);
    setError(null);

    const { retries = 3, retryDelay = 1000 } = options || {};
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await runAfterInteractions(async () => {
          return await networkOperation(signal);
        }, options?.timeout);
        
        if (!signal.aborted) {
          setData(result);
          setLoading(false);
          return result;
        }
      } catch (err) {
        if (signal.aborted) {
          break;
        }
        
        if (attempt === retries) {
          const error = err as Error;
          setError(error);
          setLoading(false);
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }, [runAfterInteractions]);

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
  }, [cancel]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    loading,
    data,
    error,
    execute,
    cancel,
    reset,
  };
};

// Hook para operaciones de base de datos optimizadas
export const useOptimizedDatabaseOperation = <T>() => {
  const { runAfterInteractions } = useInteractionManager();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const operationQueue = useRef<Array<() => Promise<any>>>([]);
  const processing = useRef(false);

  const processQueue = useCallback(async () => {
    if (processing.current || operationQueue.current.length === 0) {
      return;
    }

    processing.current = true;
    
    while (operationQueue.current.length > 0) {
      const operation = operationQueue.current.shift();
      if (operation) {
        try {
          await runAfterInteractions(operation);
        } catch (error) {
          console.error('Database operation failed:', error);
        }
      }
    }
    
    processing.current = false;
  }, [runAfterInteractions]);

  const execute = useCallback(async (
    dbOperation: () => Promise<T>,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
    }
  ) => {
    setLoading(true);
    setError(null);

    const operation = async () => {
      try {
        const result = await dbOperation();
        setData(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // Agregar a la cola según prioridad
    if (options?.priority === 'high') {
      operationQueue.current.unshift(operation);
    } else {
      operationQueue.current.push(operation);
    }

    // Procesar cola
    processQueue();
  }, [processQueue]);

  const reset = useCallback(() => {
    setLoading(false);
    setData(null);
    setError(null);
    operationQueue.current = [];
  }, []);

  return {
    loading,
    data,
    error,
    execute,
    reset,
    queueLength: operationQueue.current.length,
  };
};

// Utilidades para operaciones comunes
export const InteractionUtils = {
  // Ejecutar después de animaciones
  afterAnimations: <T>(task: () => T | Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  // Ejecutar con delay mínimo
  withMinDelay: async <T>(
    task: () => T | Promise<T>,
    minDelay: number
  ): Promise<T> => {
    const start = Date.now();
    const result = await task();
    const elapsed = Date.now() - start;
    
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
    }
    
    return result;
  },

  // Ejecutar en chunks para no bloquear UI
  processInChunks: async <T>(
    items: T[],
    processor: (item: T) => void | Promise<void>,
    chunkSize = 10,
    chunkDelay = 1
  ): Promise<void> => {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      await InteractionManager.runAfterInteractions(async () => {
        await Promise.all(chunk.map(processor));
      });
      
      if (i + chunkSize < items.length && chunkDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, chunkDelay));
      }
    }
  },
};