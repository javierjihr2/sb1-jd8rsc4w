import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { safeDocData, validateUserData } from './data-validation';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  username: string;
  country: string;
  gameServer: string;
  age: number;
  gender: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  profile?: UserProfile;
  error?: string;
}

// Verificar si un username ya existe
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // true si está disponible
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

// Registrar nuevo usuario
export const registerUser = async (
  email: string,
  password: string,
  profileData: {
    fullName: string;
    username: string;
    country: string;
    gameServer: string;
    age: number;
    gender: string;
  }
): Promise<AuthResult> => {
  try {
    // Verificar disponibilidad del username
    const isUsernameAvailable = await checkUsernameAvailability(profileData.username);
    if (!isUsernameAvailable) {
      return {
        success: false,
        error: 'El nombre de usuario ya está en uso'
      };
    }

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar el perfil de Auth con el nombre
    await updateProfile(user, {
      displayName: profileData.fullName
    });

    // Crear perfil en Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      fullName: profileData.fullName,
      username: profileData.username.toLowerCase(),
      country: profileData.country,
      gameServer: profileData.gameServer,
      age: profileData.age,
      gender: profileData.gender,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    console.log('✅ Usuario registrado exitosamente:', user.uid);
    return {
      success: true,
      user,
      profile: userProfile
    };
  } catch (error: any) {
    console.error('❌ Error en registro:', error);
    let errorMessage = 'Error al crear la cuenta';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Iniciar sesión
export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener perfil del usuario
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let profile: UserProfile | undefined;
    
    if (userDoc.exists()) {
      const userData = safeDocData(userDoc);
      const validation = validateUserData(userData);
      
      if (validation.isValid) {
        profile = validation.sanitizedData as UserProfile;
      } else {
        console.warn('⚠️ Invalid user profile data:', validation.errors);
        profile = {
          uid: user.uid,
          email: userData.email || user.email || '',
          fullName: userData.displayName || 'Usuario',
          username: userData.username || userData.email?.split('@')[0] || 'usuario',
          country: userData.country || '',
          gameServer: userData.gameServer || '',
          age: userData.age || 18,
          gender: userData.gender || '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as UserProfile;
      }
    }

    console.log('✅ Usuario logueado exitosamente:', user.uid);
    return {
      success: true,
      user,
      profile
    };
  } catch (error: any) {
    console.error('❌ Error en login:', error);
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos. Intenta más tarde';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Cerrar sesión
export const logoutUser = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    console.log('✅ Usuario deslogueado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    return false;
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = safeDocData(userDoc);
      const validation = validateUserData(userData);
      
      if (validation.isValid) {
        return validation.sanitizedData as UserProfile;
      } else {
        console.warn('⚠️ Invalid user profile data for uid:', uid, validation.errors);
        // Retornar datos básicos válidos
        return {
          uid: uid,
          email: userData.email || '',
          fullName: userData.displayName || 'Usuario',
          username: userData.username || 'usuario',
          country: userData.country || '',
          gameServer: userData.gameServer || '',
          age: userData.age || 18,
          gender: userData.gender || '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as UserProfile;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};