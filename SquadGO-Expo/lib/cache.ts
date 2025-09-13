import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración del cache
interface CacheConfig {
  maxSize: number; // Tamaño máximo en MB
  defaultTTL: number; // TTL por defecto en milisegundos
  cleanupInterval: number; // Intervalo de limpieza en milisegundos
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number; // Tamaño estimado en bytes
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
}

class CacheManager {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheItem<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalSize: 0,
  };
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50, // 50MB por defecto
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      ...config,
    };

    this.startCleanupTimer();
  }

  // Calcular tamaño estimado de un objeto
  private estimateSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback para objetos que no se pueden serializar
      return 1024; // 1KB por defecto
    }
  }

  // Generar clave de cache
  private generateKey(prefix: string, key: string): string {
    return `cache_${prefix}_${key}`;
  }

  // Verificar si un item ha expirado
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Limpiar items expirados
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
        this.stats.totalSize -= item.size;
      }
    }

    expiredKeys.forEach(key => this.memoryCache.delete(key));

    // Limpiar AsyncStorage también
    this.cleanupAsyncStorage();
  }

  // Limpiar AsyncStorage de items expirados
  private async cleanupAsyncStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const item = await this.getFromAsyncStorage(key);
        if (item && this.isExpired(item)) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning AsyncStorage cache:', error);
    }
  }

  // Iniciar timer de limpieza
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Obtener item de AsyncStorage
  private async getFromAsyncStorage<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  // Guardar item en AsyncStorage
  private async saveToAsyncStorage<T>(key: string, item: CacheItem<T>): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
    }
  }

  // Liberar espacio si es necesario
  private freeSpace(requiredSize: number): void {
    if (this.stats.totalSize + requiredSize <= this.config.maxSize * 1024 * 1024) {
      return;
    }

    // Ordenar por timestamp (LRU)
    const sortedEntries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Eliminar items más antiguos hasta liberar espacio suficiente
    for (const [key, item] of sortedEntries) {
      this.memoryCache.delete(key);
      this.stats.totalSize -= item.size;
      
      if (this.stats.totalSize + requiredSize <= this.config.maxSize * 1024 * 1024) {
        break;
      }
    }
  }

  // Obtener item del cache
  async get<T>(prefix: string, key: string): Promise<T | null> {
    const cacheKey = this.generateKey(prefix, key);
    
    // Buscar en memoria primero
    let item = this.memoryCache.get(cacheKey);
    
    // Si no está en memoria, buscar en AsyncStorage
    if (!item) {
      item = await this.getFromAsyncStorage<T>(cacheKey);
      if (item && !this.isExpired(item)) {
        // Restaurar a memoria si no ha expirado
        this.memoryCache.set(cacheKey, item);
        this.stats.totalSize += item.size;
      }
    }

    if (!item || this.isExpired(item)) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  // Guardar item en el cache
  async set<T>(
    prefix: string, 
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL
  ): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);
    const size = this.estimateSize(data);
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      size,
    };

    // Liberar espacio si es necesario
    this.freeSpace(size);

    // Guardar en memoria
    this.memoryCache.set(cacheKey, item);
    this.stats.totalSize += size;

    // Guardar en AsyncStorage para persistencia
    await this.saveToAsyncStorage(cacheKey, item);
  }

  // Eliminar item del cache
  async delete(prefix: string, key: string): Promise<void> {
    const cacheKey = this.generateKey(prefix, key);
    
    const item = this.memoryCache.get(cacheKey);
    if (item) {
      this.memoryCache.delete(cacheKey);
      this.stats.totalSize -= item.size;
    }

    await AsyncStorage.removeItem(cacheKey);
  }

  // Limpiar todo el cache
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      // Limpiar solo items con el prefijo específico
      const keysToDelete: string[] = [];
      
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(`cache_${prefix}_`)) {
          const item = this.memoryCache.get(key);
          if (item) {
            this.stats.totalSize -= item.size;
          }
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.memoryCache.delete(key));
      
      // Limpiar AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const prefixKeys = allKeys.filter(key => key.startsWith(`cache_${prefix}_`));
      await AsyncStorage.multiRemove(prefixKeys);
    } else {
      // Limpiar todo
      this.memoryCache.clear();
      this.stats.totalSize = 0;
      
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }

  // Obtener estadísticas del cache
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      totalSize: this.stats.totalSize,
      itemCount: this.memoryCache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
    };
  }

  // Destruir el cache manager
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.memoryCache.clear();
  }
}

// Instancia global del cache manager
export const cacheManager = new CacheManager();

// Hooks y utilidades para usar el cache
export function useCache<T>(
  prefix: string,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Intentar obtener del cache primero
        let cachedData = await cacheManager.get<T>(prefix, key);
        
        if (cachedData && mounted) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Si no hay datos en cache, obtener de la fuente
        const freshData = await fetcher();
        
        if (mounted) {
          setData(freshData);
          // Guardar en cache
          await cacheManager.set(prefix, key, freshData, ttl);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [prefix, key, fetcher, ttl]);

  const refetch = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const freshData = await fetcher();
      setData(freshData);
      await cacheManager.set(prefix, key, freshData, ttl);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [prefix, key, fetcher, ttl]);

  const invalidate = React.useCallback(async () => {
    await cacheManager.delete(prefix, key);
  }, [prefix, key]);

  return { data, loading, error, refetch, invalidate };
}

// Utilidades específicas para diferentes tipos de datos
export const CacheUtils = {
  // Cache para perfiles de usuario
  userProfile: {
    get: (userId: string) => cacheManager.get('user_profile', userId),
    set: (userId: string, profile: any) => 
      cacheManager.set('user_profile', userId, profile, 15 * 60 * 1000), // 15 min
    delete: (userId: string) => cacheManager.delete('user_profile', userId),
  },

  // Cache para posts del feed
  feedPosts: {
    get: (page: number) => cacheManager.get('feed_posts', page.toString()),
    set: (page: number, posts: any[]) => 
      cacheManager.set('feed_posts', page.toString(), posts, 5 * 60 * 1000), // 5 min
    clear: () => cacheManager.clear('feed_posts'),
  },

  // Cache para torneos
  tournaments: {
    get: (tournamentId: string) => cacheManager.get('tournament', tournamentId),
    set: (tournamentId: string, tournament: any) => 
      cacheManager.set('tournament', tournamentId, tournament, 10 * 60 * 1000), // 10 min
    delete: (tournamentId: string) => cacheManager.delete('tournament', tournamentId),
  },

  // Cache para configuraciones
  settings: {
    get: (key: string) => cacheManager.get('settings', key),
    set: (key: string, value: any) => 
      cacheManager.set('settings', key, value, 60 * 60 * 1000), // 1 hora
    delete: (key: string) => cacheManager.delete('settings', key),
  },
};

// Importar React para los hooks
import React from 'react';