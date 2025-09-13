import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingOperation {
  id: string;
  description: string;
  startTime: Date;
  timeout?: number;
}

export interface GlobalLoadingState {
  operations: Map<string, LoadingOperation>;
  isLoading: boolean;
  primaryOperation: LoadingOperation | null;
  operationCount: number;
}

const initialState: GlobalLoadingState = {
  operations: new Map(),
  isLoading: false,
  primaryOperation: null,
  operationCount: 0
};

export const useGlobalLoadingState = () => {
  const [state, setState] = useState<GlobalLoadingState>(initialState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Función para actualizar el estado
  const updateState = useCallback((updater: (prev: GlobalLoadingState) => GlobalLoadingState) => {
    setState(updater);
  }, []);

  // Iniciar una operación de carga
  const startLoading = useCallback((id: string, description: string, timeout?: number) => {
    const operation: LoadingOperation = {
      id,
      description,
      startTime: new Date(),
      timeout
    };

    updateState(prev => {
      const newOperations = new Map(prev.operations);
      newOperations.set(id, operation);
      
      const operationCount = newOperations.size;
      const isLoading = operationCount > 0;
      const primaryOperation = Array.from(newOperations.values())[0] || null;

      return {
        operations: newOperations,
        isLoading,
        primaryOperation,
        operationCount
      };
    });

    // Configurar timeout si se especifica
    if (timeout && timeout > 0) {
      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ Loading operation '${id}' timed out after ${timeout}ms`);
        stopLoading(id);
      }, timeout);
      
      timeoutsRef.current.set(id, timeoutId);
    }

    console.log(`🔄 Started loading: ${description} (${id})`);
  }, [updateState]);

  // Detener una operación de carga
  const stopLoading = useCallback((id: string) => {
    updateState(prev => {
      const newOperations = new Map(prev.operations);
      const operation = newOperations.get(id);
      
      if (operation) {
        const duration = Date.now() - operation.startTime.getTime();
        console.log(`✅ Completed loading: ${operation.description} (${duration}ms)`);
        newOperations.delete(id);
      }

      const operationCount = newOperations.size;
      const isLoading = operationCount > 0;
      const primaryOperation = Array.from(newOperations.values())[0] || null;

      return {
        operations: newOperations,
        isLoading,
        primaryOperation,
        operationCount
      };
    });

    // Limpiar timeout si existe
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, [updateState]);

  // Detener todas las operaciones
  const stopAllLoading = useCallback(() => {
    updateState(prev => {
      // Limpiar todos los timeouts
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current.clear();

      console.log(`🛑 Stopped all loading operations (${prev.operationCount} operations)`);

      return {
        operations: new Map(),
        isLoading: false,
        primaryOperation: null,
        operationCount: 0
      };
    });
  }, [updateState]);

  // Verificar si una operación específica está en curso
  const isOperationLoading = useCallback((id: string) => {
    return state.operations.has(id);
  }, [state.operations]);

  // Obtener información de una operación específica
  const getOperationInfo = useCallback((id: string) => {
    const operation = state.operations.get(id);
    if (!operation) return null;

    return {
      ...operation,
      duration: Date.now() - operation.startTime.getTime()
    };
  }, [state.operations]);

  // Obtener todas las operaciones activas
  const getActiveOperations = useCallback(() => {
    return Array.from(state.operations.values()).map(operation => ({
      ...operation,
      duration: Date.now() - operation.startTime.getTime()
    }));
  }, [state.operations]);

  // Hook para operaciones con timeout automático
  const withTimeout = useCallback(async <T>(
    id: string,
    description: string,
    operation: () => Promise<T>,
    timeout: number = 30000
  ): Promise<T> => {
    startLoading(id, description, timeout);
    
    try {
      const result = await operation();
      stopLoading(id);
      return result;
    } catch (error) {
      stopLoading(id);
      throw error;
    }
  }, [startLoading, stopLoading]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  // Detectar operaciones que han estado ejecutándose demasiado tiempo
  useEffect(() => {
    const checkLongRunningOperations = () => {
      const now = Date.now();
      const longRunningThreshold = 60000; // 1 minuto

      state.operations.forEach((operation, id) => {
        const duration = now - operation.startTime.getTime();
        if (duration > longRunningThreshold) {
          console.warn(`⚠️ Long-running operation detected: ${operation.description} (${Math.round(duration / 1000)}s)`);
        }
      });
    };

    if (state.isLoading) {
      const interval = setInterval(checkLongRunningOperations, 30000); // Verificar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [state.isLoading, state.operations]);

  return {
    // Estado
    isLoading: state.isLoading,
    operationCount: state.operationCount,
    primaryOperation: state.primaryOperation,
    
    // Acciones
    startLoading,
    stopLoading,
    stopAllLoading,
    
    // Consultas
    isOperationLoading,
    getOperationInfo,
    getActiveOperations,
    
    // Utilidades
    withTimeout
  };
};

// Hook simplificado para operaciones individuales
export const useLoadingOperation = (id: string, description: string) => {
  const { startLoading, stopLoading, isOperationLoading } = useGlobalLoadingState();
  
  const start = useCallback((customDescription?: string) => {
    startLoading(id, customDescription || description);
  }, [id, description, startLoading]);
  
  const stop = useCallback(() => {
    stopLoading(id);
  }, [id, stopLoading]);
  
  const isLoading = isOperationLoading(id);
  
  return { start, stop, isLoading };
};

// Hook para operaciones con estado local
export const useAsyncOperation = <T = any>(id: string, description: string) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { startLoading, stopLoading, isOperationLoading } = useGlobalLoadingState();
  
  const execute = useCallback(async (operation: () => Promise<T>) => {
    setError(null);
    setData(null);
    startLoading(id, description);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      stopLoading(id);
    }
  }, [id, description, startLoading, stopLoading]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    stopLoading(id);
  }, [id, stopLoading]);
  
  return {
    data,
    error,
    isLoading: isOperationLoading(id),
    execute,
    reset
  };
};