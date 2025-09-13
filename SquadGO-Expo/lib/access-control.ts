import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { analyticsManager } from './analytics';

// Tipos para el sistema de control de acceso
export interface AccessLevel {
  level: 'restricted' | 'basic' | 'full';
  canAccessMatch: boolean;
  canSendMessages: boolean;
  canCreateTournaments: boolean;
  canAccessPremiumFeatures: boolean;
}

export interface UserCountStats {
  totalUsers: number;
  serverUsers: number;
  targetReached: boolean;
  accessLevel: AccessLevel;
  countdown: number;
}

export interface ServerConfig {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
  isActive: boolean;
  createdAt: Date;
}

// Configuración de niveles de acceso
const ACCESS_LEVELS: Record<string, AccessLevel> = {
  restricted: {
    level: 'restricted',
    canAccessMatch: false,
    canSendMessages: false,
    canCreateTournaments: false,
    canAccessPremiumFeatures: false
  },
  basic: {
    level: 'basic',
    canAccessMatch: true,
    canSendMessages: false,
    canCreateTournaments: true,
    canAccessPremiumFeatures: false
  },
  full: {
    level: 'full',
    canAccessMatch: true,
    canSendMessages: true,
    canCreateTournaments: true,
    canAccessPremiumFeatures: true
  }
};

// Constantes de configuración
const THRESHOLDS = {
  SERVER_USERS_FOR_MATCH: 100,
  TOTAL_USERS_FOR_BASIC: 500,
  TOTAL_USERS_FOR_FULL: 1000,
  COUNTDOWN_START: 1000
};

class AccessControlManager {
  private userCountCache: UserCountStats | null = null;
  private listeners: ((stats: UserCountStats) => void)[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initializeRealTimeListener();
  }

