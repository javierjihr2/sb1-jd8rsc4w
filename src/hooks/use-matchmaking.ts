import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore, useMatchmakingStore, useAppStore } from '../store'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { MatchmakingTicket } from '../lib/types'
import { useEffect, useState } from 'react'

const functions = getFunctions()

// Query Keys
export const matchmakingKeys = {
  all: ['matchmaking'] as const,
  tickets: () => [...matchmakingKeys.all, 'tickets'] as const,
  ticket: (id: string) => [...matchmakingKeys.tickets(), id] as const,
  userTicket: (userId: string) => [...matchmakingKeys.all, 'user', userId] as const
}

// Hook para iniciar matchmaking
export function useStartMatchmaking() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { setSearching, setCurrentTicket, preferences } = useMatchmakingStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const startMatchmaking = httpsCallable(functions, 'startMatchmaking')
      const result = await startMatchmaking({
        gameMode: preferences.gameMode,
        region: preferences.region,
        rank: preferences.rank,
        language: preferences.language,
        microphone: preferences.microphone
      })
      return result.data as MatchmakingTicket
    },
    onMutate: async () => {
      // Optimistic update
      setSearching(true)
      
      const tempTicket: MatchmakingTicket = {
        id: `temp-${Date.now()}`,
        userId: user?.uid || '',
        username: user?.displayName || 'Usuario',
        gameMode: preferences.gameMode,
        region: preferences.region,
        rank: preferences.rank,
        language: preferences.language,
        microphone: preferences.microphone,
        status: 'searching',
        createdAt: new Date(),
        estimatedWaitTime: 120 // 2 minutos estimado
      }
      
      setCurrentTicket(tempTicket)
      
      if (!isOnline) {
        addPendingOperation({
          id: tempTicket.id,
          type: 'startMatchmaking',
          data: preferences,
          timestamp: Date.now()
        })
      }
      
      return { tempTicket }
    },
    onSuccess: (newTicket, variables, context) => {
      // Reemplazar el ticket temporal con el real
      setCurrentTicket(newTicket)
      queryClient.invalidateQueries({ queryKey: matchmakingKeys.userTicket(user?.uid || '') })
    },
    onError: (error, variables, context) => {
      // Revertir optimistic update en caso de error
      setSearching(false)
      setCurrentTicket(null)
    }
  })
}

// Hook para cancelar matchmaking
export function useCancelMatchmaking() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { setSearching, setCurrentTicket, currentTicket } = useMatchmakingStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async () => {
      if (!user || !currentTicket) throw new Error('No hay ticket activo')
      
      const cancelMatchmaking = httpsCallable(functions, 'cancelMatchmaking')
      const result = await cancelMatchmaking({ ticketId: currentTicket.id })
      return result.data
    },
    onMutate: async () => {
      // Optimistic update
      setSearching(false)
      const previousTicket = currentTicket
      setCurrentTicket(null)
      
      if (!isOnline && previousTicket) {
        addPendingOperation({
          id: `cancel-${previousTicket.id}-${Date.now()}`,
          type: 'cancelMatchmaking',
          data: { ticketId: previousTicket.id },
          timestamp: Date.now()
        })
      }
      
      return { previousTicket }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchmakingKeys.userTicket(user?.uid || '') })
    },
    onError: (error, variables, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousTicket) {
        setSearching(true)
        setCurrentTicket(context.previousTicket)
      }
    }
  })
}

// Hook para monitorear el estado del matchmaking
export function useMatchmakingStatus() {
  const { user } = useUserStore()
  const { currentTicket, setCurrentTicket, setSearching } = useMatchmakingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suscripción en tiempo real al ticket del usuario
  useEffect(() => {
    if (!user || !currentTicket) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const ticketRef = doc(db, 'matchmakingTickets', currentTicket.id)
    
    const unsubscribe = onSnapshot(ticketRef, 
      (doc) => {
        try {
          if (doc.exists()) {
            const ticketData = { id: doc.id, ...doc.data() } as MatchmakingTicket
            setCurrentTicket(ticketData)
            
            // Si el ticket fue emparejado o cancelado, detener la búsqueda
            if (ticketData.status === 'matched' || ticketData.status === 'cancelled') {
              setSearching(false)
            }
          } else {
            // El ticket fue eliminado
            setCurrentTicket(null)
            setSearching(false)
          }
          setIsLoading(false)
          setError(null)
        } catch (err) {
          console.error('Error processing matchmaking status:', err)
          setError('Error al obtener estado de matchmaking')
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Error in matchmaking subscription:', err)
        setError('Error de conexión')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user, currentTicket?.id, setCurrentTicket, setSearching])

  return {
    currentTicket,
    isSearching: useMatchmakingStore(state => state.isSearching),
    isLoading,
    error
  }
}

// Hook para obtener el historial de matches
export function useMatchHistory() {
  const { user } = useUserStore()

  return useQuery({
    queryKey: ['matchHistory', user?.uid],
    queryFn: async () => {
      if (!user) return []
      
      const historyQuery = query(
        collection(db, 'matchHistory'),
        where('participants', 'array-contains', user.uid)
      )
      
      return new Promise<any[]>((resolve) => {
        const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
          const matches: any[] = []
          snapshot.forEach((doc) => {
            matches.push({ id: doc.id, ...doc.data() })
          })
          resolve(matches.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()))
          unsubscribe()
        })
      })
    },
    enabled: !!user
  })
}

// Hook para actualizar preferencias de matchmaking
export function useUpdateMatchmakingPreferences() {
  const { updatePreferences } = useMatchmakingStore()

  return {
    updatePreferences: (newPreferences: Partial<{
      gameMode: string
      region: string
      rank: string
      language: string
      microphone: boolean
    }>) => {
      updatePreferences(newPreferences)
    }
  }
}

// Hook para obtener estadísticas de matchmaking
export function useMatchmakingStats() {
  const { user } = useUserStore()

  return useQuery({
    queryKey: ['matchmakingStats', user?.uid],
    queryFn: async () => {
      if (!user) return null
      
      // Obtener estadísticas del usuario desde Firestore
      const statsQuery = query(
        collection(db, 'userStats'),
        where('userId', '==', user.uid)
      )
      
      return new Promise<any>((resolve) => {
        const unsubscribe = onSnapshot(statsQuery, (snapshot) => {
          let stats = null
          snapshot.forEach((doc) => {
            stats = { id: doc.id, ...doc.data() }
          })
          resolve(stats)
          unsubscribe()
        })
      })
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}