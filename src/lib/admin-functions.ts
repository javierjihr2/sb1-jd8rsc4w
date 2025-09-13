import { deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Función para eliminar un perfil de usuario de Firestore
export const deleteUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { success: false, error };
  }
};



// Nota: Para eliminar usuarios de Firebase Authentication,
// necesitarías usar Firebase Admin SDK en el backend,
// ya que no se puede hacer desde el cliente por seguridad.
// Por ahora, solo eliminamos el perfil de Firestore.