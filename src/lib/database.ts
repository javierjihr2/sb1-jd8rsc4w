import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Query,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type {
  PlayerProfile,
  Tournament,
  Chat,
  Message,
  NewsArticle,
  Service,
  Match,
  Comment,
  FeedPost,
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  AdminWithdrawal
} from './types';
import { validateUserProfile, validateFeedPost, validateChatMessage } from './validation';
import { addRetryOperation } from './retry-system';

// Wrapper simplificado para operaciones de Firestore en modo offline
const firestoreOperation = async (operation: any, operationName = 'Firestore operation') => {
  try {
    // Ejecutar operación directamente en modo offline
    const result = await operation();
    return result;
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Error desconocido';
    
    // Solo logear errores que no sean relacionados con conexión
    if (!errorMessage.includes('ERR_ABORTED') && !errorMessage.includes('offline')) {
      console.warn(`⚠️ Error en ${operationName}:`, errorMessage);
    }
    
    // Para operaciones offline, devolver datos por defecto o relanzar error
    if (errorMessage.includes('offline') || errorMessage.includes('ERR_ABORTED')) {
      console.log(`📱 Operación ${operationName} ejecutada en modo offline`);
      // Relanzar para que cada función maneje su caso offline específico
      throw error;
    }
  }
};


// Utility function for retrying failed operations with ERR_ABORTED handling
const retryOperation = async (operation: any, maxRetries = 5, delay = 1000) => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Agregar timeout para evitar conexiones colgadas
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 15000); // 15 segundos timeout
      });
      
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || lastError.toString();
      
      // Detectar errores ERR_ABORTED y de conexión
      const isConnectionError = errorMessage.includes('ERR_ABORTED') || 
                               errorMessage.includes('network') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('unavailable');
      
      console.warn(`Operación falló (intento ${attempt}/${maxRetries}):`, {
        error: errorMessage,
        isConnectionError,
        attempt
      });
      
      // No reintentar en el último intento
      if (attempt === maxRetries) {
        break;
      }
      
      // Usar backoff exponencial para errores de conexión
      const backoffDelay = isConnectionError ? 
        Math.min(delay * Math.pow(2, attempt - 1), 10000) : // Max 10 segundos para errores de conexión
        delay * attempt;
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError!;
};

// ============ MATCHES/PARTIDAS ============
export const createMatch = async (matchData: Omit<Match, 'id'>) => {
  try {
    const result = await firestoreOperation(async () => {
      const matchRef = await addDoc(collection(db, 'matches'), {
        ...matchData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: matchRef.id };
    }, 'createMatch');
    return result;
  } catch (error) {
    console.error('Error creating match:', error);
    return { success: false, error };
  }
};

export const getMatches = async (userId?: string, limitCount = 20) => {
  try {
    return await firestoreOperation(async () => {
      let q = query(
        collection(db, 'matches'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (userId) {
        q = query(
          collection(db, 'matches'),
          where('user1Id', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
    }, 'getMatches');
  } catch (error) {
    console.error('Error getting matches:', error);
    return [];
  }
};

export const updateMatch = async (matchId: string, updates: Partial<Match>) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating match:', error);
    return { success: false, error };
  }
};

export const deleteMatch = async (matchId: string) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { success: false, error };
  }
};

// ============ USER STATISTICS & DATA ============
export const updateUserStats = async (userId: string, statsUpdate: Partial<PlayerProfile['stats']>) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: any = {};
    
    if (statsUpdate.wins !== undefined) {
      updates['stats.wins'] = increment(statsUpdate.wins);
    }
    if (statsUpdate.matches !== undefined) {
      updates['stats.matches'] = increment(statsUpdate.matches);
    }
    if (statsUpdate.kda !== undefined) {
      updates['stats.kda'] = statsUpdate.kda;
    }
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user stats:', error);
    return { success: false, error };
  }
};

export const getUserAchievements = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'user_achievements'),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
};

export const unlockAchievement = async (userId: string, achievementId: string) => {
  try {
    await addDoc(collection(db, 'user_achievements'), {
      userId,
      achievementId,
      unlockedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false, error };
  }
};

export const getUserActivity = async (userId: string, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'user_activity'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user activity:', error);
    return [];
  }
};

export const logUserActivity = async (userId: string, activity: {
  type: string;
  description: string;
  metadata?: any;
}) => {
  try {
    await addDoc(collection(db, 'user_activity'), {
      userId,
      ...activity,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging user activity:', error);
    return { success: false, error };
  }
};

// ============ USERS/PLAYERS ============
export const createUserProfile = async (userId: string, profileData: Partial<PlayerProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      id: userId,
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (userId: string): Promise<PlayerProfile | null> => {
  try {
    return await firestoreOperation(async () => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as PlayerProfile;
      }
      return null;
    }, 'getUserProfile');
  } catch (error) {
    // Manejar específicamente errores de modo offline sin mostrar error al usuario
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('ERR_ABORTED'))) {
      console.log('📱 Database: getUserProfile ejecutado en modo offline - devolviendo null');
      return null;
    }
    
    // Solo mostrar error para casos que no sean offline
    console.error('Error getting user profile after retries:', error);
    return null;
  }
};

