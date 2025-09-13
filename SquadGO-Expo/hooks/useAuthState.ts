import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { PlayerProfile } from '../lib/types';
import { validateUserData } from '../lib/data-validation';

export interface AuthState {
  user: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastSyncTime: Date | null;
}

export interface AuthStateActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: PlayerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: AuthState['connectionStatus']) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  updateLastSync: () => void;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  error: null,
  isInitialized: false,
  connectionStatus: 'connected',
  lastSyncTime: null
};

export const useAuthState = () => {
  const [state, setState] = useState<AuthState>(initialState);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  // Función para actualizar el estado de forma segura
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Acciones del estado
  const actions: AuthStateActions = {
    setUser: useCallback((user: User | null) => {
      updateState({ user, lastSyncTime: new Date() });
    }, [updateState]),

    setProfile: useCallback((profile: PlayerProfile | null) => {
      // Validar perfil antes de establecerlo
      if (profile) {
        const validatedProfile = validateUserData(profile);
        if (validatedProfile.isValid && validatedProfile.sanitizedData) {
          updateState({ profile: validatedProfile.sanitizedData, lastSyncTime: new Date() });
        }
      } else {
        updateState({ profile: null });
      }
    }, [updateState]),

    setLoading: useCallback((loading: boolean) => {
      updateState({ loading });
    }, [updateState]),

    setError: useCallback((error: string | null) => {
      updateState({ error });
      if (error) {
        console.error('🔴 Auth State Error:', error);
      }
    }, [updateState]),

    setConnectionStatus: useCallback((connectionStatus: AuthState['connectionStatus']) => {
      updateState({ connectionStatus });
      
      if (connectionStatus === 'reconnecting') {
        console.log('🔄 Auth reconnecting...');
      } else if (connectionStatus === 'connected') {
        console.log('✅ Auth connected');
        setRetryCount(0);
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          setRetryTimeout(null);
        }
      } else {
        console.warn('⚠️ Auth disconnected');
      }
    }, [updateState, retryTimeout]),

    clearError: useCallback(() => {
      updateState({ error: null });
    }, [updateState]),

    retry: useCallback(async () => {
      if (retryCount >= 3) {
        console.warn('⚠️ Max retry attempts reached');
        return;
      }

      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      updateState({ 
        connectionStatus: 'reconnecting',
        error: null 
      });

      // Implementar backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000);
      
      const timeout = setTimeout(async () => {
        try {
          // Aquí se podría implementar lógica de reconexión específica
          console.log(`🔄 Retry attempt ${newRetryCount} after ${delay}ms`);
          
          // Simular reconexión exitosa por ahora
          updateState({ connectionStatus: 'connected' });
        } catch (error) {
          console.error('❌ Retry failed:', error);
          updateState({ 
            connectionStatus: 'disconnected',
            error: `Retry ${newRetryCount} failed: ${error}` 
          });
        }
      }, delay);

      setRetryTimeout(timeout);
    }, [retryCount, updateState]),

    updateLastSync: useCallback(() => {
      updateState({ lastSyncTime: new Date() });
    }, [updateState])
  };

  // Marcar como inicializado cuando se complete la primera carga
  useEffect(() => {
    if (!state.loading && !state.isInitialized) {
      updateState({ isInitialized: true });
      console.log('✅ Auth state initialized');
    }
  }, [state.loading, state.isInitialized, updateState]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  // Función para obtener información de diagnóstico
  const getDiagnosticInfo = useCallback(() => {
    return {
      hasUser: !!state.user,
      hasProfile: !!state.profile,
      isLoading: state.loading,
      hasError: !!state.error,
      isInitialized: state.isInitialized,
      connectionStatus: state.connectionStatus,
      retryCount,
      lastSyncTime: state.lastSyncTime,
      timeSinceLastSync: state.lastSyncTime 
        ? Date.now() - state.lastSyncTime.getTime() 
        : null
    };
  }, [state, retryCount]);

  return {
    state,
    actions,
    getDiagnosticInfo
  };
};

// Hook para usar solo el estado (sin acciones)
export const useAuthStateValue = () => {
  const { state } = useAuthState();
  return state;
};

// Hook para verificar si el usuario está completamente autenticado
export const useIsAuthenticated = () => {
  const { state } = useAuthState();
  return {
    isAuthenticated: !!(state.user && state.profile && state.isInitialized),
    isLoading: state.loading,
    hasError: !!state.error
  };
};