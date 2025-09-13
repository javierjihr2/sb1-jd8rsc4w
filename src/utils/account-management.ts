// Utilidades para gestión de cuentas de usuario
import { auth, db } from '@/lib/firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export interface AccountDeletionResult {
  success: boolean;
  message: string;
}

export interface AccountSuspensionResult {
  success: boolean;
  message: string;
}

/**
 * Suspende temporalmente la cuenta del usuario
 */
export const suspendUserAccount = async (): Promise<AccountSuspensionResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    // Actualizar el estado del usuario en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspendedReason: 'Usuario solicitó suspensión temporal'
    });

    // Cerrar sesión del usuario
    await signOut(auth);

    return {
      success: true,
      message: 'Cuenta suspendida exitosamente. Puedes reactivarla iniciando sesión nuevamente.'
    };
  } catch (error) {
    console.error('Error suspendiendo cuenta:', error);
    return {
      success: false,
      message: 'Error al suspender la cuenta. Inténtalo de nuevo.'
    };
  }
};

/**
 * Elimina permanentemente la cuenta del usuario
 */
export const deleteUserAccount = async (): Promise<AccountDeletionResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ No hay usuario autenticado para eliminar');
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    const userId = user.uid;
    console.log('🗑️ Iniciando eliminación de cuenta para usuario:', userId);

    // Eliminar datos del usuario de Firestore
    try {
      console.log('🗑️ Eliminando documento de usuario de Firestore...');
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      console.log('✅ Documento de usuario eliminado');
    } catch (error) {
      console.error('❌ Error eliminando documento de usuario:', error);
      // Continuar con la eliminación aunque falle este paso
    }

    // Eliminar datos relacionados (opcional - puedes agregar más colecciones)
    try {
      console.log('🗑️ Eliminando perfil de jugador...');
      const playerProfileRef = doc(db, 'playerProfiles', userId);
      await deleteDoc(playerProfileRef);
      console.log('✅ Perfil de jugador eliminado');
    } catch {
      console.log('ℹ️ No se encontró perfil de jugador para eliminar');
    }

    try {
      console.log('🗑️ Eliminando configuraciones de usuario...');
      const userSettingsRef = doc(db, 'userSettings', userId);
      await deleteDoc(userSettingsRef);
      console.log('✅ Configuraciones de usuario eliminadas');
    } catch {
      console.log('ℹ️ No se encontraron configuraciones de usuario para eliminar');
    }

    // Eliminar la cuenta de autenticación de Firebase
    try {
      console.log('🗑️ Eliminando cuenta de autenticación...');
      await deleteUser(user);
      console.log('✅ Cuenta de autenticación eliminada');
    } catch (error: unknown) {
      console.error('❌ Error eliminando cuenta de autenticación:', error);
      throw error; // Re-lanzar este error ya que es crítico
    }

    console.log('✅ Eliminación de cuenta completada exitosamente');
    return {
      success: true,
      message: 'Cuenta eliminada permanentemente. Todos tus datos han sido borrados.'
    };
  } catch (error: unknown) {
    console.error('❌ Error eliminando cuenta:', error);
    
    // Manejar errores específicos
    if ((error as { code?: string }).code === 'auth/requires-recent-login') {
      return {
        success: false,
        message: 'Por seguridad, necesitas iniciar sesión nuevamente antes de eliminar tu cuenta.'
      };
    }
    
    if ((error as { code?: string }).code === 'auth/invalid-credential') {
      return {
        success: false,
        message: 'Credenciales inválidas. Por favor, inicia sesión nuevamente.'
      };
    }
    
    if ((error as { code?: string }).code === 'permission-denied') {
      return {
        success: false,
        message: 'No tienes permisos para realizar esta acción.'
      };
    }
    
    return {
      success: false,
      message: 'Error al eliminar la cuenta. Inténtalo de nuevo.'
    };
  }
};

/**
 * Reactiva una cuenta suspendida
 */
export const reactivateUserAccount = async (): Promise<AccountSuspensionResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    // Actualizar el estado del usuario en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      status: 'active',
      reactivatedAt: serverTimestamp(),
      suspendedAt: null,
      suspendedReason: null
    });

    return {
      success: true,
      message: 'Cuenta reactivada exitosamente. ¡Bienvenido de vuelta!'
    };
  } catch (error) {
    console.error('Error reactivando cuenta:', error);
    return {
      success: false,
      message: 'Error al reactivar la cuenta. Inténtalo de nuevo.'
    };
  }
};

/**
 * Verifica si una cuenta está suspendida
 */
export const checkAccountStatus = async (): Promise<'active' | 'suspended' | 'unknown'> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return 'unknown';
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.status || 'active';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error verificando estado de cuenta:', error);
    return 'unknown';
  }
};