// Sistema de sincronización en tiempo real
const pendingUpdates = new Map<string, any>();
const syncQueue = new Set<string>();

// Función para guardar cambios pendientes localmente con sistema de respaldo
const savePendingUpdate = (userId: string, updates: Partial<PlayerProfile>) => {
  const key = `pending_profile_${userId}`;
  const backupKey = `profile_backup_${userId}`;
  
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const merged = { 
      ...existing, 
      ...updates, 
      lastModified: Date.now(),
      syncStatus: 'pending',
      sessionId: Math.random().toString(36).substr(2, 9)
    };
    
    // Guardar en ambas ubicaciones para redundancia
    localStorage.setItem(key, JSON.stringify(merged));
    localStorage.setItem(backupKey, JSON.stringify(merged));
    pendingUpdates.set(userId, merged);
    
    console.log('💾 Datos guardados localmente:', { userId, updates: Object.keys(updates) });
    
    // Disparar evento para notificar a otros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profileDataSaved', {
        detail: { userId, updates, timestamp: Date.now() }
      }));
    }
  } catch (error) {
    console.error('❌ Error guardando datos localmente:', error);
    // Intentar guardar solo lo esencial si falla
    try {
      const essentialData = {
        userId,
        lastModified: Date.now(),
        syncStatus: 'error',
        errorDetails: error
      };
      localStorage.setItem(`error_log_${userId}`, JSON.stringify(essentialData));
    } catch (secondaryError) {
      console.error('❌ Error crítico guardando datos:', secondaryError);
    }
  }
};

// Función para recuperar datos desde localStorage con sistema de respaldo
const recoverPendingUpdates = (userId: string) => {
  const key = `pending_profile_${userId}`;
  const backupKey = `profile_backup_${userId}`;
  
  try {
    let data = localStorage.getItem(key);
    if (!data) {
      data = localStorage.getItem(backupKey);
      console.log('🔄 Recuperando desde backup:', backupKey);
    }
    
    if (data) {
      const parsed = JSON.parse(data);
      console.log('✅ Datos recuperados:', { userId, lastModified: parsed.lastModified });
      return parsed;
    }
  } catch (error) {
    console.error('❌ Error recuperando datos:', error);
    // Limpiar datos corruptos
    localStorage.removeItem(key);
    localStorage.removeItem(backupKey);
  }
  
  return null;
};

// Función para limpiar cambios pendientes
const clearPendingUpdate = (userId: string) => {
  const key = `pending_profile_${userId}`;
  localStorage.removeItem(key);
  pendingUpdates.delete(userId);
  syncQueue.delete(userId);
};

// Función para sincronizar cambios pendientes
const syncPendingUpdates = async () => {
  for (const userId of syncQueue) {
    const updates = pendingUpdates.get(userId);
    if (updates) {
      try {
        await updateUserProfileDirect(userId, updates);
        clearPendingUpdate(userId);
        console.log('✅ Sincronizado perfil pendiente para:', userId);
      } catch (error) {
        console.log('⏳ Reintentando sincronización más tarde para:', userId);
      }
    }
  }
};

// Sistema de sincronización mejorado con recuperación automática
const enhancedSyncPendingUpdates = async () => {
  // Solo ejecutar en el navegador
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    
    await syncPendingUpdates();
    
    // También verificar datos huérfanos que necesiten recuperación
    const allKeys = Object.keys(localStorage);
    const profileKeys = allKeys.filter(key => 
      key.startsWith('profile_') || 
      key.startsWith('pending_profile_') || 
      key === 'currentProfile'
    );
    
    // Asegurar integridad de datos en todas las claves de perfil
    for (const key of profileKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const profile = JSON.parse(data);
          if (profile.id && profile.needsSync) {
            syncQueue.add(profile.id);
          }
        }
      } catch (error) {
        console.warn(`Error verificando clave de perfil ${key}:`, error);
        // Remover datos corruptos
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error en sincronización mejorada:', error);
  }
};

// Sincronizar cada 30 segundos con recuperación mejorada
setInterval(enhancedSyncPendingUpdates, 30000);

// También sincronizar al cambiar visibilidad de página para recuperar sincronizaciones perdidas
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      enhancedSyncPendingUpdates();
    }
  });
}

