// Sistema de administración y permisos para SquadGO
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PlayerProfile } from './types';

// Roles disponibles en el sistema
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permisos específicos
export enum Permission {
  // Permisos de usuario básico
  CREATE_POST = 'create_post',
  EDIT_OWN_POST = 'edit_own_post',
  DELETE_OWN_POST = 'delete_own_post',
  
  // Permisos de moderación
  MODERATE_POSTS = 'moderate_posts',
  MODERATE_COMMENTS = 'moderate_comments',
  BAN_USERS = 'ban_users',
  
  // Permisos de administración
  MANAGE_TOURNAMENTS = 'manage_tournaments',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  
  // Permisos de super administrador
  MANAGE_ADMINS = 'manage_admins',
  SYSTEM_CONFIG = 'system_config',
  DELETE_ANY_DATA = 'delete_any_data'
}

// Mapeo de roles a permisos
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST
  ],
  [UserRole.MODERATOR]: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    Permission.MODERATE_POSTS,
    Permission.MODERATE_COMMENTS,
    Permission.BAN_USERS
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    Permission.MODERATE_POSTS,
    Permission.MODERATE_COMMENTS,
    Permission.BAN_USERS,
    Permission.MANAGE_TOURNAMENTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission)
};

// Email del super administrador
const SUPER_ADMIN_EMAIL = 'javier.jihr2@gmail.com';

// Función para regalar suscripción Creador
export const giftCreatorSubscription = async (targetUserId: string, giftedBy: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar que quien regala sea admin
    const adminDoc = await getDoc(doc(db, 'admins', giftedBy));
    if (!adminDoc.exists()) {
      return { success: false, message: 'No tienes permisos para regalar suscripciones' };
    }

    // Crear suscripción gratuita para el usuario
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mes gratis

    const giftSubscription = {
      planId: 'creator',
      startDate,
      endDate,
      isActive: true,
      autoRenew: false,
      paymentMethod: 'gift',
      giftedBy: giftedBy,
      giftedAt: new Date()
    };

    // Guardar en el perfil del usuario
    await updateDoc(doc(db, 'users', targetUserId), {
      subscription: giftSubscription,
      isCreator: true,
      updatedAt: new Date()
    });

    // Registrar la acción en logs
    await addDoc(collection(db, 'admin_logs'), {
      action: 'gift_subscription',
      adminId: giftedBy,
      targetUserId: targetUserId,
      details: { planId: 'creator', duration: '1 month' },
      timestamp: new Date()
    });

    return { success: true, message: 'Suscripción Creador regalada exitosamente' };
  } catch (error) {
    console.error('Error gifting subscription:', error);
    return { success: false, message: 'Error al regalar la suscripción' };
  }
};

// Función para eliminar todos los usuarios (excepto admins)
export const clearAllUsers = async (adminId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar que sea super admin
    const adminDoc = await getDoc(doc(db, 'admins', adminId));
    if (!adminDoc.exists() || adminDoc.data()?.role !== UserRole.SUPER_ADMIN) {
      return { success: false, message: 'Solo el super administrador puede realizar esta acción' };
    }

    // Obtener todos los usuarios
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    // Obtener lista de admins para no eliminarlos
    const adminsQuery = query(collection(db, 'admins'));
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminIds = adminsSnapshot.docs.map(doc => doc.id);

    let deletedCount = 0;
    const batch = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // No eliminar admins
      if (!adminIds.includes(userId)) {
        batch.push(deleteDoc(doc(db, 'users', userId)));
        deletedCount++;
      }
    }

    // Ejecutar eliminaciones
    await Promise.all(batch);

    // Registrar la acción
    await addDoc(collection(db, 'admin_logs'), {
      action: 'clear_all_users',
      adminId: adminId,
      details: { deletedCount },
      timestamp: new Date()
    });

    return { success: true, message: `${deletedCount} usuarios eliminados exitosamente` };
  } catch (error) {
    console.error('Error clearing users:', error);
    return { success: false, message: 'Error al eliminar usuarios' };
  }
};

// Interfaz para datos de administrador
export interface AdminData {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
}

/**
 * Verifica si un usuario es super administrador
 */
export const isSuperAdmin = (email: string): boolean => {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

/**
 * Obtiene el rol de un usuario
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    // Verificar si es super admin por email
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (isSuperAdmin(userData.email)) {
        return UserRole.SUPER_ADMIN;
      }
    }

    // Verificar en la colección de admins
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) {
      const adminData = adminDoc.data() as AdminData;
      return adminData.isActive ? adminData.role : UserRole.USER;
    }

    return UserRole.USER;
  } catch (error) {
    console.error('Error obteniendo rol de usuario:', error);
    return UserRole.USER;
  }
};

/**
 * Obtiene los permisos de un usuario
 */
export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  try {
    const role = await getUserRole(userId);
    return ROLE_PERMISSIONS[role] || [];
  } catch (error) {
    console.error('Error obteniendo permisos de usuario:', error);
    return [];
  }
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const hasPermission = async (userId: string, permission: Permission): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
};

