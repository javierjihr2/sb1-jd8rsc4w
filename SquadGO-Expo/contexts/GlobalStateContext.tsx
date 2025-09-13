import * as React from 'react';
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthState } from '../hooks/useAuthState';
import { useGlobalLoadingState } from '../hooks/useGlobalLoadingState';
import { User } from 'firebase/auth';
import { PlayerProfile } from '../lib/types';

export interface GlobalState {
  // Estados de autenticación
  auth: {
    user: User | null;
    profile: PlayerProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    lastActivity: Date | null;
    sessionExpiry: Date | null;
  };
  
  // Estados de carga global
  loading: {
    isLoading: boolean;
    operationCount: number;
    primaryOperation: any;
  };
}

export interface GlobalStateActions {
  // Acciones de autenticación
  auth: {
    updateUser: (user: User | null) => void;
    updateProfile: (profile: PlayerProfile | null) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    updateActivity: () => void;
    extendSession: (minutes?: number) => void;
    clearSession: () => void;
    retry: () => Promise<void>;
  };
  
  // Acciones de carga
  loading: {
    startLoading: (id: string, description: string, timeout?: number) => void;
    stopLoading: (id: string) => void;
    stopAllLoading: () => void;
    isOperationLoading: (id: string) => boolean;
    withTimeout: <T>(id: string, description: string, operation: () => Promise<T>, timeout?: number) => Promise<T>;
  };
}

const GlobalStateContext = createContext<{
  state: GlobalState;
  actions: GlobalStateActions;
} | null>(null);

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

// Hooks específicos para cada dominio
export const useAuthGlobalState = () => {
  const { state, actions } = useGlobalState();
  return {
    ...state.auth,
    ...actions.auth
  };
};

export const useLoadingGlobalState = () => {
  const { state, actions } = useGlobalState();
  return {
    ...state.loading,
    ...actions.loading
  };
};

// Hook para verificar si el usuario está autenticado
export const useIsAuthenticated = () => {
  const { state } = useGlobalState();
  return state.auth.isAuthenticated && !state.auth.isLoading;
};

// Hook para verificar si hay alguna operación en curso
export const useIsAppLoading = () => {
  const { state } = useGlobalState();
  return state.auth.isLoading || state.loading.isLoading;
};

interface GlobalStateProviderProps {
  children: ReactNode;
}

export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({ children }) => {
  // Hooks de estado
  const authState = useAuthState();
  const loadingState = useGlobalLoadingState();

  // Combinar estados
  const state: GlobalState = {
    auth: {
      user: authState.state.user,
      profile: authState.state.profile,
      isAuthenticated: !!(authState.state.user && authState.state.profile && authState.state.isInitialized),
      isLoading: authState.state.loading,
      error: authState.state.error,
      lastActivity: authState.state.lastSyncTime,
      sessionExpiry: null // No está implementado en useAuthState
    },
    loading: {
      isLoading: loadingState.isLoading,
      operationCount: loadingState.operationCount,
      primaryOperation: loadingState.primaryOperation
    }
  };

  // Combinar acciones
  const actions: GlobalStateActions = {
    auth: {
      updateUser: authState.actions.setUser,
      updateProfile: authState.actions.setProfile,
      setError: authState.actions.setError,
      clearError: authState.actions.clearError,
      updateActivity: authState.actions.updateLastSync,
      extendSession: () => {}, // No implementado en useAuthState
      clearSession: () => {
        authState.actions.setUser(null);
        authState.actions.setProfile(null);
      },
      retry: authState.actions.retry
    },
    loading: {
      startLoading: loadingState.startLoading,
      stopLoading: loadingState.stopLoading,
      stopAllLoading: loadingState.stopAllLoading,
      isOperationLoading: loadingState.isOperationLoading,
      withTimeout: loadingState.withTimeout
    }
  };

  // Integración entre estados de autenticación y carga
  useEffect(() => {
    if (authState.state.loading) {
      loadingState.startLoading('auth', 'Verificando autenticación...');
    } else {
      loadingState.stopLoading('auth');
    }
  }, [authState.state.loading, loadingState.startLoading, loadingState.stopLoading]);

  // Limpiar operaciones de carga al cerrar sesión
  useEffect(() => {
    const isAuthenticated = !!(authState.state.user && authState.state.profile && authState.state.isInitialized);
    if (!isAuthenticated && !authState.state.loading) {
      loadingState.stopAllLoading();
    }
  }, [authState.state.user, authState.state.profile, authState.state.isInitialized, authState.state.loading, loadingState.stopAllLoading]);

  // Logging para debugging
  useEffect(() => {
    console.log('🔄 Global State Update:', {
      auth: {
        isAuthenticated: state.auth.isAuthenticated,
        isLoading: state.auth.isLoading,
        hasUser: !!state.auth.user,
        hasProfile: !!state.auth.profile,
        error: state.auth.error
      },
      loading: {
        isLoading: state.loading.isLoading,
        operationCount: state.loading.operationCount,
        primaryOperation: state.loading.primaryOperation?.description
      }
    });
  }, [state]);

  return (
    <GlobalStateContext.Provider value={{ state, actions }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Componente de utilidad para mostrar el estado de carga
export const GlobalLoadingIndicator: React.FC<{
  showDetails?: boolean;
  style?: any;
}> = ({ showDetails = false, style }) => {
  const { state } = useGlobalState();
  
  if (!state.loading.isLoading && !state.auth.isLoading) {
    return null;
  }

  const primaryDescription = state.loading.primaryOperation?.description || 'Cargando...';
  const totalOperations = state.loading.operationCount + (state.auth.isLoading ? 1 : 0);

  return (
    <View style={[styles.globalLoadingIndicator, style]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{primaryDescription}</Text>
        {showDetails && totalOperations > 1 && (
          <Text style={styles.loadingCount}>({totalOperations} operaciones)</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  globalLoadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  loadingCount: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

// Hook para operaciones que requieren autenticación
export const useAuthenticatedOperation = <T = any>(id: string, description: string) => {
  const { state, actions } = useGlobalState();
  
  const execute = async (operation: () => Promise<T>): Promise<T> => {
    if (!state.auth.isAuthenticated) {
      throw new Error('Usuario no autenticado');
    }
    
    if (state.auth.isLoading) {
      throw new Error('Autenticación en progreso');
    }
    
    return actions.loading.withTimeout(id, description, operation);
  };
  
  return {
    execute,
    canExecute: state.auth.isAuthenticated && !state.auth.isLoading,
    isLoading: actions.loading.isOperationLoading(id)
  };
};

// Hook para reintentos automáticos con backoff
export const useRetryableOperation = <T = any>(
  id: string,
  description: string,
  maxRetries: number = 3
) => {
  const { actions } = useGlobalState();
  
  const executeWithRetry = async (
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> => {
    const operationId = `${id}_retry_${retryCount}`;
    const operationDescription = retryCount > 0 
      ? `${description} (intento ${retryCount + 1}/${maxRetries + 1})`
      : description;
    
    try {
      return await actions.loading.withTimeout(operationId, operationDescription, operation);
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
        console.warn(`⚠️ Operation failed, retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(operation, retryCount + 1);
      }
      
      throw error;
    }
  };
  
  return { executeWithRetry };
};