// Función directa de actualización (sin manejo de errores de red)
const updateUserProfileDirect = async (userId: string, updates: Partial<PlayerProfile>) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: userId,
      ...updates,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<PlayerProfile>) => {
  let sanitizedUpdates: Partial<PlayerProfile> = updates;
  
  try {
    console.log('🔄 Database: Iniciando actualización de perfil para userId:', userId);
    console.log('📝 Database: Datos a actualizar:', updates);
    
    // Validar datos antes de procesar
    const validation = validateUserProfile(updates);
    if (!validation.isValid) {
      console.error('❌ Datos no válidos:', validation.errors);
      throw new Error(`Datos no válidos: ${validation.errors.join(', ')}`);
    }
    
    sanitizedUpdates = validation.sanitizedData as Partial<PlayerProfile>;
    console.log('✅ Datos validados y sanitizados:', sanitizedUpdates);
    
    // Guardar inmediatamente en localStorage como respaldo
    savePendingUpdate(userId, sanitizedUpdates);
    syncQueue.add(userId);
    
    const result = await firestoreOperation(async () => {
      await updateUserProfileDirect(userId, sanitizedUpdates);
      return { success: true };
    }, 'updateUserProfile');
    
    // Si la operación fue exitosa, limpiar cambios pendientes
    clearPendingUpdate(userId);
    console.log('✅ Database: Perfil actualizado exitosamente');
    return result;
  } catch (error) {
    console.error('❌ Database: Error updating user profile:', error);
    
    // Agregar a la cola de reintentos automáticos
    const retryId = addRetryOperation.profileUpdate(userId, sanitizedUpdates || updates, 'high');
    console.log(`🔄 Database: Operación agregada a cola de reintentos: ${retryId}`);
    
    // Los datos ya están guardados localmente, se sincronizarán automáticamente
    console.log('📱 Database: Datos guardados localmente, se sincronizarán automáticamente');
    
    // Proporcionar información más detallada del error
    let errorMessage = 'Datos guardados localmente, reintentando automáticamente...';
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Sin permisos para actualizar el perfil. Reintentando...';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de red. Datos guardados, reintentando automáticamente.';
      }
    }
    
    return { success: false, error: { message: errorMessage, originalError: error, retryId } };
  }
};

export const searchUsers = async (filters: {
  rank?: string;
  countryCode?: string;
  role?: string;
  limit?: number;
}) => {
  try {
    const usersCollection = collection(db, 'users');
    let q: Query<DocumentData> = usersCollection;
    
    if (filters.rank) {
      q = query(q, where('rank', '==', filters.rank));
    }
    if (filters.countryCode) {
      q = query(q, where('countryCode', '==', filters.countryCode));
    }
    if (filters.role) {
      q = query(q, where('role', '==', filters.role));
    }
    
    q = query(q, limit(filters.limit || 20));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlayerProfile));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// ============ TOURNAMENTS ============
export const createTournament = async (tournamentData: Omit<Tournament, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...tournamentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      registeredTeams: 0,
      isActive: true,
      views: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating tournament:', error);
    return { success: false, error };
  }
};

export const getTournaments = async (filters?: {
  status?: string;
  region?: string;
  mode?: string;
  creatorId?: string;
}, limitCount = 20) => {
  try {
    const tournamentsCollection = collection(db, 'tournaments');
    let q: Query<DocumentData> = tournamentsCollection;
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.region) {
      q = query(q, where('region', '==', filters.region));
    }
    if (filters?.mode) {
      q = query(q, where('mode', '==', filters.mode));
    }
    if (filters?.creatorId) {
      q = query(q, where('creatorId', '==', filters.creatorId));
    } else {
      q = query(q, where('isActive', '==', true));
    }
    
    q = query(q, orderBy('date', 'desc'), limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
  } catch (error) {
    console.error('Error getting tournaments:', error);
    return [];
  }
};

export const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    
    if (tournamentSnap.exists()) {
      // Incrementar vistas
      await updateDoc(tournamentRef, {
        views: increment(1)
      });
      
      return { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;
    }
    return null;
  } catch (error) {
    console.error('Error getting tournament:', error);
    return null;
  }
};

export const updateTournament = async (tournamentId: string, updates: Partial<Tournament>) => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating tournament:', error);
    return { success: false, error };
  }
};

export const deleteTournament = async (tournamentId: string) => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return { success: false, error };
  }
};

export const getTournamentRegistrations = async (tournamentId: string) => {
  try {
    const q = query(
      collection(db, 'tournament_registrations'),
      where('tournamentId', '==', tournamentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tournament registrations:', error);
    return [];
  }
};

export const getUserTournaments = async (userId: string, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'tournament_registrations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user tournaments:', error);
    return [];
  }
};

// ===== NUEVO MODELO DE TORNEOS =====

// Inscribir participante en torneo
export const joinTournament = async (tournamentId: string, participantData: {
  teamId?: string;
  userId: string;
  roster: string[];
  captainId: string;
}) => {
  try {
    const participantRef = await addDoc(
      collection(db, 'tournaments', tournamentId, 'participants'),
      {
        ...participantData,
        joinedAt: serverTimestamp()
      }
    );
    
    // Actualizar contador de participantes
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      participantsCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: participantRef.id };
  } catch (error) {
    console.error('Error joining tournament:', error);
    return { success: false, error };
  }
};