/**
 * Verifica si un usuario tiene un rol específico o superior
 */
export const hasRole = async (userId: string, requiredRole: UserRole): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    
    // Jerarquía de roles
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.MODERATOR]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error('Error verificando rol:', error);
    return false;
  }
};

/**
 * Asigna un rol de administrador a un usuario
 */
export const assignAdminRole = async (
  targetUserId: string,
  targetEmail: string,
  role: UserRole,
  assignedByUserId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar que quien asigna tenga permisos
    const assignerRole = await getUserRole(assignedByUserId);
    if (assignerRole !== UserRole.SUPER_ADMIN && assignerRole !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'No tienes permisos para asignar roles de administrador'
      };
    }

    // No permitir que admins regulares asignen roles de super admin
    if (assignerRole === UserRole.ADMIN && role === UserRole.SUPER_ADMIN) {
      return {
        success: false,
        message: 'Solo el super administrador puede asignar roles de super administrador'
      };
    }

    // Crear o actualizar el documento de admin
    const adminData: AdminData = {
      userId: targetUserId,
      email: targetEmail,
      role: role,
      permissions: ROLE_PERMISSIONS[role],
      assignedBy: assignedByUserId,
      assignedAt: new Date(),
      isActive: true
    };

    await setDoc(doc(db, 'admins', targetUserId), adminData);

    // También actualizar el perfil del usuario
    await updateDoc(doc(db, 'users', targetUserId), {
      role: role,
      isAdmin: role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: `Rol ${role} asignado exitosamente`
    };
  } catch (error) {
    console.error('Error asignando rol de admin:', error);
    return {
      success: false,
      message: 'Error al asignar rol de administrador'
    };
  }
};

/**
 * Revoca un rol de administrador
 */
export const revokeAdminRole = async (
  targetUserId: string,
  revokedByUserId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar permisos del que revoca
    const revokerRole = await getUserRole(revokedByUserId);
    if (revokerRole !== UserRole.SUPER_ADMIN && revokerRole !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'No tienes permisos para revocar roles de administrador'
      };
    }

    // Verificar que no se esté intentando revocar al super admin
    const targetRole = await getUserRole(targetUserId);
    if (targetRole === UserRole.SUPER_ADMIN && revokerRole !== UserRole.SUPER_ADMIN) {
      return {
        success: false,
        message: 'No puedes revocar el rol del super administrador'
      };
    }

    // Desactivar el admin
    await updateDoc(doc(db, 'admins', targetUserId), {
      isActive: false,
      revokedBy: revokedByUserId,
      revokedAt: new Date()
    });

    // Actualizar el perfil del usuario
    await updateDoc(doc(db, 'users', targetUserId), {
      role: UserRole.USER,
      isAdmin: false,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: 'Rol de administrador revocado exitosamente'
    };
  } catch (error) {
    console.error('Error revocando rol de admin:', error);
    return {
      success: false,
      message: 'Error al revocar rol de administrador'
    };
  }
};

/**
 * Obtiene la lista de todos los administradores
 */
export const getAdminList = async (): Promise<AdminData[]> => {
  try {
    const adminsQuery = query(
      collection(db, 'admins'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(adminsQuery);
    const admins: AdminData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AdminData;
      admins.push({
        ...data,
        assignedAt: data.assignedAt instanceof Date ? data.assignedAt : new Date(data.assignedAt)
      });
    });

    return admins;
  } catch (error) {
    console.error('Error obteniendo lista de admins:', error);
    return [];
  }
};

/**
 * Inicializa el super administrador si no existe
 */
export const initializeSuperAdmin = async (): Promise<void> => {
  try {
    // Buscar usuario con el email del super admin
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', SUPER_ADMIN_EMAIL)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      
      // Verificar si ya es admin
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      
      if (!adminDoc.exists()) {
        // Crear entrada de super admin
        const adminData: AdminData = {
          userId: userId,
          email: SUPER_ADMIN_EMAIL,
          role: UserRole.SUPER_ADMIN,
          permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
          assignedBy: 'system',
          assignedAt: new Date(),
          isActive: true
        };

        await setDoc(doc(db, 'admins', userId), adminData);
        
        // Actualizar perfil del usuario
        await updateDoc(doc(db, 'users', userId), {
          role: UserRole.SUPER_ADMIN,
          isAdmin: true,
          isSuperAdmin: true,
          updatedAt: new Date()
        });

        console.log('✅ Super administrador inicializado correctamente');
      }
    }
  } catch (error) {
    console.error('Error inicializando super admin:', error);
  }
};