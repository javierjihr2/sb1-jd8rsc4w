// Hook para gestión de administración y permisos
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContextSimple';
import {
  UserRole,
  Permission,
  AdminData,
  getUserRole,
  getUserPermissions,
  hasPermission,
  hasRole,
  assignAdminRole,
  revokeAdminRole,
  getAdminList,
  initializeSuperAdmin,
  isSuperAdmin,
  giftCreatorSubscription,
  clearAllUsers
} from '../lib/admin';

export interface UseAdminReturn {
  // Estado del usuario actual
  userRole: UserRole;
  userPermissions: Permission[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  
  // Funciones de verificación
  checkPermission: (permission: Permission) => boolean;
  checkRole: (role: UserRole) => boolean;
  
  // Funciones de gestión
  assignRole: (userId: string, email: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  revokeRole: (userId: string) => Promise<{ success: boolean; message: string }>;
  getAdmins: () => Promise<AdminData[]>;
  
  // Funciones de utilidad
  refreshPermissions: () => Promise<void>;
  giftSubscription: (targetUserId: string) => Promise<{ success: boolean; message: string }>;
  clearUsers: () => Promise<{ success: boolean; message: string }>;
}

export const useAdmin = (): UseAdminReturn => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar permisos del usuario
  const loadUserPermissions = async () => {
    if (!user) {
      setUserRole(UserRole.USER);
      setUserPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Inicializar super admin si es necesario
      await initializeSuperAdmin();
      
      // Obtener rol y permisos
      const role = await getUserRole(user.uid);
      const permissions = await getUserPermissions(user.uid);
      
      setUserRole(role);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error cargando permisos de usuario:', error);
      setUserRole(UserRole.USER);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar permisos cuando cambie el usuario
  useEffect(() => {
    loadUserPermissions();
  }, [user]);

  // Verificar si el usuario tiene un permiso específico
  const checkPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  // Verificar si el usuario tiene un rol específico o superior
  const checkRole = (role: UserRole): boolean => {
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.MODERATOR]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[role];
  };

  // Asignar rol de administrador
  const assignRole = async (
    targetUserId: string,
    targetEmail: string,
    role: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      const result = await assignAdminRole(targetUserId, targetEmail, role, user.uid);
      
      // Refrescar permisos después de asignar rol
      if (result.success) {
        await loadUserPermissions();
      }
      
      return result;
    } catch (error) {
      console.error('Error asignando rol:', error);
      return {
        success: false,
        message: 'Error al asignar rol'
      };
    }
  };

  // Revocar rol de administrador
  const revokeRole = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      const result = await revokeAdminRole(targetUserId, user.uid);
      
      // Refrescar permisos después de revocar rol
      if (result.success) {
        await loadUserPermissions();
      }
      
      return result;
    } catch (error) {
      console.error('Error revocando rol:', error);
      return {
        success: false,
        message: 'Error al revocar rol'
      };
    }
  };

  // Obtener lista de administradores
  const getAdmins = async (): Promise<AdminData[]> => {
    try {
      return await getAdminList();
    } catch (error) {
      console.error('Error obteniendo lista de admins:', error);
      return [];
    }
  };

  // Refrescar permisos manualmente
  const refreshPermissions = async (): Promise<void> => {
    await loadUserPermissions();
  };

  // Regalar suscripción de creador
  const giftSubscription = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      return await giftCreatorSubscription(targetUserId, user.uid);
    } catch (error) {
      console.error('Error regalando suscripción:', error);
      return {
        success: false,
        message: 'Error al regalar suscripción'
      };
    }
  };

  // Limpiar todos los usuarios
  const clearUsers = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      return await clearAllUsers(user.uid);
    } catch (error) {
      console.error('Error limpiando usuarios:', error);
      return {
        success: false,
        message: 'Error al limpiar usuarios'
      };
    }
  };

  // Memoizar cálculos para evitar problemas de orden de Hooks
  const isAdmin = useMemo(() => checkRole(UserRole.ADMIN), [userRole]);
  const isSuperAdminUser = useMemo(() => 
    userRole === UserRole.SUPER_ADMIN || 
    (user?.email ? isSuperAdmin(user.email) : false),
    [userRole, user?.email]
  );

  return {
    userRole,
    userPermissions,
    isAdmin,
    isSuperAdmin: isSuperAdminUser,
    loading,
    checkPermission,
    checkRole,
    assignRole,
    revokeRole,
    getAdmins,
    refreshPermissions,
    giftSubscription,
    clearUsers
  };
};