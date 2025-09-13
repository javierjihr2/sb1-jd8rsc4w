// Sistema de persistencia ultra-robusto para garantizar que los datos nunca se pierdan
import type { PlayerProfile } from './types';
import { 
  sanitizeData, 
  verifyDataIntegrity, 
  repairCorruptedData,
  generateDataHash
} from './data-validator';

// Configuración del sistema de persistencia
const PERSISTENCE_CONFIG = {
  maxBackups: 10,
  autoSaveInterval: 5000, // 5 segundos
  validationInterval: 30000, // 30 segundos
  recoveryAttempts: 3,
  storageKeys: {
    primary: 'profile_primary',
    backup: 'profile_backup',
    emergency: 'profile_emergency',
    session: 'profile_session',
    history: 'profile_history'
  }
};

// Interface para el historial de cambios
interface ProfileHistory {
  timestamp: number;
  profile: PlayerProfile;
  sessionId: string;
  changeType: 'create' | 'update' | 'sync' | 'recovery';
  checksum: string;
}

// Clase principal del sistema de persistencia
export class UltraPersistence {
  private userId: string;
  private sessionId: string;
  private autoSaveTimer: number | null = null;
  private validationTimer: number | null = null;
  private isInitialized = false;

  constructor(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(data: any): string {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }

  private getStorageKey(type: keyof typeof PERSISTENCE_CONFIG.storageKeys): string {
    return `${PERSISTENCE_CONFIG.storageKeys[type]}_${this.userId}`;
  }

  // Inicializar el sistema de persistencia
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Verificar integridad de datos existentes
      await this.validateAndRecoverData();
      
      // Iniciar auto-guardado
      this.startAutoSave();
      
      // Iniciar validación periódica
      this.startPeriodicValidation();
      
      // Escuchar eventos de cierre de ventana
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      window.addEventListener('unload', this.handleUnload.bind(this));
      
      // Escuchar cambios de visibilidad
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      this.isInitialized = true;
      console.log('🛡️ UltraPersistence: Sistema inicializado para usuario', this.userId);
    } catch (error) {
      console.error('❌ Error inicializando UltraPersistence:', error);
    }
  }

  // Guardar perfil con múltiples capas de respaldo
  async saveProfile(profile: PlayerProfile): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Validar y sanitizar datos antes de guardar
      let processedProfile = sanitizeData(profile, 'profile');
      
      const integrityReport = await verifyDataIntegrity(
        profile?.id || 'unknown', 
        processedProfile, 
        'profile'
      );
      
      if (!integrityReport.isValid) {
        console.warn('🔧 Reparando perfil corrupto automáticamente...');
        processedProfile = repairCorruptedData(processedProfile, 'profile');
      } else if (integrityReport.correctedData) {
        processedProfile = integrityReport.correctedData;
      }
      
      const timestamp = Date.now();
      const profileWithMeta = {
        ...processedProfile,
        lastModified: timestamp,
        sessionId: this.sessionId,
        checksum: this.generateChecksum(processedProfile),
        dataHash: generateDataHash(processedProfile)
      };

      // Capa 1: localStorage principal
      localStorage.setItem(this.getStorageKey('primary'), JSON.stringify(profileWithMeta));
      
      // Capa 2: localStorage backup
      localStorage.setItem(this.getStorageKey('backup'), JSON.stringify(profileWithMeta));
      
      // Capa 3: sessionStorage
      sessionStorage.setItem(this.getStorageKey('session'), JSON.stringify(profileWithMeta));
      
      // Capa 4: Historial de cambios
      await this.saveToHistory(profile, 'update');
      
      // Capa 5: IndexedDB (si está disponible)
      await this.saveToIndexedDB(profileWithMeta);
      
      // Verificar que se guardó correctamente
      const verification = this.verifyDataIntegrity(profileWithMeta);
      if (!verification.isValid) {
        throw new Error('Fallo en verificación de integridad');
      }

      console.log('💾 UltraPersistence: Perfil guardado en todas las capas');
      return true;
    } catch (error) {
      console.error('❌ Error guardando perfil:', error);
      // Intentar guardado de emergencia
      return this.emergencySave(profile);
    }
  }

  // Cargar perfil con recuperación automática
  async loadProfile(): Promise<PlayerProfile | null> {
    if (typeof window === 'undefined') return null;

    try {
      // Intentar cargar desde fuentes en orden de prioridad
      const sources = [
        () => this.loadFromStorage('primary'),
        () => this.loadFromStorage('backup'),
        () => this.loadFromStorage('session'),
        () => this.loadFromIndexedDB(),
        () => this.loadFromHistory()
      ];

      for (const loadSource of sources) {
        try {
          let profile = await loadSource();
          if (profile && this.validateProfile(profile)) {
            // Validar integridad de datos cargados
            const integrityReport = await verifyDataIntegrity(
              profile?.id || 'unknown',
              profile,
              'profile'
            );
            
            if (!integrityReport.isValid) {
              console.warn('🔧 Perfil corrupto detectado, reparando...');
              profile = repairCorruptedData(profile, 'profile');
            } else if (integrityReport.correctedData) {
              console.log('✅ Perfil corregido automáticamente');
              profile = integrityReport.correctedData;
            }
            
            // Verificar hash de integridad si existe
            if (profile && (profile as any).dataHash) {
              const currentHash = generateDataHash(profile);
              if (currentHash !== (profile as any).dataHash) {
                console.warn('⚠️ Hash de integridad no coincide, posible corrupción');
              }
            }
            
            if (profile) {
              console.log('✅ UltraPersistence: Perfil cargado exitosamente');
              // Restaurar en todas las capas si falta
              await this.saveProfile(profile);
              return profile;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando desde una fuente:', error);
        }
      }

      console.warn('⚠️ No se pudo cargar el perfil desde ninguna fuente');
      return null;
    } catch (error) {
      console.error('❌ Error crítico cargando perfil:', error);
      return null;
    }
  }

  // Guardar en historial
  private async saveToHistory(profile: PlayerProfile, changeType: ProfileHistory['changeType']): Promise<void> {
    try {
      const historyKey = `${this.getStorageKey('history')}_list`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]') as ProfileHistory[];
      
      const historyEntry: ProfileHistory = {
        timestamp: Date.now(),
        profile,
        sessionId: this.sessionId,
        changeType,
        checksum: this.generateChecksum(profile)
      };

      existingHistory.unshift(historyEntry);
      
      // Mantener solo los últimos N backups
      if (existingHistory.length > PERSISTENCE_CONFIG.maxBackups) {
        existingHistory.splice(PERSISTENCE_CONFIG.maxBackups);
      }

      localStorage.setItem(historyKey, JSON.stringify(existingHistory));
    } catch (error) {
      console.warn('⚠️ Error guardando en historial:', error);
    }
  }

  // Cargar desde historial
  private async loadFromHistory(): Promise<PlayerProfile | null> {
    try {
      const historyKey = `${this.getStorageKey('history')}_list`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as ProfileHistory[];
      
      if (history.length > 0) {
        const latestEntry = history[0];
        if (this.validateProfile(latestEntry.profile)) {
          console.log('🔄 UltraPersistence: Perfil recuperado desde historial');
          return latestEntry.profile;
        }
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Error cargando desde historial:', error);
      return null;
    }
  }

  // Guardar en IndexedDB
  private async saveToIndexedDB(profile: any): Promise<void> {
    if (!('indexedDB' in window)) return;

    try {
      const dbName = `squadup_profiles_${this.userId}`;
      const request = indexedDB.open(dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        store.put({ id: 'current', ...profile });
      };
    } catch (error) {
      console.warn('⚠️ Error guardando en IndexedDB:', error);
    }
  }

  // Cargar desde IndexedDB
  private async loadFromIndexedDB(): Promise<PlayerProfile | null> {
    if (!('indexedDB' in window)) return null;

    return new Promise((resolve) => {
      try {
        const dbName = `squadup_profiles_${this.userId}`;
        const request = indexedDB.open(dbName, 1);
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['profiles'], 'readonly');
          const store = transaction.objectStore('profiles');
          const getRequest = store.get('current');
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result && this.validateProfile(result)) {
              console.log('🔄 UltraPersistence: Perfil recuperado desde IndexedDB');
              resolve(result);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      } catch (error) {
        console.warn('⚠️ Error cargando desde IndexedDB:', error);
        resolve(null);
      }
    });
  }

  // Cargar desde storage específico
  private loadFromStorage(type: keyof typeof PERSISTENCE_CONFIG.storageKeys): PlayerProfile | null {
    try {
      const storage = type === 'session' ? sessionStorage : localStorage;
      const data = storage.getItem(this.getStorageKey(type));
      if (data) {
        const parsed = JSON.parse(data);
        if (this.validateProfile(parsed)) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ Error cargando desde ${type}:`, error);
      return null;
    }
  }

  // Validar perfil
  private validateProfile(profile: any): boolean {
    return profile && 
           typeof profile === 'object' && 
           profile.id && 
           profile.name && 
           typeof profile.lastModified === 'number';
  }

  // Verificar integridad de datos
  private verifyDataIntegrity(profile: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Verificar que se guardó en localStorage principal
      const primary = localStorage.getItem(this.getStorageKey('primary'));
      if (!primary) errors.push('Falta en localStorage principal');
      
      // Verificar que se guardó en backup
      const backup = localStorage.getItem(this.getStorageKey('backup'));
      if (!backup) errors.push('Falta en localStorage backup');
      
      // Verificar checksum
      if (profile.checksum !== this.generateChecksum(profile)) {
        errors.push('Checksum no coincide');
      }
      
      return { isValid: errors.length === 0, errors };
    } catch (error) {
      return { isValid: false, errors: ['Error en verificación'] };
    }
  }

  // Guardado de emergencia
  private emergencySave(profile: PlayerProfile): boolean {
    try {
      const emergencyKey = this.getStorageKey('emergency');
      const emergencyData = {
        ...profile,
        emergencySave: true,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };
      
      localStorage.setItem(emergencyKey, JSON.stringify(emergencyData));
      console.log('🚨 UltraPersistence: Guardado de emergencia realizado');
      return true;
    } catch (error) {
      console.error('💥 Error crítico en guardado de emergencia:', error);
      return false;
    }
  }

  // Validar y recuperar datos
  private async validateAndRecoverData(): Promise<void> {
    try {
      const profile = await this.loadProfile();
      if (profile) {
        // Asegurar que esté en todas las capas
        await this.saveProfile(profile);
      }
    } catch (error) {
      console.warn('⚠️ Error en validación inicial:', error);
    }
  }

  // Auto-guardado
  private startAutoSave(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    
    this.autoSaveTimer = setInterval(async () => {
      try {
        const currentProfile = await this.loadProfile();
        if (currentProfile) {
          await this.saveProfile(currentProfile);
        }
      } catch (error) {
        console.warn('⚠️ Error en auto-guardado:', error);
      }
    }, PERSISTENCE_CONFIG.autoSaveInterval) as unknown as number;
  }

  // Validación periódica
  private startPeriodicValidation(): void {
    if (this.validationTimer) clearInterval(this.validationTimer);
    
    this.validationTimer = setInterval(async () => {
      await this.validateAndRecoverData();
    }, PERSISTENCE_CONFIG.validationInterval) as unknown as number;
  }

  // Manejar cierre de ventana
  private handleBeforeUnload(): void {
    try {
      // Guardado final antes de cerrar
      const profile = this.loadFromStorage('primary');
      if (profile) {
        this.emergencySave(profile);
      }
    } catch (error) {
      console.warn('⚠️ Error en beforeunload:', error);
    }
  }

  // Manejar descarga
  private handleUnload(): void {
    this.cleanup();
  }

  // Manejar cambio de visibilidad
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Página oculta - guardar estado
      this.handleBeforeUnload();
    } else {
      // Página visible - validar datos
      this.validateAndRecoverData();
    }
  }

  // Limpiar recursos
  cleanup(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      window.removeEventListener('unload', this.handleUnload);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  // Obtener estadísticas del sistema
  getStats(): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const stats = {
        userId: this.userId,
        sessionId: this.sessionId,
        isInitialized: this.isInitialized,
        storageStatus: {
          primary: !!localStorage.getItem(this.getStorageKey('primary')),
          backup: !!localStorage.getItem(this.getStorageKey('backup')),
          session: !!sessionStorage.getItem(this.getStorageKey('session')),
          emergency: !!localStorage.getItem(this.getStorageKey('emergency'))
        },
        historyCount: JSON.parse(localStorage.getItem(`${this.getStorageKey('history')}_list`) || '[]').length
      };
      
      return stats;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Instancia global del sistema de persistencia
let globalPersistence: UltraPersistence | null = null;

// Función para inicializar el sistema
export const initializeUltraPersistence = (userId: string): UltraPersistence => {
  if (globalPersistence) {
    globalPersistence.cleanup();
  }
  
  globalPersistence = new UltraPersistence(userId);
  return globalPersistence;
};

// Función para obtener la instancia actual
export const getUltraPersistence = (): UltraPersistence | null => {
  return globalPersistence;
};

// Función para limpiar el sistema
export const cleanupUltraPersistence = (): void => {
  if (globalPersistence) {
    globalPersistence.cleanup();
    globalPersistence = null;
  }
};