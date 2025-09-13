
"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 AuthProvider - Configurando listener de autenticación');
    
    // Intentar recuperar usuario desde localStorage al inicio
    const tryRecoverUser = () => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('squadgo_user');
        const backupUser = localStorage.getItem('squadgo_user_backup');
        
        if (savedUser || backupUser) {
          try {
            const userData = JSON.parse(savedUser || backupUser || '{}');
            console.log('🔄 AuthProvider - Intentando recuperar sesión desde localStorage:', userData.uid);
            // No establecer el usuario aún, esperar confirmación de Firebase
          } catch (error) {
            console.error('❌ Error recuperando usuario desde localStorage:', error);
            localStorage.removeItem('squadgo_user');
            localStorage.removeItem('squadgo_user_backup');
          }
        }
      }
    };
    
    tryRecoverUser();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 AuthProvider - Estado de autenticación cambió:', {
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified
      });
      
      if (firebaseUser) {
        try {
          console.log('✅ AuthProvider - Usuario autenticado');
          
          setUser(firebaseUser);
          
          // Guardar en localStorage para persistencia con timestamp
          if (typeof window !== 'undefined') {
            const userObject = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              emailVerified: firebaseUser.emailVerified,
              lastUpdate: Date.now(),
              sessionId: Math.random().toString(36).substring(2, 11)
            };
            localStorage.setItem('squadgo_user', JSON.stringify(userObject));
            localStorage.setItem('squadgo_user_backup', JSON.stringify(userObject));
            
            // Disparar evento personalizado para notificar a otros componentes
            const event = new CustomEvent('userAuthenticated', {
              detail: { user: firebaseUser }
            });
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.error('❌ AuthProvider - Error procesando usuario:', error);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('squadgo_user');
            localStorage.removeItem('squadgo_user_backup');
          }
        }
      } else {
        console.log('🚫 AuthProvider - Usuario no autenticado');
        setUser(null);
        if (typeof window !== 'undefined') {
          // Solo limpiar si realmente no hay usuario autenticado
          const backupUser = localStorage.getItem('squadgo_user_backup');
          if (backupUser) {
            try {
              const userData = JSON.parse(backupUser);
              const timeSinceLastUpdate = Date.now() - (userData.lastUpdate || 0);
              // Solo limpiar si han pasado más de 24 horas
              if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('squadgo_user');
                localStorage.removeItem('squadgo_user_backup');
                console.log('🧹 Limpiando datos de sesión expirados');
              } else {
                console.log('🔄 Manteniendo backup de sesión reciente');
              }
            } catch (error) {
              localStorage.removeItem('squadgo_user');
              localStorage.removeItem('squadgo_user_backup');
            }
          } else {
            localStorage.removeItem('squadgo_user');
          }
        }
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🧹 AuthProvider - Limpiando listener de autenticación');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
