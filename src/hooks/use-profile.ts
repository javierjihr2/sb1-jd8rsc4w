import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore, useAppStore } from '../store'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEffect, useState } from 'react'

const functions = getFunctions()

// Query Keys
export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
  stats: (userId: string) => [...profileKeys.all, 'stats', userId] as const
}

// Hook para obtener perfil de usuario
export function useUserProfile(userId?: string) {
  const { user, profile, setProfile } = useUserStore()
  const targetUserId = userId || user?.uid
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)

  // Suscripción en tiempo real al perfil del usuario
  useEffect(() => {
    if (!targetUserId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const profileRef = doc(db, 'users', targetUserId)
    
    const unsubscribe = onSnapshot(profileRef, 
      (doc) => {
        try {
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() }
            if (targetUserId === user?.uid) {
              setProfile(data)
            }
            setProfileData(data)
          } else {
            setProfileData(null)
          }
          setIsLoading(false)
          setError(null)
        } catch (err) {
          console.error('Error processing profile:', err)
          setError('Error al cargar perfil')
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Error in profile subscription:', err)
        setError('Error de conexión')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [targetUserId, user?.uid, setProfile])

  return {
    profile: targetUserId === user?.uid ? profile : profileData,
    isLoading,
    error
  }
}

// Hook para actualizar perfil de usuario
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, setProfile } = useUserStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (data: {
      displayName?: string
      bio?: string
      location?: string
      favoriteGames?: string[]
      socialLinks?: {
        discord?: string
        twitch?: string
        youtube?: string
        instagram?: string
      }
      gameStats?: {
        pubgm?: {
          rank: string
          tier: string
          kd: number
          winRate: number
          favoriteMode: string
        }
        freefire?: {
          rank: string
          tier: string
          kd: number
          winRate: number
        }
      }
      preferences?: {
        language: string
        region: string
        playstyle: string
        availability: string[]
      }
    }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const updateUserProfile = httpsCallable(functions, 'updateUserProfile')
      const result = await updateUserProfile(data)
      return result.data
    },
    onMutate: async (data) => {
      if (!user) return
      
      // Optimistic update
      const { profile } = useUserStore.getState()
      const updatedProfile = { ...profile, ...data }
      setProfile(updatedProfile)
      
      if (!isOnline) {
        addPendingOperation({
          id: `updateProfile-${Date.now()}`,
          type: 'updateUserProfile',
          data,
          timestamp: Date.now()
        })
      }
      
      return { previousProfile: profile, updatedProfile }
    },
    onSuccess: (result, variables, context) => {
      // Actualizar con los datos del servidor
      if (result) {
        setProfile(result)
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.user(user?.uid || '') })
    },
    onError: (error, variables, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousProfile) {
        setProfile(context.previousProfile)
      }
    }
  })
}

// Hook para obtener estadísticas del usuario
export function useUserStats(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.uid

  return useQuery({
    queryKey: profileKeys.stats(targetUserId || ''),
    queryFn: async () => {
      if (!targetUserId) return null
      
      const statsRef = doc(db, 'userStats', targetUserId)
      
      return new Promise<any>((resolve) => {
        const unsubscribe = onSnapshot(statsRef, (doc) => {
          if (doc.exists()) {
            resolve({ id: doc.id, ...doc.data() })
          } else {
            resolve(null)
          }
          unsubscribe()
        })
      })
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}

// Hook para obtener logros del usuario
export function useUserAchievements(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.uid

  return useQuery({
    queryKey: ['achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []
      
      const achievementsRef = doc(db, 'userAchievements', targetUserId)
      
      return new Promise<any[]>((resolve) => {
        const unsubscribe = onSnapshot(achievementsRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            resolve(data.achievements || [])
          } else {
            resolve([])
          }
          unsubscribe()
        })
      })
    },
    enabled: !!targetUserId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  })
}

// Hook para subir avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { user, setProfile } = useUserStore()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('avatar', file)
      
      // Llamar a la función para subir avatar
      const uploadAvatar = httpsCallable(functions, 'uploadAvatar')
      const result = await uploadAvatar({ 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
      
      return result.data
    },
    onSuccess: (result) => {
      // Actualizar el perfil con la nueva URL del avatar
      const { profile } = useUserStore.getState()
      const uploadResult = result as { avatarUrl?: string }
      if (uploadResult.avatarUrl) {
        setProfile({ ...profile, photoURL: uploadResult.avatarUrl })
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.user(user?.uid || '') })
    }
  })
}

// Hook para obtener actividad reciente del usuario
export function useUserActivity(userId?: string) {
  const { user } = useUserStore()
  const targetUserId = userId || user?.uid

  return useQuery({
    queryKey: ['userActivity', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []
      
      const activityRef = doc(db, 'userActivity', targetUserId)
      
      return new Promise<any[]>((resolve) => {
        const unsubscribe = onSnapshot(activityRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            resolve(data.activities || [])
          } else {
            resolve([])
          }
          unsubscribe()
        })
      })
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000 // 2 minutos
  })
}