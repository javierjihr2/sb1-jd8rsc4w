import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { NotificationType, NotificationPayload, NotificationPriority } from './notification-service';
import { analyticsManager } from './analytics';
import { monitoringManager } from './monitoring';

// Configuración del servidor de notificaciones
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BATCH_SIZE = 100; // Expo permite hasta 100 notificaciones por batch
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Interfaces para el servidor
export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

export interface PushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: any;
}

export interface NotificationTarget {
  userId: string;
  expoPushToken: string;
  fcmToken?: string;
  deviceInfo?: {
    platform: string;
    version: string | number;
    isDevice: boolean;
  };
}

export interface BulkNotificationRequest {
  userIds?: string[];
  targetTokens?: string[];
  payload: NotificationPayload;
  scheduleAt?: Date;
  batchSize?: number;
}

export interface NotificationResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  tickets: PushTicket[];
  receipts?: PushReceipt[];
  errors: string[];
}

class NotificationServer {
  private pendingTickets: Map<string, string[]> = new Map(); // ticketId -> userIds
  private retryQueue: Array<{ payload: any; attempt: number; delay: number }> = [];
  private isProcessingRetries = false;

  // Enviar notificación a un usuario específico
  async sendToUser(userId: string, payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const targets = await this.getUserTargets([userId]);
      
      if (targets.length === 0) {
        return {
          success: false,
          totalSent: 0,
          totalFailed: 1,
          tickets: [],
          errors: [`No se encontraron tokens para el usuario ${userId}`]
        };
      }

      return await this.sendToTargets(targets, payload);
    } catch (error) {
      console.error('Error enviando notificación a usuario:', error);
      return {
        success: false,
        totalSent: 0,
        totalFailed: 1,
        tickets: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  // Enviar notificación a múltiples usuarios
  async sendToUsers(userIds: string[], payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const targets = await this.getUserTargets(userIds);
      
      if (targets.length === 0) {
        return {
          success: false,
          totalSent: 0,
          totalFailed: userIds.length,
          tickets: [],
          errors: ['No se encontraron tokens para ningún usuario']
        };
      }

      return await this.sendToTargets(targets, payload);
    } catch (error) {
      console.error('Error enviando notificaciones a usuarios:', error);
      return {
        success: false,
        totalSent: 0,
        totalFailed: userIds.length,
        tickets: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  // Enviar notificación masiva (bulk)
  async sendBulkNotification(request: BulkNotificationRequest): Promise<NotificationResult> {
    try {
      let targets: NotificationTarget[] = [];

      if (request.userIds) {
        targets = await this.getUserTargets(request.userIds);
      } else if (request.targetTokens) {
        targets = request.targetTokens.map(token => ({
          userId: 'unknown',
          expoPushToken: token
        }));
      }

      if (targets.length === 0) {
        return {
          success: false,
          totalSent: 0,
          totalFailed: request.userIds?.length || request.targetTokens?.length || 0,
          tickets: [],
          errors: ['No se encontraron targets válidos']
        };
      }

      // Si hay una fecha de programación, guardar para envío posterior
      if (request.scheduleAt && request.scheduleAt > new Date()) {
        await this.scheduleNotification(targets, request.payload, request.scheduleAt);
        return {
          success: true,
          totalSent: targets.length,
          totalFailed: 0,
          tickets: [],
          errors: []
        };
      }

      return await this.sendToTargets(targets, request.payload, request.batchSize);
    } catch (error) {
      console.error('Error enviando notificación masiva:', error);
      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        tickets: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  // Obtener targets de usuarios
  private async getUserTargets(userIds: string[]): Promise<NotificationTarget[]> {
    try {
      const targets: NotificationTarget[] = [];
      
      // Dividir en chunks para evitar límites de Firestore
      const chunks = this.chunkArray(userIds, 10);
      
      for (const chunk of chunks) {
        const usersQuery = query(
          collection(db, 'profiles'),
          where('__name__', 'in', chunk)
        );
        
        const snapshot = await getDocs(usersQuery);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.expoPushToken) {
            targets.push({
              userId: doc.id,
              expoPushToken: data.expoPushToken,
              fcmToken: data.fcmToken,
              deviceInfo: data.deviceInfo
            });
          }
        });
      }
      
      return targets;
    } catch (error) {
      console.error('Error obteniendo targets de usuarios:', error);
      return [];
    }
  }

  // Enviar a targets específicos
  private async sendToTargets(
    targets: NotificationTarget[],
    payload: NotificationPayload,
    batchSize: number = MAX_BATCH_SIZE
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      tickets: [],
      errors: []
    };

    try {
      // Dividir en batches
      const batches = this.chunkArray(targets, batchSize);
      
      for (const batch of batches) {
        const batchResult = await this.sendBatch(batch, payload);
        
        result.totalSent += batchResult.totalSent;
        result.totalFailed += batchResult.totalFailed;
        result.tickets.push(...batchResult.tickets);
        result.errors.push(...batchResult.errors);
        
        if (!batchResult.success) {
          result.success = false;
        }
      }

      // Registrar estadísticas
      analyticsManager.trackEvent('bulk_notification_sent', {
        total_targets: targets.length,
        total_sent: result.totalSent,
        total_failed: result.totalFailed,
        notification_type: payload.type,
        batches_count: batches.length
      });

      // Guardar en historial
      await this.saveNotificationHistory(targets, payload, result);

      return result;
    } catch (error) {
      console.error('Error enviando a targets:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
      return result;
    }
  }

  // Enviar un batch de notificaciones
  private async sendBatch(targets: NotificationTarget[], payload: NotificationPayload): Promise<NotificationResult> {
    const messages = targets.map(target => ({
      to: target.expoPushToken,
      title: payload.title,
      body: payload.body,
      data: {
        ...payload.data,
        type: payload.type,
        userId: target.userId,
        actionUrl: payload.actionUrl
      },
      sound: payload.sound || 'default',
      badge: payload.badge,
      priority: this.mapPriorityToExpo(payload.priority),
      channelId: this.getChannelForType(payload.type),
      ttl: payload.expiresAt ? Math.floor((payload.expiresAt.getTime() - Date.now()) / 1000) : undefined
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const tickets: PushTicket[] = responseData.data || [];

      // Procesar tickets
      let totalSent = 0;
      let totalFailed = 0;
      const errors: string[] = [];

      tickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          totalSent++;
          // Guardar ticket para verificar receipt más tarde
          if (ticket.id) {
            const userIds = this.pendingTickets.get(ticket.id) || [];
            userIds.push(targets[index].userId);
            this.pendingTickets.set(ticket.id, userIds);
          }
        } else {
          totalFailed++;
          errors.push(`Token ${targets[index].expoPushToken}: ${ticket.message}`);
          
          // Si el token es inválido, marcarlo para limpieza
          if (ticket.message?.includes('DeviceNotRegistered') || 
              ticket.message?.includes('InvalidCredentials')) {
            this.markTokenAsInvalid(targets[index].userId, targets[index].expoPushToken);
          }
        }
      });

      return {
        success: totalFailed === 0,
        totalSent,
        totalFailed,
        tickets,
        errors
      };
    } catch (error) {
      console.error('Error enviando batch:', error);
      
      // Agregar a cola de reintentos
      this.addToRetryQueue(messages, 1);
      
      return {
        success: false,
        totalSent: 0,
        totalFailed: targets.length,
        tickets: [],
        errors: [error instanceof Error ? error.message : 'Error de red']
      };
    }
  }

  // Mapear prioridad a formato de Expo
  private mapPriorityToExpo(priority?: NotificationPriority): 'default' | 'normal' | 'high' {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'default';
      case NotificationPriority.HIGH:
      case NotificationPriority.URGENT:
        return 'high';
      default:
        return 'normal';
    }
  }

  // Obtener canal para tipo de notificación
  private getChannelForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.MATCH_FOUND:
      case NotificationType.GAME_INVITE:
        return 'matches';
      case NotificationType.MESSAGE:
        return 'messages';
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.POST_LIKE:
      case NotificationType.POST_COMMENT:
        return 'social';
      case NotificationType.TOURNAMENT_UPDATE:
        return 'tournaments';
      case NotificationType.SYSTEM:
        return 'system';
      default:
        return 'default';
    }
  }

  // Programar notificación para envío posterior
  private async scheduleNotification(
    targets: NotificationTarget[],
    payload: NotificationPayload,
    scheduleAt: Date
  ) {
    try {
      await addDoc(collection(db, 'scheduledNotifications'), {
        targets: targets.map(t => ({ userId: t.userId, expoPushToken: t.expoPushToken })),
        payload,
        scheduleAt,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      console.log(`📅 Notificación programada para ${scheduleAt.toISOString()}`);
    } catch (error) {
      console.error('Error programando notificación:', error);
      throw error;
    }
  }

  // Marcar token como inválido
  private async markTokenAsInvalid(userId: string, token: string) {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        expoPushToken: null,
        invalidTokens: {
          [token]: {
            invalidatedAt: serverTimestamp(),
            reason: 'DeviceNotRegistered'
          }
        }
      });
      
      console.log(`🗑️ Token marcado como inválido para usuario ${userId}`);
    } catch (error) {
      console.error('Error marcando token como inválido:', error);
    }
  }

  // Agregar a cola de reintentos
  private addToRetryQueue(messages: any[], attempt: number) {
    if (attempt <= RETRY_ATTEMPTS) {
      this.retryQueue.push({
        payload: messages,
        attempt,
        delay: RETRY_DELAY * Math.pow(2, attempt - 1) // Backoff exponencial
      });
      
      if (!this.isProcessingRetries) {
        this.processRetryQueue();
      }
    }
  }

  // Procesar cola de reintentos
  private async processRetryQueue() {
    this.isProcessingRetries = true;
    
    while (this.retryQueue.length > 0) {
      const item = this.retryQueue.shift();
      if (!item) continue;
      
      await new Promise(resolve => setTimeout(resolve, item.delay));
      
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        console.log(`✅ Reintento ${item.attempt} exitoso`);
      } catch (error) {
        console.error(`❌ Reintento ${item.attempt} falló:`, error);
        
        // Agregar a cola nuevamente si no se han agotado los intentos
        this.addToRetryQueue(item.payload, item.attempt + 1);
      }
    }
    
    this.isProcessingRetries = false;
  }

  // Guardar historial de notificaciones
  private async saveNotificationHistory(
    targets: NotificationTarget[],
    payload: NotificationPayload,
    result: NotificationResult
  ) {
    try {
      await addDoc(collection(db, 'notificationHistory'), {
        targetCount: targets.length,
        payload: {
          type: payload.type,
          title: payload.title,
          body: payload.body,
          priority: payload.priority
        },
        result: {
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          success: result.success
        },
        sentAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error guardando historial:', error);
    }
  }

  // Verificar receipts de notificaciones enviadas
  async checkReceipts(ticketIds: string[]): Promise<{ [ticketId: string]: PushReceipt }> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: ticketIds })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error verificando receipts:', error);
      return {};
    }
  }

  // Utilidad para dividir arrays en chunks
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Obtener estadísticas del servidor
  getStats() {
    return {
      pendingTickets: this.pendingTickets.size,
      retryQueueLength: this.retryQueue.length,
      isProcessingRetries: this.isProcessingRetries
    };
  }

  // Limpiar datos
  cleanup() {
    this.pendingTickets.clear();
    this.retryQueue = [];
    this.isProcessingRetries = false;
  }
}

// Instancia singleton
export const notificationServer = new NotificationServer();

// Funciones de conveniencia
export const sendNotificationToUser = (userId: string, payload: NotificationPayload) => {
  return notificationServer.sendToUser(userId, payload);
};

export const sendNotificationToUsers = (userIds: string[], payload: NotificationPayload) => {
  return notificationServer.sendToUsers(userIds, payload);
};

export const sendBulkNotification = (request: BulkNotificationRequest) => {
  return notificationServer.sendBulkNotification(request);
};

export default notificationServer;