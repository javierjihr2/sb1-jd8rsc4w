import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore, useTournamentsStore, useAppStore } from '../store'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Tournament } from '../lib/types'
import { useEffect, useState } from 'react'

const functions = getFunctions()

// Query Keys
export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (filters: string) => [...tournamentKeys.lists(), { filters }] as const,
  details: () => [...tournamentKeys.all, 'detail'] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
  userTournaments: (userId: string) => [...tournamentKeys.all, 'user', userId] as const
}

// Hook para obtener torneos
export function useTournaments() {
  const { user } = useUserStore()
  const { tournaments, setTournaments } = useTournamentsStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Suscripción en tiempo real a los torneos
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(tournamentsQuery, 
      (snapshot) => {
        try {
          const newTournaments: Tournament[] = []
          snapshot.forEach((doc) => {
            newTournaments.push({ id: doc.id, ...doc.data() } as Tournament)
          })
          setTournaments(newTournaments)
          setIsLoading(false)
          setError(null)
        } catch (err) {
          console.error('Error processing tournaments:', err)
          setError('Error al cargar torneos')
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Error in tournaments subscription:', err)
        setError('Error de conexión')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user, setTournaments])

  return {
    tournaments,
    isLoading,
    error
  }
}

// Hook para crear torneo
export function useCreateTournament() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { addTournament } = useTournamentsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (data: {
      name: string
      description: string
      game: string
      maxParticipants: number
      entryFee: number
      prizePool: number
      startDate: Date
      rules: string
    }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const createTournament = httpsCallable(functions, 'createTournament')
      const result = await createTournament(data)
      return result.data as Tournament
    },
    onMutate: async (data) => {
      // Optimistic update
      const tempTournament: Tournament = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description || '',
        date: new Date().toISOString().split('T')[0],
        prize: data.prizePool.toString(),
        mode: 'Escuadra' as const,
        region: 'S.A.' as const,
        type: 'Competitivo' as const,
        creatorId: user?.uid || '',
        creatorName: user?.displayName || 'Usuario',
        status: 'Próximamente',
        createdAt: new Date().toISOString()
      }
      
      addTournament(tempTournament)
      
      if (!isOnline) {
        addPendingOperation({
          id: tempTournament.id,
          type: 'createTournament',
          data,
          timestamp: Date.now()
        })
      }
      
      return { tempTournament }
    },
    onSuccess: (newTournament, variables, context) => {
      // Reemplazar el torneo temporal con el real
      if (context?.tempTournament) {
        const { tournaments, setTournaments } = useTournamentsStore.getState()
        const updatedTournaments = tournaments.map(t => 
          t.id === context.tempTournament.id ? newTournament : t
        )
        setTournaments(updatedTournaments)
      }
      queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() })
    },
    onError: (error, variables, context) => {
      // Revertir optimistic update en caso de error
      if (context?.tempTournament) {
        const { tournaments, setTournaments } = useTournamentsStore.getState()
        const updatedTournaments = tournaments.filter(t => t.id !== context.tempTournament.id)
        setTournaments(updatedTournaments)
      }
    }
  })
}

// Hook para unirse a torneo
export function useJoinTournament() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { joinTournament, updateTournament } = useTournamentsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const joinTournamentFn = httpsCallable(functions, 'joinTournament')
      const result = await joinTournamentFn({ tournamentId })
      return result.data
    },
    onMutate: async (tournamentId) => {
      if (!user) return
      
      // Optimistic update
      joinTournament(tournamentId)
      
      const { tournaments } = useTournamentsStore.getState()
      const tournament = tournaments.find(t => t.id === tournamentId)
      if (tournament) {
        updateTournament(tournamentId, {
          registeredTeams: (tournament.registeredTeams || 0) + 1
        })
      }
      
      if (!isOnline) {
        addPendingOperation({
          id: `join-${tournamentId}-${Date.now()}`,
          type: 'joinTournament',
          data: { tournamentId },
          timestamp: Date.now()
        })
      }
      
      return { tournamentId, userId: user.uid }
    },
    onSuccess: (data, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) })
      queryClient.invalidateQueries({ queryKey: tournamentKeys.userTournaments(user?.uid || '') })
    },
    onError: (error, tournamentId, context) => {
      // Revertir optimistic update
      if (context?.userId) {
        const { leaveTournament, tournaments, updateTournament } = useTournamentsStore.getState()
        leaveTournament(tournamentId)
        
        const tournament = tournaments.find(t => t.id === tournamentId)
        if (tournament) {
          updateTournament(tournamentId, {
            registeredTeams: Math.max(0, (tournament.registeredTeams || 0) - 1)
          })
        }
      }
    }
  })
}

// Hook para reportar resultado de match
export function useReportMatch() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (data: {
      tournamentId: string
      matchId: string
      winnerId: string
      loserId: string
      score: string
      evidence?: string
    }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const reportMatch = httpsCallable(functions, 'reportMatch')
      const result = await reportMatch(data)
      return result.data
    },
    onMutate: async (data) => {
      if (!isOnline) {
        addPendingOperation({
          id: `report-${data.matchId}-${Date.now()}`,
          type: 'reportMatch',
          data,
          timestamp: Date.now()
        })
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(variables.tournamentId) })
    }
  })
}

// Hook para verificar resultado de match
export function useVerifyMatch() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  return useMutation({
    mutationFn: async (data: {
      tournamentId: string
      matchId: string
      verified: boolean
    }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const verifyMatch = httpsCallable(functions, 'verifyMatch')
      const result = await verifyMatch(data)
      return result.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(variables.tournamentId) })
    }
  })
}

// Hook para obtener torneos del usuario
export function useUserTournaments() {
  const { user } = useUserStore()
  const { userTournaments } = useTournamentsStore()

  return useQuery({
    queryKey: tournamentKeys.userTournaments(user?.uid || ''),
    queryFn: async () => {
      if (!user) return []
      
      const userTournamentsQuery = query(
        collection(db, 'tournaments'),
        where('participants', 'array-contains', {
          userId: user.uid,
          username: user.displayName || 'Usuario',
          avatar: user.photoURL || '',
          joinedAt: new Date()
        })
      )
      
      return new Promise<Tournament[]>((resolve) => {
        const unsubscribe = onSnapshot(userTournamentsQuery, (snapshot) => {
          const tournaments: Tournament[] = []
          snapshot.forEach((doc) => {
            tournaments.push({ id: doc.id, ...doc.data() } as Tournament)
          })
          resolve(tournaments)
          unsubscribe()
        })
      })
    },
    enabled: !!user
  })
}