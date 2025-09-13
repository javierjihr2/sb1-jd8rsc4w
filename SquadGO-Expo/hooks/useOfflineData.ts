import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineSync } from '../lib/offlineSync';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, limit, where, DocumentData } from 'firebase/firestore';

interface OfflineDataOptions {
  collectionName: string;
  cacheKey: string;
  queryConstraints?: any[];
  enableRealtime?: boolean;
  maxCacheAge?: number; // en milisegundos
  syncOnMount?: boolean;
}

interface OfflineDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  lastUpdated: number | null;
  pendingSync: boolean;
}

export const useOfflineData = <T extends DocumentData>(
  options: OfflineDataOptions
): OfflineDataState<T> & {
  refresh: () => Promise<void>;
  addItem: (item: Omit<T, 'id'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<T>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearCache: () => Promise<void>;
} => {
  const {
    collectionName,
    cacheKey,
    queryConstraints = [],
    enableRealtime = true,
    maxCacheAge = 24 * 60 * 60 * 1000, // 24 horas por defecto
    syncOnMount = true
  } = options;

  const [state, setState] = useState<OfflineDataState<T>>({
    data: [],
    loading: true,
    error: null,
    isOffline: false,
    lastUpdated: null,
    pendingSync: false
  });

  const { addOfflineAction, getSyncStatus, subscribe } = useOfflineSync();

  // Cargar datos del caché local
  const loadFromCache = useCallback(async (): Promise<T[]> => {
    try {
      const cachedData = await AsyncStorage.getItem(`cache_${cacheKey}`);
      const cacheTimestamp = await AsyncStorage.getItem(`cache_timestamp_${cacheKey}`);
      
      if (cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        const age = Date.now() - timestamp;
        
        if (age < maxCacheAge) {
          console.log(`📦 Datos cargados del caché para ${cacheKey}`);
          return JSON.parse(cachedData);
        } else {
          console.log(`⏰ Caché expirado para ${cacheKey}, limpiando...`);
          await AsyncStorage.removeItem(`cache_${cacheKey}`);
          await AsyncStorage.removeItem(`cache_timestamp_${cacheKey}`);
        }
      }
    } catch (error) {
      console.error('Error cargando del caché:', error);
    }
    
    return [];
  }, [cacheKey, maxCacheAge]);

  // Guardar datos en caché local
  const saveToCache = useCallback(async (data: T[]) => {
    try {
      await AsyncStorage.setItem(`cache_${cacheKey}`, JSON.stringify(data));
      await AsyncStorage.setItem(`cache_timestamp_${cacheKey}`, Date.now().toString());
      console.log(`💾 Datos guardados en caché para ${cacheKey}`);
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  }, [cacheKey]);

  // Cargar datos desde Firebase
  const loadFromFirebase = useCallback(async (): Promise<T[]> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as unknown as T[];
            
            resolve(data);
            unsubscribe();
          },
          (error) => {
            reject(error);
            unsubscribe();
          }
        );
      });
    } catch (error) {
      console.error('Error cargando desde Firebase:', error);
      throw error;
    }
  }, [collectionName, queryConstraints]);

  // Configurar listener en tiempo real
  const setupRealtimeListener = useCallback(() => {
    if (!enableRealtime) return () => {};

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as unknown as T[];
        
        setState(prev => ({
          ...prev,
          data,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }));
        
        // Guardar en caché
        saveToCache(data);
      },
      (error) => {
        console.error('Error en listener tiempo real:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      }
    );

    return unsubscribe;
  }, [collectionName, enableRealtime, saveToCache]); // Removido queryConstraints de dependencias

  // Refrescar datos
  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Intentar cargar desde Firebase
      const firebaseData = await loadFromFirebase();
      
      setState(prev => ({
        ...prev,
        data: firebaseData,
        loading: false,
        lastUpdated: Date.now()
      }));
      
      // Guardar en caché
      await saveToCache(firebaseData);
      
    } catch (error) {
      console.error('Error refrescando datos:', error);
      
      // Si falla, cargar del caché
      const cachedData = await loadFromCache();
      
      setState(prev => ({
        ...prev,
        data: cachedData,
        loading: false,
        error: 'Sin conexión, mostrando datos en caché',
        isOffline: true
      }));
    }
  }, [loadFromFirebase, loadFromCache, saveToCache]);

  // Agregar nuevo elemento
  const addItem = useCallback(async (item: Omit<T, 'id'>): Promise<string> => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = { id: tempId, ...item } as unknown as T;
    
    // Agregar optimísticamente a la UI
    setState(prev => ({
      ...prev,
      data: [newItem, ...prev.data]
    }));
    
    try {
      // Intentar agregar a Firebase o cola offline
      const actionId = await addOfflineAction('create', collectionName, item);
      
      // Actualizar caché local
      const updatedData = [newItem, ...state.data];
      await saveToCache(updatedData);
      
      return actionId;
    } catch (error) {
      // Revertir cambio optimista en caso de error
      setState(prev => ({
        ...prev,
        data: prev.data.filter(d => d.id !== tempId),
        error: 'Error agregando elemento'
      }));
      throw error;
    }
  }, [addOfflineAction, collectionName, saveToCache, state.data]);

  // Actualizar elemento
  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    // Actualización optimista
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    
    try {
      await addOfflineAction('update', collectionName, updates, id);
      
      // Actualizar caché
      const updatedData = state.data.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      await saveToCache(updatedData);
      
    } catch (error) {
      // Revertir en caso de error
      await refresh();
      throw error;
    }
  }, [addOfflineAction, collectionName, saveToCache, state.data, refresh]);

  // Eliminar elemento
  const deleteItem = useCallback(async (id: string) => {
    // Eliminación optimista
    const originalData = state.data;
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id)
    }));
    
    try {
      await addOfflineAction('delete', collectionName, {}, id);
      
      // Actualizar caché
      const updatedData = state.data.filter(item => item.id !== id);
      await saveToCache(updatedData);
      
    } catch (error) {
      // Revertir en caso de error
      setState(prev => ({ ...prev, data: originalData }));
      throw error;
    }
  }, [addOfflineAction, collectionName, saveToCache, state.data]);

  // Limpiar caché
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(`cache_${cacheKey}`);
      await AsyncStorage.removeItem(`cache_timestamp_${cacheKey}`);
      console.log(`🗑️ Caché limpiado para ${cacheKey}`);
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }, [cacheKey]);

  // Efectos
  useEffect(() => {
    let unsubscribeRealtime: (() => void) | undefined;
    let unsubscribeSync: (() => void) | undefined;
    let isMounted = true;

    const initialize = async () => {
      try {
        // Cargar datos del caché primero
        const cachedData = await loadFromCache();
        if (cachedData.length > 0 && isMounted) {
          setState(prev => ({
            ...prev,
            data: cachedData,
            loading: false,
            lastUpdated: Date.now()
          }));
        }

        // Suscribirse a cambios de estado de sincronización
        unsubscribeSync = subscribe((syncStatus) => {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              isOffline: !syncStatus.isOnline,
              pendingSync: syncStatus.syncInProgress
            }));
          }
        });

        // Configurar listener en tiempo real si hay conexión
        if (syncOnMount && isMounted) {
          try {
            unsubscribeRealtime = setupRealtimeListener();
          } catch (error) {
            console.log('Sin conexión, usando datos en caché');
            if (isMounted) {
              setState(prev => ({
                ...prev,
                loading: false,
                isOffline: true
              }));
            }
          }
        } else if (isMounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error en inicialización:', error);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Error al cargar datos'
          }));
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      unsubscribeRealtime?.();
      unsubscribeSync?.();
    };
  }, []); // Dependencias vacías para evitar re-ejecuciones

  return {
    ...state,
    refresh,
    addItem,
    updateItem,
    deleteItem,
    clearCache
  };
};