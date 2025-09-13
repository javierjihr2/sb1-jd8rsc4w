"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/auth-provider'
import { getUltraPersistence } from '@/lib/ultra-persistence'
import { playerProfile } from '@/lib/data'
import { getUserProfile } from '@/lib/database'
import type { PlayerProfile } from '@/lib/types'

interface DataRecoveryMonitorProps {
  onDataRecovered?: (data: any) => void
  onDataLoss?: (error: any) => void
}

export function DataRecoveryMonitor({ onDataRecovered, onDataLoss }: DataRecoveryMonitorProps = {}) {
  const { user } = useAuth()
  const recoveryIntervalRef = useRef<number | null>(null)
  const lastValidationRef = useRef<number>(0)
  
  // Función para validar la integridad de los datos
  const validateDataIntegrity = async (): Promise<boolean> => {
    if (!user?.uid) return true
    
    try {
      const ultraPersistence = await getUltraPersistence()
      if (!ultraPersistence) {
        console.warn('⚠️ Ultra persistence no disponible')
        return false
      }
      const profileData = await ultraPersistence.loadProfile()
      
      // Verificar que los datos esenciales estén presentes
      if (!profileData) {
        console.warn('⚠️ No se encontraron datos del perfil')
        return false
      }
      
      // Verificar estructura básica
      if (!profileData.id || (!profileData.name && !profileData.displayName)) {
        console.warn('⚠️ Campos requeridos faltantes en el perfil')
        return false
      }
      
      // Verificar que los datos no sean demasiado antiguos (más de 7 días)
      const lastModified = profileData.updatedAt ? new Date(profileData.updatedAt).getTime() : 0
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (lastModified < sevenDaysAgo) {
        console.warn('⚠️ Los datos del perfil son muy antiguos')
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ Error validando integridad de datos:', error)
      return false
    }
  }
  
  // Función para recuperar datos desde Firestore
  const recoverFromFirestore = async (): Promise<PlayerProfile | null> => {
    if (!user?.uid) return null
    
    try {
      console.log('🔄 Intentando recuperar datos desde Firestore...')
      const firestoreProfile = await getUserProfile(user.uid)
      
      if (firestoreProfile) {
        console.log('✅ Datos recuperados desde Firestore')
        return { ...playerProfile, ...firestoreProfile }
      }
    } catch (error) {
      console.error('❌ Error recuperando desde Firestore:', error)
    }
    
    return null
  }
  
  // Función para recuperar datos desde fuentes de respaldo
  const recoverFromBackupSources = async (): Promise<PlayerProfile | null> => {
    if (!user?.uid) return null
    
    try {
      console.log('🔄 Intentando recuperar desde fuentes de respaldo...')
      
      // Intentar desde localStorage legacy
      const legacySources = [
        'currentProfile',
        'squadgo_user',
        'squadgo_user_backup',
        `emergency_profile_${user.uid}`
      ]
      
      for (const source of legacySources) {
        try {
          const data = localStorage.getItem(source)
          if (data) {
            const parsed = JSON.parse(data)
            if (parsed && (parsed.id === user.uid || parsed.userId === user.uid)) {
              console.log(`✅ Datos recuperados desde ${source}`)
              return { ...playerProfile, ...parsed }
            }
          }
        } catch (error) {
          console.warn(`Error leyendo ${source}:`, error)
        }
      }
      
      // Intentar desde sessionStorage
      try {
        const sessionData = sessionStorage.getItem(`profile_${user.uid}`)
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          console.log('✅ Datos recuperados desde sessionStorage')
          return { ...playerProfile, ...parsed }
        }
      } catch (error) {
        console.warn('Error leyendo sessionStorage:', error)
      }
      
    } catch (error) {
      console.error('❌ Error en recuperación desde respaldos:', error)
    }
    
    return null
  }
  
  // Función principal de recuperación automática
  const performAutoRecovery = async (): Promise<void> => {
    if (!user?.uid) return
    
    try {
      console.log('🚨 Iniciando recuperación automática de datos...')
      
      // Paso 1: Intentar recuperar desde Firestore
      let recoveredData = await recoverFromFirestore()
      
      // Paso 2: Si falla, intentar desde fuentes de respaldo
      if (!recoveredData) {
        recoveredData = await recoverFromBackupSources()
      }
      
      // Paso 3: Si se recuperaron datos, guardarlos con ultra-persistencia
      if (recoveredData) {
        const ultraPersistence = await getUltraPersistence()
        if (!ultraPersistence) {
          console.warn('⚠️ Ultra persistence no disponible para guardar datos recuperados')
          return
        }
        
        const timestamp = Date.now()
        
        const recoveredProfile = {
          ...recoveredData,
          lastModified: timestamp,
          lastUpdate: timestamp,
          syncStatus: 'recovered',
          recoveryTimestamp: timestamp
        }
        
        await ultraPersistence.saveProfile(recoveredProfile)
        
        console.log('✅ Datos recuperados y guardados exitosamente')
        
        // Notificar sobre la recuperación
        onDataRecovered?.(recoveredProfile)
        
        // Disparar evento para notificar a otros componentes
        window.dispatchEvent(new CustomEvent('dataRecovered', {
          detail: {
            userId: user.uid,
            profile: recoveredProfile,
            timestamp
          }
        }))
        
      } else {
        // Paso 4: Si no se pudo recuperar nada, crear perfil básico
        console.warn('⚠️ No se pudieron recuperar datos, creando perfil básico')
        
        const basicProfile = {
          ...playerProfile,
          id: user.uid,
          name: user.displayName || playerProfile.name,
          email: user.email || playerProfile.email,
          avatarUrl: user.photoURL || playerProfile.avatarUrl,
          lastModified: Date.now(),
          syncStatus: 'basic_recovery'
        }
        
        const ultraPersistence = await getUltraPersistence()
        if (!ultraPersistence) {
          console.warn('⚠️ Ultra persistence no disponible para guardar perfil básico')
          return
        }
        await ultraPersistence.saveProfile(basicProfile)
        
        console.log('✅ Perfil básico creado')
        onDataRecovered?.(basicProfile)
      }
      
    } catch (error) {
      console.error('❌ Error en recuperación automática:', error)
      onDataLoss?.(error)
    }
  }
  
  // Función para monitorear la integridad de los datos
  const monitorDataIntegrity = async (): Promise<void> => {
    const now = Date.now()
    
    // Evitar validaciones muy frecuentes (mínimo cada 30 segundos)
    if (now - lastValidationRef.current < 30000) {
      return
    }
    
    lastValidationRef.current = now
    
    const isValid = await validateDataIntegrity()
    
    if (!isValid) {
      console.warn('🚨 Integridad de datos comprometida, iniciando recuperación...')
      await performAutoRecovery()
    }
  }
  
  // Configurar monitoreo automático
  useEffect(() => {
    if (!user?.uid) return
    
    // Validación inicial
    monitorDataIntegrity()
    
    // Configurar monitoreo periódico (cada 2 minutos)
    recoveryIntervalRef.current = setInterval(() => {
      monitorDataIntegrity()
    }, 2 * 60 * 1000) as unknown as number
    
    // Escuchar eventos de error de datos
    const handleDataError = () => {
      console.warn('🚨 Error de datos detectado, iniciando recuperación...')
      performAutoRecovery()
    }
    
    // Escuchar eventos de pérdida de conexión
    const handleOffline = () => {
      console.log('📱 Modo offline detectado, validando datos locales...')
      monitorDataIntegrity()
    }
    
    window.addEventListener('dataError', handleDataError)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', () => monitorDataIntegrity())
    
    return () => {
      if (recoveryIntervalRef.current) {
        clearInterval(recoveryIntervalRef.current)
      }
      window.removeEventListener('dataError', handleDataError)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', () => monitorDataIntegrity())
    }
  }, [user?.uid])
  
  // Este componente no renderiza nada, solo monitorea en segundo plano
  return null
}

// Hook para usar el sistema de recuperación
export function useDataRecovery() {
  const { user } = useAuth()
  
  const triggerRecovery = async (): Promise<void> => {
    if (!user?.uid) return
    
    // Disparar evento de error de datos para activar la recuperación
    window.dispatchEvent(new CustomEvent('dataError', {
      detail: { userId: user.uid, timestamp: Date.now() }
    }))
  }
  
  const validateData = async (): Promise<boolean> => {
    if (!user?.uid) return false
    
    try {
      const ultraPersistence = await getUltraPersistence()
      if (!ultraPersistence) {
        return false
      }
      const data = await ultraPersistence.loadProfile()
      return !!data && !!data.id && (!!data.name || !!data.displayName)
    } catch {
      return false
    }
  }
  
  return {
    triggerRecovery,
    validateData
  }
}