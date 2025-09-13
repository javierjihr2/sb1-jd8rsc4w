import { useState } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContextSimple';

export interface BlockUserOptions {
  userId: string;
  displayName: string;
  reason?: string;
}

export const useBlockUser = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const blockUser = async ({ userId, displayName, reason = 'Bloqueado manualmente' }: BlockUserOptions) => {
    if (!user?.uid) {
      Alert.alert('Error', 'Debes estar autenticado para bloquear usuarios');
      return false;
    }

    if (userId === user.uid) {
      Alert.alert('Error', 'No puedes bloquearte a ti mismo');
      return false;
    }

    setLoading(true);
    try {
      // Obtener datos actuales del usuario
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Verificar si ya está bloqueado
      const currentBlockedUsers = userData.blockedUsers || [];
      const isAlreadyBlocked = currentBlockedUsers.some((blocked: any) => blocked.userId === userId);
      
      if (isAlreadyBlocked) {
        Alert.alert('Usuario ya bloqueado', 'Este usuario ya está en tu lista de bloqueados');
        return false;
      }
      
      // Añadir a la lista de bloqueados
      const newBlockedUser = {
        userId,
        blockedAt: new Date(),
        reason
      };
      
      await updateDoc(doc(db, 'users', user.uid), {
        blockedUsers: [...currentBlockedUsers, newBlockedUser],
        updatedAt: new Date()
      });
      
      Alert.alert('Usuario Bloqueado', `${displayName} ha sido bloqueado exitosamente`);
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'No se pudo bloquear al usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async ({ userId, displayName }: { userId: string; displayName: string }) => {
    if (!user?.uid) {
      Alert.alert('Error', 'Debes estar autenticado para desbloquear usuarios');
      return false;
    }

    setLoading(true);
    try {
      // Actualizar lista de usuarios bloqueados
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedBlockedUsers = (userData.blockedUsers || []).filter(
          (blocked: any) => blocked.userId !== userId
        );
        
        await updateDoc(doc(db, 'users', user.uid), {
          blockedUsers: updatedBlockedUsers,
          updatedAt: new Date()
        });
        
        Alert.alert('Éxito', `${displayName} ha sido desbloqueado`);
        return true;
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'No se pudo desbloquear al usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isUserBlocked = async (userId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const blockedUsers = userData.blockedUsers || [];
        return blockedUsers.some((blocked: any) => blocked.userId === userId);
      }
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
    }
    return false;
  };

  const reportUser = async ({
    userId,
    displayName,
    reason,
    description
  }: {
    userId: string;
    displayName: string;
    reason: string;
    description: string;
  }) => {
    if (!user?.uid) {
      Alert.alert('Error', 'Debes estar autenticado para reportar usuarios');
      return false;
    }

    setLoading(true);
    try {
      // Crear reporte en Firestore
      const reportData = {
        reporterId: user.uid,
        reportedUserId: userId,
        reason,
        description,
        reportedAt: new Date(),
        status: 'pending'
      };

      // Crear reporte en la colección de reportes
      await addDoc(collection(db, 'reports'), reportData);
      
      Alert.alert('Reporte Enviado', `El reporte contra ${displayName} ha sido enviado para revisión`);
      return true;
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    blockUser,
    unblockUser,
    isUserBlocked,
    reportUser,
    loading
  };
};