  // Inicializar listener en tiempo real para conteo de usuarios
  private initializeRealTimeListener() {
    try {
      const statsRef = doc(db, 'app_stats', 'user_count');
      this.unsubscribe = onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Validar que data existe y es un objeto
          if (!data || typeof data !== 'object') {
            console.warn('⚠️ Invalid data structure in user count stats');
            return;
          }
          
          // Validar y sanitizar propiedades numéricas
          const totalUsers = typeof data.totalUsers === 'number' ? data.totalUsers : 0;
          const serverUsers = typeof data.serverUsers === 'number' ? data.serverUsers : 0;
          const targetReached = typeof data.targetReached === 'boolean' ? data.targetReached : false;
          
          this.userCountCache = {
            totalUsers,
            serverUsers,
            targetReached,
            accessLevel: this.calculateAccessLevel(totalUsers, serverUsers),
            countdown: Math.max(0, THRESHOLDS.COUNTDOWN_START - totalUsers)
          };
          this.notifyListeners();
        }
      });
    } catch (error) {
      console.error('Error initializing real-time listener:', error);
    }
  }

  // Calcular nivel de acceso basado en conteo de usuarios
  private calculateAccessLevel(totalUsers: number, serverUsers: number): AccessLevel {
    // Acceso completo: 1000 usuarios totales
    if (totalUsers >= THRESHOLDS.TOTAL_USERS_FOR_FULL) {
      return ACCESS_LEVELS.full;
    }
    
    // Acceso básico: 500 usuarios totales O 100 usuarios en servidor
    if (totalUsers >= THRESHOLDS.TOTAL_USERS_FOR_BASIC || serverUsers >= THRESHOLDS.SERVER_USERS_FOR_MATCH) {
      return ACCESS_LEVELS.basic;
    }
    
    // Acceso restringido
    return ACCESS_LEVELS.restricted;
  }

  // Obtener estadísticas actuales de usuarios
  async getUserCountStats(): Promise<UserCountStats> {
    if (this.userCountCache) {
      return this.userCountCache;
    }

    try {
      const { safeGetDoc, handleFirestoreError } = await import('./firestore-utils');
      const statsRef = doc(db, 'app_stats', 'user_count');
      const statsDoc = await safeGetDoc(statsRef, 'access control stats');
      
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        // Validar que data existe y es un objeto
        if (!data || typeof data !== 'object') {
          console.warn('⚠️ Invalid data structure in user count stats');
          throw new Error('Invalid user count data structure');
        }
        
        // Validar y sanitizar propiedades numéricas
        const totalUsers = typeof data.totalUsers === 'number' ? data.totalUsers : 0;
        const serverUsers = typeof data.serverUsers === 'number' ? data.serverUsers : 0;
        const targetReached = typeof data.targetReached === 'boolean' ? data.targetReached : false;
        
        const stats: UserCountStats = {
          totalUsers,
          serverUsers,
          targetReached,
          accessLevel: this.calculateAccessLevel(totalUsers, serverUsers),
          countdown: Math.max(0, THRESHOLDS.COUNTDOWN_START - totalUsers)
        };
        this.userCountCache = stats;
        return stats;
      } else {
        // Inicializar estadísticas si no existen
        const initialStats: UserCountStats = {
          totalUsers: 0,
          serverUsers: 0,
          targetReached: false,
          accessLevel: ACCESS_LEVELS.restricted,
          countdown: THRESHOLDS.COUNTDOWN_START
        };
        await this.updateUserCountStats(initialStats);
        return initialStats;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('ERR_ABORTED') && !errorMessage.includes('offline')) {
        console.error('Error getting user count stats:', error);
      }
      return {
        totalUsers: 0,
        serverUsers: 0,
        targetReached: false,
        accessLevel: ACCESS_LEVELS.restricted,
        countdown: THRESHOLDS.COUNTDOWN_START
      };
    }
  }

  // Actualizar estadísticas de usuarios
  async updateUserCountStats(stats: Partial<UserCountStats>): Promise<void> {
    try {
      const { safeSetDoc, handleFirestoreError } = await import('./firestore-utils');
      const statsRef = doc(db, 'app_stats', 'user_count');
      
      const updateData = {
        ...stats,
        lastUpdated: new Date(),
        accessLevel: stats.totalUsers ? this.calculateAccessLevel(stats.totalUsers, stats.serverUsers || 0) : ACCESS_LEVELS.restricted
      };
      
      await safeSetDoc(statsRef, updateData, { merge: true }, 'access control stats update');
      
      // Registrar evento de analytics
      analyticsManager.trackEvent('user_count_updated', {
        totalUsers: stats.totalUsers,
        serverUsers: stats.serverUsers,
        accessLevel: stats.accessLevel?.level
      });
    } catch (error) {
      try {
        const { handleFirestoreError } = await import('./firestore-utils');
        const errorMessage = handleFirestoreError(error, 'updateUserCountStats');
        if (!errorMessage.includes('ERR_ABORTED') && !errorMessage.includes('offline')) {
          console.error('Error updating user count stats:', errorMessage);
        }
      } catch (importError) {
        console.error('Error updating user count stats:', error);
      }
      // No lanzar el error para evitar interrumpir la aplicación
      return;
    }
  }

  // Incrementar contador de usuarios
  async incrementUserCount(serverId?: string): Promise<UserCountStats> {
    try {
      const currentStats = await this.getUserCountStats();
      const newTotalUsers = currentStats.totalUsers + 1;
      const newServerUsers = serverId ? currentStats.serverUsers + 1 : currentStats.serverUsers;
      
      const updatedStats: UserCountStats = {
        totalUsers: newTotalUsers,
        serverUsers: newServerUsers,
        targetReached: newTotalUsers >= THRESHOLDS.TOTAL_USERS_FOR_BASIC,
        accessLevel: this.calculateAccessLevel(newTotalUsers, newServerUsers),
        countdown: Math.max(0, THRESHOLDS.COUNTDOWN_START - newTotalUsers)
      };
      
      await this.updateUserCountStats(updatedStats);
      
      // Verificar si se alcanzó un hito importante
      await this.checkMilestones(newTotalUsers, newServerUsers);
      
      return updatedStats;
    } catch (error) {
      console.error('Error incrementing user count:', error);
      throw error;
    }
  }

  // Verificar si el usuario puede acceder a una función específica
  async canAccessFeature(feature: keyof AccessLevel): Promise<boolean> {
    try {
      const stats = await this.getUserCountStats();
      return stats.accessLevel[feature] as boolean;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  // Verificar hitos y enviar notificaciones
  private async checkMilestones(totalUsers: number, serverUsers: number): Promise<void> {
    try {
      // Hito: Acceso básico desbloqueado
      if (totalUsers === THRESHOLDS.TOTAL_USERS_FOR_BASIC) {
        analyticsManager.trackEvent('milestone_basic_access_unlocked', {
          totalUsers,
          serverUsers
        });
      }
      
      // Hito: Acceso completo desbloqueado
      if (totalUsers === THRESHOLDS.TOTAL_USERS_FOR_FULL) {
        analyticsManager.trackEvent('milestone_full_access_unlocked', {
          totalUsers,
          serverUsers
        });
      }
      
      // Hito: Servidor alcanza 100 usuarios
      if (serverUsers === THRESHOLDS.SERVER_USERS_FOR_MATCH) {
        analyticsManager.trackEvent('milestone_server_match_unlocked', {
          totalUsers,
          serverUsers
        });
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }

  // Suscribirse a cambios en las estadísticas
  subscribe(callback: (stats: UserCountStats) => void): () => void {
    this.listeners.push(callback);
    
    // Enviar estadísticas actuales inmediatamente
    if (this.userCountCache) {
      callback(this.userCountCache);
    }
    
    // Retornar función para cancelar suscripción
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notificar a todos los listeners
  private notifyListeners(): void {
    if (this.userCountCache) {
      this.listeners.forEach(callback => {
        try {
          callback(this.userCountCache!);
        } catch (error) {
          console.error('Error in access control listener:', error);
        }
      });
    }
  }

  // Limpiar recursos
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
    this.userCountCache = null;
  }

  // Obtener información de progreso para UI
  getProgressInfo(): {
    basicProgress: number;
    fullProgress: number;
    nextMilestone: string;
    usersNeeded: number;
  } {
    const stats = this.userCountCache || {
      totalUsers: 0,
      serverUsers: 0,
      targetReached: false,
      accessLevel: ACCESS_LEVELS.restricted,
      countdown: THRESHOLDS.COUNTDOWN_START
    };
    
    const basicProgress = Math.min(100, (stats.totalUsers / THRESHOLDS.TOTAL_USERS_FOR_BASIC) * 100);
    const fullProgress = Math.min(100, (stats.totalUsers / THRESHOLDS.TOTAL_USERS_FOR_FULL) * 100);
    
    let nextMilestone = '';
    let usersNeeded = 0;
    
    if (stats.totalUsers < THRESHOLDS.TOTAL_USERS_FOR_BASIC) {
      nextMilestone = 'Acceso Básico (Match + Torneos)';
      usersNeeded = THRESHOLDS.TOTAL_USERS_FOR_BASIC - stats.totalUsers;
    } else if (stats.totalUsers < THRESHOLDS.TOTAL_USERS_FOR_FULL) {
      nextMilestone = 'Acceso Completo (Mensajes + Premium)';
      usersNeeded = THRESHOLDS.TOTAL_USERS_FOR_FULL - stats.totalUsers;
    } else {
      nextMilestone = '¡Todas las funciones desbloqueadas!';
      usersNeeded = 0;
    }
    
    return {
      basicProgress,
      fullProgress,
      nextMilestone,
      usersNeeded
    };
  }
}

// Instancia singleton del manager
export const accessControlManager = new AccessControlManager();

// Funciones de utilidad exportadas
export const canAccessMatch = () => accessControlManager.canAccessFeature('canAccessMatch');
export const canSendMessages = () => accessControlManager.canAccessFeature('canSendMessages');
export const canCreateTournaments = () => accessControlManager.canAccessFeature('canCreateTournaments');
export const canAccessPremiumFeatures = () => accessControlManager.canAccessFeature('canAccessPremiumFeatures');
export const getUserStats = () => accessControlManager.getUserCountStats();
export const incrementUsers = (serverId?: string) => accessControlManager.incrementUserCount(serverId);
export const getProgressInfo = () => accessControlManager.getProgressInfo();

// Hook para React
export const useAccessControl = () => {
  const [stats, setStats] = React.useState<UserCountStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const unsubscribe = accessControlManager.subscribe((newStats) => {
      setStats(newStats);
      setLoading(false);
    });
    
    // Cargar estadísticas iniciales
    accessControlManager.getUserCountStats().then((initialStats) => {
      setStats(initialStats);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    stats,
    loading,
    canAccessMatch: stats?.accessLevel.canAccessMatch || false,
    canSendMessages: stats?.accessLevel.canSendMessages || false,
    canCreateTournaments: stats?.accessLevel.canCreateTournaments || false,
    canAccessPremiumFeatures: stats?.accessLevel.canAccessPremiumFeatures || false,
    progressInfo: accessControlManager.getProgressInfo()
  };
};

// Importar React para el hook
import * as React from 'react';