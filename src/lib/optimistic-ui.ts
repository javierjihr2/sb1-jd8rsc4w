// Sistema de UI optimista para operaciones de likes y bookmarks
import { doc, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Tipos para operaciones optimistas
interface OptimisticOperation {
  id: string;
  type: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'comment_like' | 'comment_unlike';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Cola de operaciones pendientes
const pendingOperations = new Map<string, OptimisticOperation>();
const maxRetries = 3;
const retryDelay = 2000;

// Función para generar ID único de operación
const generateOperationId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Función para ejecutar operación en segundo plano
const executeOperation = async (operation: OptimisticOperation): Promise<boolean> => {
  try {
    switch (operation.type) {
      case 'like':
        await likeFeedPostSync(operation.data.postId, operation.data.userId);
        break;
      case 'unlike':
        await unlikeFeedPostSync(operation.data.postId, operation.data.userId);
        break;
      case 'bookmark':
        await addBookmarkSync(operation.data.userId, operation.data.postId);
        break;
      case 'unbookmark':
        await removeBookmarkSync(operation.data.userId, operation.data.postId);
        break;
      case 'comment_like':
        await likeCommentSync(operation.data.postId, operation.data.commentId, operation.data.userId);
        break;
      case 'comment_unlike':
        await unlikeCommentSync(operation.data.postId, operation.data.commentId, operation.data.userId);
        break;
      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }
    return true;
  } catch (error) {
    console.error(`Error ejecutando operación ${operation.type}:`, error);
    return false;
  }
};

// Función para procesar cola de operaciones
const processOperationQueue = async () => {
  const operations = Array.from(pendingOperations.values());
  
  for (const operation of operations) {
    const success = await executeOperation(operation);
    
    if (success) {
      pendingOperations.delete(operation.id);
      console.log(`✅ Operación ${operation.type} completada:`, operation.id);
    } else {
      operation.retries++;
      if (operation.retries >= operation.maxRetries) {
        pendingOperations.delete(operation.id);
        console.error(`❌ Operación ${operation.type} falló después de ${operation.maxRetries} intentos:`, operation.id);
        // Aquí podrías revertir la UI o mostrar un error al usuario
      } else {
        console.log(`🔄 Reintentando operación ${operation.type} (${operation.retries}/${operation.maxRetries}):`, operation.id);
        setTimeout(() => processOperationQueue(), retryDelay * operation.retries);
      }
    }
  }
};

// Funciones de sincronización con Firestore
const likeFeedPostSync = async (postId: string, userId: string) => {
  const postRef = doc(db, 'feedPosts', postId);
  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
    updatedAt: serverTimestamp()
  });
};

const unlikeFeedPostSync = async (postId: string, userId: string) => {
  const postRef = doc(db, 'feedPosts', postId);
  await updateDoc(postRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
    updatedAt: serverTimestamp()
  });
};

const addBookmarkSync = async (userId: string, postId: string) => {
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', postId);
  await updateDoc(bookmarkRef, {
    postId,
    createdAt: serverTimestamp()
  });
};

const removeBookmarkSync = async (userId: string, postId: string) => {
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', postId);
  await updateDoc(bookmarkRef, {
    deletedAt: serverTimestamp()
  });
};

const likeCommentSync = async (postId: string, commentId: string, userId: string) => {
  // Implementar lógica de like de comentario
  // Esta función debería actualizar el comentario específico en el post
};

const unlikeCommentSync = async (postId: string, commentId: string, userId: string) => {
  // Implementar lógica de unlike de comentario
  // Esta función debería actualizar el comentario específico en el post
};

// Funciones públicas para UI optimista
export const optimisticLikeFeedPost = async (postId: string, userId: string, currentState: { likes: number; likedBy: string[] }) => {
  // Actualizar UI inmediatamente
  const newState = {
    likes: currentState.likes + 1,
    likedBy: [...currentState.likedBy, userId]
  };
  
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'like',
    data: { postId, userId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return newState;
};

export const optimisticUnlikeFeedPost = async (postId: string, userId: string, currentState: { likes: number; likedBy: string[] }) => {
  // Actualizar UI inmediatamente
  const newState = {
    likes: Math.max(currentState.likes - 1, 0),
    likedBy: currentState.likedBy.filter(id => id !== userId)
  };
  
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'unlike',
    data: { postId, userId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return newState;
};

export const optimisticAddBookmark = async (userId: string, postId: string) => {
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'bookmark',
    data: { userId, postId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return { success: true, bookmarked: true };
};

export const optimisticRemoveBookmark = async (userId: string, postId: string) => {
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'unbookmark',
    data: { userId, postId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return { success: true, bookmarked: false };
};

export const optimisticLikeComment = async (postId: string, commentId: string, userId: string, currentLikes: number, currentLikedBy: string[]) => {
  // Actualizar UI inmediatamente
  const newState = {
    likes: currentLikes + 1,
    likedBy: [...currentLikedBy, userId]
  };
  
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'comment_like',
    data: { postId, commentId, userId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return newState;
};

export const optimisticUnlikeComment = async (postId: string, commentId: string, userId: string, currentLikes: number, currentLikedBy: string[]) => {
  // Actualizar UI inmediatamente
  const newState = {
    likes: Math.max(currentLikes - 1, 0),
    likedBy: currentLikedBy.filter(id => id !== userId)
  };
  
  // Agregar operación a la cola
  const operationId = generateOperationId();
  pendingOperations.set(operationId, {
    id: operationId,
    type: 'comment_unlike',
    data: { postId, commentId, userId },
    timestamp: Date.now(),
    retries: 0,
    maxRetries
  });
  
  // Procesar cola en segundo plano
  setTimeout(processOperationQueue, 100);
  
  return newState;
};

// Función para obtener estado de operaciones pendientes
export const getPendingOperationsCount = () => pendingOperations.size;

// Función para limpiar operaciones pendientes (útil para testing)
export const clearPendingOperations = () => {
  pendingOperations.clear();
};

// Inicializar procesamiento automático de cola
if (typeof window !== 'undefined') {
  // Procesar cola cada 5 segundos
  setInterval(processOperationQueue, 5000);
  
  // Procesar cola cuando la ventana recupere el foco
  window.addEventListener('focus', processOperationQueue);
  
  // Procesar cola cuando la conexión se restaure
  window.addEventListener('online', processOperationQueue);
}