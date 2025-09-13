// Sistema de reintentos automáticos para operaciones fallidas
// Firebase imports removed - not used in this file

// Tipos para el sistema de reintentos
interface RetryOperation {
  id: string;
  type: 'profile_update' | 'post_create' | 'message_send' | 'tournament_register';
  data: any;
  userId: string;
  attempts: number;
  maxAttempts: number;
  lastAttempt: string;
  nextRetry: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'retrying' | 'failed' | 'completed';
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // en milisegundos
  maxDelay: number;
  backoffMultiplier: number;
}

// Configuraciones por tipo de operación
const retryConfigs: Record<string, RetryConfig> = {
  profile_update: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },
  post_create: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 1.5
  },
  message_send: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  tournament_register: {
    maxAttempts: 3,
    baseDelay: 3000,
    maxDelay: 60000,
    backoffMultiplier: 2
  }
};

// Cola de operaciones pendientes
class RetryQueue {
  private operations = new Map<string, RetryOperation>();
  private isProcessing = false;
  private processingInterval: number | null = null;

  constructor() {
    this.loadFromStorage();
    this.startProcessing();
  }

  // Agregar operación a la cola
  add(operation: Omit<RetryOperation, 'id' | 'attempts' | 'lastAttempt' | 'nextRetry' | 'status'>) {
    const id = `${operation.type}_${operation.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = retryConfigs[operation.type];
    
    const retryOperation: RetryOperation = {
      ...operation,
      id,
      attempts: 0,
      lastAttempt: new Date().toISOString(),
      nextRetry: new Date(Date.now() + config.baseDelay).toISOString(),
      status: 'pending'
    };

    this.operations.set(id, retryOperation);
    this.saveToStorage();
    
    console.log(`🔄 Retry: Operación agregada a la cola: ${operation.type} para usuario ${operation.userId}`);
    return id;
  }

  // Remover operación de la cola
  remove(operationId: string) {
    if (this.operations.has(operationId)) {
      this.operations.delete(operationId);
      this.saveToStorage();
      console.log(`✅ Retry: Operación removida de la cola: ${operationId}`);
    }
  }

  // Marcar operación como completada
  markCompleted(operationId: string) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'completed';
      this.operations.set(operationId, operation);
      this.saveToStorage();
      
      // Remover después de un tiempo para mantener historial
      setTimeout(() => this.remove(operationId), 60000);
      console.log(`✅ Retry: Operación completada: ${operationId}`);
    }
  }

  // Marcar operación como fallida permanentemente
  markFailed(operationId: string) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'failed';
      this.operations.set(operationId, operation);
      this.saveToStorage();
      console.error(`❌ Retry: Operación fallida permanentemente: ${operationId}`);
    }
  }

  // Obtener operaciones pendientes
  getPendingOperations(): RetryOperation[] {
    const now = new Date();
    return Array.from(this.operations.values())
      .filter(op => 
        (op.status === 'pending' || op.status === 'retrying') && 
        new Date(op.nextRetry) <= now &&
        op.attempts < op.maxAttempts
      )
      .sort((a, b) => {
        // Priorizar por: prioridad, luego por tiempo de próximo reintento
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.nextRetry).getTime() - new Date(b.nextRetry).getTime();
      });
  }

  // Calcular próximo tiempo de reintento con backoff exponencial
  private calculateNextRetry(operation: RetryOperation): string {
    const config = retryConfigs[operation.type];
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, operation.attempts),
      config.maxDelay
    );
    
    // Agregar jitter para evitar thundering herd
    const jitter = Math.random() * 0.3 * delay;
    const finalDelay = delay + jitter;
    
    return new Date(Date.now() + finalDelay).toISOString();
  }

  // Procesar operaciones pendientes
  private async processOperations() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const pendingOps = this.getPendingOperations();
    
    if (pendingOps.length === 0) {
      this.isProcessing = false;
      return;
    }

    console.log(`🔄 Retry: Procesando ${pendingOps.length} operaciones pendientes`);

    for (const operation of pendingOps.slice(0, 5)) { // Procesar máximo 5 a la vez
      try {
        operation.status = 'retrying';
        operation.attempts++;
        operation.lastAttempt = new Date().toISOString();
        
        console.log(`🔄 Retry: Intentando operación ${operation.type} (intento ${operation.attempts}/${operation.maxAttempts})`);
        
        const success = await this.executeOperation(operation);
        
        if (success) {
          this.markCompleted(operation.id);
        } else {
          if (operation.attempts >= operation.maxAttempts) {
            this.markFailed(operation.id);
          } else {
            operation.nextRetry = this.calculateNextRetry(operation);
            operation.status = 'pending';
            this.operations.set(operation.id, operation);
          }
        }
      } catch (error) {
        console.error(`❌ Retry: Error procesando operación ${operation.id}:`, error);
        
        if (operation.attempts >= operation.maxAttempts) {
          this.markFailed(operation.id);
        } else {
          operation.nextRetry = this.calculateNextRetry(operation);
          operation.status = 'pending';
          this.operations.set(operation.id, operation);
        }
      }
    }

    this.saveToStorage();
    this.isProcessing = false;
  }

  // Ejecutar operación específica
  private async executeOperation(operation: RetryOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'profile_update':
          return await this.retryProfileUpdate(operation);
        case 'post_create':
          return await this.retryPostCreate(operation);
        case 'message_send':
          return await this.retryMessageSend(operation);
        case 'tournament_register':
          return await this.retryTournamentRegister(operation);
        default:
          console.error(`❌ Retry: Tipo de operación desconocido: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Retry: Error ejecutando ${operation.type}:`, error);
      return false;
    }
  }

  // Reintentar actualización de perfil
  private async retryProfileUpdate(operation: RetryOperation): Promise<boolean> {     
    const { updateUserProfile } = await import('./database');
    const result = await updateUserProfile(operation.userId, operation.data);
    return result.success;
  }

  // Reintentar creación de post
  private async retryPostCreate(operation: RetryOperation): Promise<boolean> {
    const { createFeedPost } = await import('./database');
    const result = await createFeedPost(operation.data);
    return result.success;
  }

  // Reintentar envío de mensaje
  private async retryMessageSend(operation: RetryOperation): Promise<boolean> {
    const { sendMessage } = await import('./database');
    const result = await sendMessage(operation.data.chatId, operation.userId, operation.data.message);
    return result.success;
  }

  // Reintentar registro en torneo
  private async retryTournamentRegister(operation: RetryOperation): Promise<boolean> {
    const { registerForTournament } = await import('./tournament-system');
    const result = await registerForTournament(operation.data.tournamentId, operation.userId, operation.data.teamData);
    return result.success;
  }

  // Guardar en localStorage
  private saveToStorage() {
    if (typeof window === 'undefined') return; // Solo en el cliente
    try {
      const data = Array.from(this.operations.entries());
      localStorage.setItem('retryQueue', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Retry: Error guardando cola en localStorage:', error);
    }
  }

  // Cargar desde localStorage
  private loadFromStorage() {
    if (typeof window === 'undefined') return; // Solo en el cliente
    try {
      const data = localStorage.getItem('retryQueue');
      if (data) {
        const entries = JSON.parse(data);
        this.operations = new Map(entries);
        console.log(`🔄 Retry: Cargadas ${this.operations.size} operaciones desde localStorage`);
      }
    } catch (error) {
      console.error('❌ Retry: Error cargando cola desde localStorage:', error);
    }
  }

  // Iniciar procesamiento automático
  private startProcessing() {
    // Procesar cada 10 segundos
    this.processingInterval = setInterval(() => {
      this.processOperations();
    }, 10000) as unknown as number;

    // Procesar inmediatamente
    setTimeout(() => this.processOperations(), 1000);
  }

  // Detener procesamiento
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Obtener estadísticas
  getStats() {
    const operations = Array.from(this.operations.values());
    return {
      total: operations.length,
      pending: operations.filter(op => op.status === 'pending').length,
      retrying: operations.filter(op => op.status === 'retrying').length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length
    };
  }
}

// Instancia global de la cola de reintentos
export const retryQueue = new RetryQueue();

// Funciones de utilidad para agregar operaciones
export const addRetryOperation = {
  profileUpdate: (userId: string, data: any, priority: 'high' | 'medium' | 'low' = 'high') => {
    return retryQueue.add({
      type: 'profile_update',
      data,
      userId,
      maxAttempts: retryConfigs.profile_update.maxAttempts,
      priority
    });
  },
  
  postCreate: (userId: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
    return retryQueue.add({
      type: 'post_create',
      data,
      userId,
      maxAttempts: retryConfigs.post_create.maxAttempts,
      priority
    });
  },
  
  messageSend: (userId: string, data: any, priority: 'high' | 'medium' | 'low' = 'high') => {
    return retryQueue.add({
      type: 'message_send',
      data,
      userId,
      maxAttempts: retryConfigs.message_send.maxAttempts,
      priority
    });
  },
  
  tournamentRegister: (userId: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
    return retryQueue.add({
      type: 'tournament_register',
      data,
      userId,
      maxAttempts: retryConfigs.tournament_register.maxAttempts,
      priority
    });
  }
};

// Función para obtener estadísticas de reintentos
export const getRetryStats = () => retryQueue.getStats();

// Función para limpiar operaciones completadas/fallidas antiguas
export const cleanupRetryQueue = () => {
  const operations = Array.from(retryQueue['operations'].values());
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
  
  operations.forEach(op => {
    if ((op.status === 'completed' || op.status === 'failed') && 
        new Date(op.lastAttempt) < cutoff) {
      retryQueue.remove(op.id);
    }
  });
};

// Limpiar automáticamente cada hora
setInterval(cleanupRetryQueue, 60 * 60 * 1000);