// Obtener participantes de un torneo
export const getTournamentParticipants = async (tournamentId: string) => {
  try {
    const q = query(
      collection(db, 'tournaments', tournamentId, 'participants'),
      orderBy('joinedAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tournament participants:', error);
    return [];
  }
};

// Crear match en torneo
export const createTournamentMatch = async (tournamentId: string, matchData: {
  round: number;
  seeds: number[];
  teamAId: string;
  teamBId: string;
  scheduledAt?: Date;
}) => {
  try {
    const matchRef = await addDoc(
      collection(db, 'tournaments', tournamentId, 'matches'),
      {
        ...matchData,
        scoreA: 0,
        scoreB: 0,
        winnerId: null,
        status: 'scheduled',
        createdAt: serverTimestamp()
      }
    );
    
    return { success: true, id: matchRef.id };
  } catch (error) {
    console.error('Error creating tournament match:', error);
    return { success: false, error };
  }
};

// Actualizar resultado de match
export const updateMatchResult = async (tournamentId: string, matchId: string, result: {
  scoreA: number;
  scoreB: number;
  winnerId: string;
  status: 'completed' | 'in-progress' | 'cancelled';
}) => {
  try {
    const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId);
    await updateDoc(matchRef, {
      ...result,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating match result:', error);
    return { success: false, error };
  }
};

// Obtener matches de un torneo
export const getTournamentMatches = async (tournamentId: string) => {
  try {
    const q = query(
      collection(db, 'tournaments', tournamentId, 'matches'),
      orderBy('round', 'asc'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tournament matches:', error);
    return [];
  }
};

// ===== SISTEMA DE MATCHMAKING =====

// Crear ticket de matchmaking
export const createMatchTicket = async (ticketData: {
  userId: string;
  mode: string;
  teamSize: number;
  region: string;
  rankTier: string;
  language: string;
  mic: boolean;
  roles: string[];
  preferences?: Record<string, any>;
}) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora
    
    const docRef = await addDoc(collection(db, 'matchTickets'), {
      ...ticketData,
      status: 'searching',
      createdAt: serverTimestamp(),
      expiresAt: expiresAt
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating match ticket:', error);
    return { success: false, error };
  }
};

// Obtener tickets de matchmaking activos
export const getActiveMatchTickets = async (filters?: {
  mode?: string;
  region?: string;
  rankTier?: string;
  teamSize?: number;
}) => {
  try {
    let q = query(
      collection(db, 'matchTickets'),
      where('status', '==', 'searching'),
      where('expiresAt', '>', new Date())
    );
    
    if (filters?.mode) {
      q = query(q, where('mode', '==', filters.mode));
    }
    if (filters?.region) {
      q = query(q, where('region', '==', filters.region));
    }
    if (filters?.rankTier) {
      q = query(q, where('rankTier', '==', filters.rankTier));
    }
    if (filters?.teamSize) {
      q = query(q, where('teamSize', '==', filters.teamSize));
    }
    
    q = query(q, orderBy('createdAt', 'asc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting active match tickets:', error);
    return [];
  }
};

// Actualizar estado del ticket
export const updateMatchTicketStatus = async (ticketId: string, status: 'searching' | 'matched' | 'expired' | 'cancelled') => {
  try {
    const ticketRef = doc(db, 'matchTickets', ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating match ticket status:', error);
    return { success: false, error };
  }
};

// Crear match cuando se encuentran jugadores compatibles
export const createMatchFromTickets = async (ticketIds: string[], matchData: {
  mode: string;
  region: string;
  leaderId: string;
}) => {
  try {
    // Obtener información de los tickets
    const ticketPromises = ticketIds.map(id => getDoc(doc(db, 'matchTickets', id)));
    const ticketDocs = await Promise.all(ticketPromises);
    
    const members = ticketDocs
      .filter(doc => doc.exists())
      .map(doc => doc.data()?.userId)
      .filter(Boolean);
    
    // Crear el match
    const matchRef = await addDoc(collection(db, 'matches'), {
      members,
      mode: matchData.mode,
      region: matchData.region,
      leaderId: matchData.leaderId,
      status: 'active',
      createdAt: serverTimestamp()
    });
    
    // Actualizar estado de los tickets a 'matched'
    const updatePromises = ticketIds.map(ticketId => 
      updateMatchTicketStatus(ticketId, 'matched')
    );
    await Promise.all(updatePromises);
    
    return { success: true, matchId: matchRef.id };
  } catch (error) {
    console.error('Error creating match from tickets:', error);
    return { success: false, error };
  }
};

// Obtener matches activos de un usuario
export const getUserActiveMatches = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('members', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user active matches:', error);
    return [];
  }
};

// Finalizar match
export const finishMatch = async (matchId: string) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error finishing match:', error);
    return { success: false, error };
  }
};

// ===== SISTEMA DE NOTIFICACIONES =====

// Crear notificación
export const createNotification = async (userId: string, notificationData: {
  type: string;
  data: Record<string, any>;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

// Obtener notificaciones de un usuario
export const getUserNotifications = async (userId: string, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

// ============ CHATS ============
export const createChat = async (participants: string[], chatName?: string) => {
  try {
    const chatData = {
      participants,
      name: chatName || '',
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTimestamp: null
    };
    
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { success: false, error };
  }
};

export const getUserChats = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

export const sendMessage = async (chatId: string, senderId: string, message: Omit<Message, 'timestamp'>) => {
  let sanitizedData: Partial<Message> | undefined;
  
  try {
    // Validar datos del mensaje
    const validation = validateChatMessage(message);
    if (!validation.isValid) {
      console.error('❌ Datos del mensaje no válidos:', validation.errors);
      throw new Error(`Datos del mensaje no válidos: ${validation.errors.join(', ')}`);
    }
    
    sanitizedData = validation.sanitizedData;
    
    if (!sanitizedData) {
      throw new Error('Error en la validación de datos del mensaje');
    }
    
    // Add message to messages subcollection
    const messageData = {
      ...message,
      content: sanitizedData.content,
      type: sanitizedData.type || message.type || 'text',
      senderId,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
    
    // Update chat with last message info
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: sanitizedData.content,
      lastMessageTimestamp: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Database: Error sending message:', error);
    
    // Agregar a la cola de reintentos automáticos
    const retryId = addRetryOperation.messageSend(senderId, {
      chatId,
      message: {
        ...message,
        content: sanitizedData?.content || message.content,
        type: sanitizedData?.type || message.type || 'text'
      }
    }, 'high');
    console.log(`🔄 Database: Mensaje agregado a cola de reintentos: ${retryId}`);
    
    return { success: false, error, retryId };
  }
};

// Reemplazado onSnapshot con polling manual para evitar ERR_ABORTED
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  return firestoreOperation(async () => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
  }, 'getChatMessages');
};

// Función de polling manual para mensajes de chat
export const pollChatMessages = (chatId: string, callback: (messages: Message[]) => void, intervalMs = 5000) => {
  const poll = async () => {
    try {
      const messages = await getChatMessages(chatId);
      callback(messages);
    } catch (error) {
      console.warn('Error polling chat messages:', error);
    }
  };
  
  poll(); // Llamada inicial
  const intervalId = setInterval(poll, intervalMs);
  
  // Retornar función de cleanup
  return () => clearInterval(intervalId);
};

// ============ NEWS ============
export const createNewsArticle = async (articleData: Omit<NewsArticle, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'news'), {
      ...articleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      comments: []
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating news article:', error);
    return { success: false, error };
  }
};

export const getNewsArticles = async (limitCount = 10, category?: string) => {
  try {
    let q = query(
      collection(db, 'news'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    if (category) {
      q = query(
        collection(db, 'news'),
        where('category', '==', category),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle));
  } catch (error) {
    console.error('Error getting news articles:', error);
    return [];
  }
};

export const getNewsArticle = async (articleId: string): Promise<NewsArticle | null> => {
  try {
    const articleRef = doc(db, 'news', articleId);
    const articleSnap = await getDoc(articleRef);
    
    if (articleSnap.exists()) {
      // Incrementar vistas
      await updateDoc(articleRef, {
        views: increment(1)
      });
      
      return { id: articleSnap.id, ...articleSnap.data() } as NewsArticle;
    }
    return null;
  } catch (error) {
    console.error('Error getting news article:', error);
    return null;
  }
};

export const updateNewsArticle = async (articleId: string, updates: Partial<NewsArticle>) => {
  try {
    const articleRef = doc(db, 'news', articleId);
    await updateDoc(articleRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating news article:', error);
    return { success: false, error };
  }
};

export const deleteNewsArticle = async (articleId: string) => {
  try {
    const articleRef = doc(db, 'news', articleId);
    await updateDoc(articleRef, {
      isDeleted: true,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting news article:', error);
    return { success: false, error };
  }
};

export const likeNewsArticle = async (articleId: string, userId: string) => {
  try {
    const articleRef = doc(db, 'news', articleId);
    await updateDoc(articleRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId)
    });
    return { success: true };
  } catch (error) {
    console.error('Error liking news article:', error);
    return { success: false, error };
  }
};

// ============ SERVICES ============
export const createService = async (serviceData: Omit<Service, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      views: 0,
      orders: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error };
  }
};

export const getServices = async (category?: string, creatorId?: string, limitCount = 20) => {
  try {
    const servicesCollection = collection(db, 'services');
    let q: Query<DocumentData> = servicesCollection;
    
    if (category && creatorId) {
      q = query(q, where('category', '==', category), where('creatorId', '==', creatorId));
    } else if (category) {
      q = query(q, where('category', '==', category), where('isActive', '==', true));
    } else if (creatorId) {
      q = query(q, where('creatorId', '==', creatorId));
    } else {
      q = query(q, where('isActive', '==', true));
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
};

export const getService = async (serviceId: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (serviceSnap.exists()) {
      // Incrementar vistas
      await updateDoc(serviceRef, {
        views: increment(1)
      });
      
      return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
    }
    return null;
  } catch (error) {
    console.error('Error getting service:', error);
    return null;
  }
};

export const updateService = async (serviceId: string, updates: Partial<Service>) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error };
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    return { success: false, error };
  }
};

export const orderService = async (serviceId: string, userId: string, orderData: any) => {
  try {
    // Crear orden
    const orderRef = await addDoc(collection(db, 'orders'), {
      serviceId,
      userId,
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Incrementar contador de órdenes del servicio
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      orders: increment(1)
    });
    
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    console.error('Error ordering service:', error);
    return { success: false, error };
  }
};

// ============ FEED POSTS ============
// ===== SISTEMA DE POSTS (NUEVO MODELO) =====

// Crear post según el nuevo modelo de datos
export const createPost = async (postData: {
  authorId: string;
  text: string;
  media?: string[];
  visibility?: 'public' | 'friends' | 'private';
  tags?: string[];
}) => {
  try {
    return await firestoreOperation(async () => {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        visibility: postData.visibility || 'public',
        likeCount: 0,
        commentCount: 0,
        tags: postData.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    }, 'createPost');
  } catch (error: any) {
    console.error('❌ Database: Error creating post:', error);
    return { success: false, error };
  }
};

// Obtener posts
export const getPosts = async (limitCount = 20) => {
  try {
    return await firestoreOperation(async () => {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, 'getPosts');
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

// Obtener posts de un usuario
export const getUserPosts = async (userId: string, limitCount = 20) => {
  try {
    return await firestoreOperation(async () => {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, 'getUserPosts');
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

// Dar like a un post
export const likePost = async (postId: string, userId: string) => {
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const postRef = doc(db, 'posts', postId);
    
    await setDoc(likeRef, {});
    await updateDoc(postRef, {
      likeCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
};

// Quitar like de un post
export const unlikePost = async (postId: string, userId: string) => {
  try {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const postRef = doc(db, 'posts', postId);
    
    await deleteDoc(likeRef);
    await updateDoc(postRef, {
      likeCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { success: false, error };
  }
};

// Crear comentario
export const createComment = async (postId: string, commentData: {
  authorId: string;
  text: string;
  parentId?: string;
}) => {
  try {
    const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
      ...commentData,
      createdAt: serverTimestamp()
    });
    
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: commentRef.id };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { success: false, error };
  }
};

// Obtener comentarios de un post
export const getPostComments = async (postId: string) => {
  try {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Actualizar post
export const updatePost = async (postId: string, updates: {
  text?: string;
  media?: string[];
  visibility?: 'public' | 'friends' | 'private';
  tags?: string[];
}) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error };
  }
};

// Eliminar post
export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error };
  }
};

// ===== SISTEMA DE BOOKMARKS =====

// Agregar bookmark
export const addBookmark = async (userId: string, postId: string) => {
  try {
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', postId);
    await setDoc(bookmarkRef, {
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return { success: false, error };
  }
};

// Quitar bookmark
export const removeBookmark = async (userId: string, postId: string) => {
  try {
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', postId);
    await deleteDoc(bookmarkRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return { success: false, error };
  }
};

// Obtener bookmarks de un usuario
export const getUserBookmarks = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'bookmarks'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

// ===== FUNCIONES LEGACY (MANTENER PARA COMPATIBILIDAD) =====

export const createFeedPost = async (postData: Omit<FeedPost, 'id'>) => {
  try {
    // Validar datos del post
    const validation = validateFeedPost(postData);
    if (!validation.isValid) {
      console.error('❌ Datos del post no válidos:', validation.errors);
      throw new Error(`Datos del post no válidos: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedData = validation.sanitizedData;
    
    if (!sanitizedData) {
      throw new Error('Error en la validación de datos del post');
    }
    
    return await firestoreOperation(async () => {
      const docRef = await addDoc(collection(db, 'feedPosts'), {
        ...postData,
        content: sanitizedData.content,
        images: sanitizedData.images || postData.images || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        sharedBy: [],
        interactions: [],
        commentsList: []
      });
      return { success: true, id: docRef.id };
    }, 'createFeedPost');
  } catch (error: any) {
    console.error('❌ Database: Error creating feed post:', error);
    
    // Agregar a la cola de reintentos automáticos
    const retryId = addRetryOperation.postCreate(postData.author.id, {
      ...postData,
      content: postData.content,
      images: postData.images || []
    }, 'medium');
    console.log(`🔄 Database: Post agregado a cola de reintentos: ${retryId}`);
    
    // En modo offline, simular éxito con ID temporal
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, id: tempId, retryId };
  }
};

export const getFeedPosts = async (limitCount = 20) => {
  try {
    return await firestoreOperation(async () => {
      const q = query(
        collection(db, 'feedPosts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
    }, 'getFeedPosts');
  } catch (error) {
    console.error('Error getting feed posts after retries:', error);
    return [];
  }
};

export const getUserFeedPosts = async (userId: string, limitCount = 20) => {
  try {
    return await firestoreOperation(async () => {
      const q = query(
        collection(db, 'feedPosts'),
        where('author.id', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedPost));
    }, 'getUserFeedPosts');
  } catch (error) {
    console.error('Error getting user feed posts:', error);
    return [];
  }
};

// Reemplazado onSnapshot con polling manual para evitar ERR_ABORTED
export const pollFeedPosts = (callback: (posts: FeedPost[]) => void, limitCount = 20, intervalMs = 10000) => {
  const poll = async () => {
    try {
      const posts = await getFeedPosts(limitCount);
      callback(posts);
    } catch (error) {
      console.warn('Error polling feed posts:', error);
    }
  };
  
  poll(); // Llamada inicial
  const intervalId = setInterval(poll, intervalMs);
  
  // Retornar función de cleanup
  return () => clearInterval(intervalId);
};

export const pollUserPosts = (userId: string, callback: (posts: FeedPost[]) => void, limitCount = 20, intervalMs = 10000) => {
  const poll = async () => {
    try {
      const posts = await getUserPosts(userId, limitCount);
      callback(posts);
    } catch (error) {
      console.warn('Error polling user posts:', error);
    }
  };
  
  poll(); // Llamada inicial
  const intervalId = setInterval(poll, intervalMs);
  
  // Retornar función de cleanup
  return () => clearInterval(intervalId);
};

// Mantener funciones originales como deprecated para compatibilidad
// @deprecated Use pollFeedPosts instead to avoid ERR_ABORTED errors
export const subscribeToFeedPosts = (callback: (posts: FeedPost[]) => void, limitCount = 20) => {
  console.warn('subscribeToFeedPosts is deprecated. Use pollFeedPosts to avoid ERR_ABORTED errors.');
  return pollFeedPosts(callback, limitCount);
};

// @deprecated Use pollUserPosts instead to avoid ERR_ABORTED errors
export const subscribeToUserPosts = (userId: string, callback: (posts: FeedPost[]) => void, limitCount = 20) => {
  console.warn('subscribeToUserPosts is deprecated. Use pollUserPosts to avoid ERR_ABORTED errors.');
  return pollUserPosts(userId, callback, limitCount);
};

export const likeFeedPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const interaction = {
      userId,
      type: 'like',
      timestamp: new Date().toISOString()
    };
    
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
      interactions: arrayUnion(interaction),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
};

export const unlikeFeedPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const likedBy = postData.likedBy || [];
      const interactions = postData.interactions || [];
      
      const updatedLikedBy = likedBy.filter((id: string) => id !== userId);
      const updatedInteractions = interactions.filter((interaction: any) => 
        !(interaction.userId === userId && interaction.type === 'like')
      );
      
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: updatedLikedBy,
        interactions: updatedInteractions,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { success: false, error };
  }
};

export const shareFeedPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const interaction = {
      userId,
      type: 'share',
      timestamp: new Date().toISOString()
    };
    
    await updateDoc(postRef, {
      shares: increment(1),
      sharedBy: arrayUnion(userId),
      interactions: arrayUnion(interaction),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error sharing post:', error);
    return { success: false, error };
  }
};

export const addCommentToPost = async (postId: string, commentData: Omit<Comment, 'id' | 'postId' | 'likes' | 'likedBy' | 'timestamp' | 'createdAt'>) => {
  try {
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const comment: Comment = {
      id: commentId,
      postId,
      ...commentData,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };
    
    const postRef = doc(db, 'feedPosts', postId);
    const interaction = {
      userId: commentData.author.id,
      type: 'comment' as const,
      timestamp: new Date().toISOString(),
      data: { commentId }
    };
    
    await updateDoc(postRef, {
      comments: increment(1),
      commentsList: arrayUnion(comment),
      interactions: arrayUnion(interaction),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, commentId, comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
};

// Dar like a un comentario
export const likeComment = async (postId: string, commentId: string, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const commentsList = postData.commentsList || [];
      
      const updatedComments = commentsList.map((comment: Comment) => {
        if (comment.id === commentId) {
          const likedBy = comment.likedBy || [];
          if (!likedBy.includes(userId)) {
            return {
              ...comment,
              likes: (comment.likes || 0) + 1,
              likedBy: [...likedBy, userId]
            };
          }
        }
        return comment;
      });
      
      await updateDoc(postRef, {
        commentsList: updatedComments,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error liking comment:', error);
    return { success: false, error };
  }
};

// Quitar like de un comentario
export const unlikeComment = async (postId: string, commentId: string, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const commentsList = postData.commentsList || [];
      
      const updatedComments = commentsList.map((comment: Comment) => {
        if (comment.id === commentId) {
          const likedBy = comment.likedBy || [];
          if (likedBy.includes(userId)) {
            return {
              ...comment,
              likes: Math.max((comment.likes || 0) - 1, 0),
              likedBy: likedBy.filter((id: string) => id !== userId)
            };
          }
        }
        return comment;
      });
      
      await updateDoc(postRef, {
        commentsList: updatedComments,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unliking comment:', error);
    return { success: false, error };
  }
};

// Actualizar un comentario
export const updateComment = async (postId: string, commentId: string, updateData: { text: string }) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const commentsList = postData.commentsList || [];
      
      const updatedComments = commentsList.map((comment: Comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            text: updateData.text,
            updatedAt: new Date().toISOString()
          };
        }
        return comment;
      });
      
      await updateDoc(postRef, {
        commentsList: updatedComments,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error };
  }
};

// Eliminar un comentario
export const deleteComment = async (postId: string, commentId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const commentsList = postData.commentsList || [];
      
      const updatedComments = commentsList.filter((comment: Comment) => comment.id !== commentId);
      
      await updateDoc(postRef, {
        commentsList: updatedComments,
        comments: increment(-1),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error };
  }
};

// Votar en una encuesta
export const voteInPoll = async (postId: string, optionIndex: number, userId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const poll = postData.poll;
      
      if (poll && poll.options && poll.options[optionIndex]) {
        // Verificar si el usuario ya votó
        const hasVoted = poll.options.some((option: any) => 
          option.voters && option.voters.includes(userId)
        );
        
        if (!hasVoted) {
          const updatedOptions = poll.options.map((option: any, index: number) => {
            if (index === optionIndex) {
              return {
                ...option,
                votes: (option.votes || 0) + 1,
                voters: [...(option.voters || []), userId]
              };
            }
            return option;
          });
          
          await updateDoc(postRef, {
            'poll.options': updatedOptions,
            'poll.totalVotes': increment(1),
            updatedAt: serverTimestamp()
          });
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error voting in poll:', error);
    return { success: false, error };
  }
};

// Actualizar una publicación
export const updateFeedPost = async (postId: string, updateData: Partial<FeedPost>) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating feed post:', error);
    return { success: false, error };
  }
};

// Eliminar una publicación
export const deleteFeedPost = async (postId: string) => {
  try {
    const postRef = doc(db, 'feedPosts', postId);
    await deleteDoc(postRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting feed post:', error);
    return { success: false, error };
  }
};






















export const getAllSubscriptions = async () => {
  try {
    const subscriptionsCollection = collection(db, 'subscriptions');
    const q = query(subscriptionsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return [];
  }
};

// Get user subscription
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const subscriptionsCollection = collection(db, 'subscriptions');
    const q = query(
      subscriptionsCollection,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

// Retiros de administrador
export const createAdminWithdrawal = async (withdrawalData: Omit<AdminWithdrawal, 'id'>) => {
  try {
    const withdrawalsCollection = collection(db, 'adminWithdrawals');
    const docRef = await addDoc(withdrawalsCollection, {
      ...withdrawalData,
      requestedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating admin withdrawal:', error);
    return { success: false, error };
  }
};

export const getAdminWithdrawals = async () => {
  try {
    const withdrawalsCollection = collection(db, 'adminWithdrawals');
    const q = query(withdrawalsCollection, orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AdminWithdrawal[];
  } catch (error) {
    console.error('Error getting admin withdrawals:', error);
    return [];
  }
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: 'pending' | 'completed' | 'failed') => {
  try {
    const withdrawalRef = doc(db, 'adminWithdrawals', withdrawalId);
    const updateData: { [key: string]: any } = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }
    
    await updateDoc(withdrawalRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return { success: false, error };
  }
};

// Función para verificar si un usuario puede crear torneos ilimitados
export const canCreateUnlimitedTournaments = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    return subscription !== null && subscription.status === 'active';
  } catch (error) {
    console.error('Error checking tournament creation permissions:', error);
    return false;
  }
};

// Función para obtener estadísticas de ingresos para el admin
export const getSubscriptionRevenue = async () => {
  try {
    const subscriptionsCollection = collection(db, 'subscriptions');
    const q = query(
      subscriptionsCollection,
      where('grantedByAdmin', '!=', true) // Excluir suscripciones gratuitas
    );
    const snapshot = await getDocs(q);
    
    const totalRevenue = 0;
    const subscriptions = snapshot.docs.map(doc => doc.data() as Subscription);
    
    // Aquí necesitarías obtener los precios de los planes para calcular el ingreso total
    // Por simplicidad, asumimos un cálculo básico
    
    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      totalRevenue // Esto se calcularía con los precios reales de los planes
    };
  } catch (error) {
    console.error('Error getting subscription revenue:', error);
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      totalRevenue: 0
    };
  }
};

// Save payment method
export const savePaymentMethod = async (paymentMethodData: PaymentMethod): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const docRef = await addDoc(collection(db, 'paymentMethods'), {
      ...paymentMethodData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving payment method:', error);
    return { success: false, error: 'Failed to save payment method' };
  }
};

// Create subscription
export const createSubscription = async (subscriptionData: Omit<Subscription, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const docRef = await addDoc(collection(db, 'subscriptions'), {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
};

// Grant free subscription
export const grantFreeSubscription = async (userId: string, planId: string, duration: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const subscriptionData = {
      userId,
      planId,
      status: 'active' as const,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(), // duration in days
      paymentMethod: 'stripe' as const,
      isFreeTrial: true,
      grantedByAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await createSubscription(subscriptionData);
    return result;
  } catch (error) {
    console.error('Error granting free subscription:', error);
    return { success: false, error: 'Failed to grant free subscription' };
  }
};

// Update registration status
export const updateRegistrationStatus = async (tournamentId: string, registrationId: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, 'tournaments', tournamentId, 'registrations', registrationId), {
      status,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating registration status:', error);
    return { success: false, error: 'Failed to update registration status' };
  }
};