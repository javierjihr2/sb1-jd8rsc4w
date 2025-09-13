import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from 'firebase/auth'
import { FeedPost, Tournament, MatchmakingTicket } from '../lib/types'

interface UserState {
  user: User | null
  profile: any | null
  setUser: (user: User | null) => void
  setProfile: (profile: any) => void
  clearUser: () => void
}

interface PostsState {
  posts: FeedPost[]
  bookmarkedPosts: string[]
  setPosts: (posts: FeedPost[]) => void
  addPost: (post: FeedPost) => void
  updatePost: (postId: string, updates: Partial<FeedPost>) => void
  removePost: (postId: string) => void
  toggleBookmark: (postId: string) => void
  optimisticLike: (postId: string, userId: string) => void
  optimisticUnlike: (postId: string, userId: string) => void
}

interface TournamentsState {
  tournaments: Tournament[]
  userTournaments: string[]
  setTournaments: (tournaments: Tournament[]) => void
  addTournament: (tournament: Tournament) => void
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => void
  joinTournament: (tournamentId: string) => void
  leaveTournament: (tournamentId: string) => void
}

interface MatchmakingState {
  isSearching: boolean
  currentTicket: MatchmakingTicket | null
  preferences: {
    gameMode: string
    region: string
    rank: string
    language: string
    microphone: boolean
  }
  setSearching: (searching: boolean) => void
  setCurrentTicket: (ticket: MatchmakingTicket | null) => void
  updatePreferences: (preferences: Partial<MatchmakingState['preferences']>) => void
}

interface AppState {
  isOnline: boolean
  pendingOperations: any[]
  setOnline: (online: boolean) => void
  addPendingOperation: (operation: any) => void
  removePendingOperation: (operationId: string) => void
  clearPendingOperations: () => void
}

// User Store
export const useUserStore = create<UserState>()(persist(
  (set) => ({
    user: null,
    profile: null,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    clearUser: () => set({ user: null, profile: null })
  }),
  {
    name: 'user-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ profile: state.profile })
  }
))

// Posts Store
export const usePostsStore = create<PostsState>()(persist(
  (set) => ({
    posts: [],
    bookmarkedPosts: [],
    setPosts: (posts) => set({ posts }),
    addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
    updatePost: (postId, updates) => set((state) => ({
      posts: state.posts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    })),
    removePost: (postId) => set((state) => ({
      posts: state.posts.filter(post => post.id !== postId)
    })),
    toggleBookmark: (postId) => set((state) => ({
      bookmarkedPosts: state.bookmarkedPosts.includes(postId)
        ? state.bookmarkedPosts.filter(id => id !== postId)
        : [...state.bookmarkedPosts, postId]
    })),
    optimisticLike: (postId, userId) => set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          const newLikedBy = [...(post.likedBy || [])]
          if (!newLikedBy.includes(userId)) {
            newLikedBy.push(userId)
          }
          return { ...post, likedBy: newLikedBy, likes: (post.likes || 0) + 1 }
        }
        return post
      })
    })),
    optimisticUnlike: (postId, userId) => set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          const newLikedBy = (post.likedBy || []).filter(id => id !== userId)
          return { ...post, likedBy: newLikedBy, likes: Math.max((post.likes || 0) - 1, 0) }
        }
        return post
      })
    }))
  }),
  {
    name: 'posts-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ bookmarkedPosts: state.bookmarkedPosts })
  }
))

// Tournaments Store
export const useTournamentsStore = create<TournamentsState>()(persist(
  (set) => ({
    tournaments: [],
    userTournaments: [],
    setTournaments: (tournaments) => set({ tournaments }),
    addTournament: (tournament) => set((state) => ({
      tournaments: [tournament, ...state.tournaments]
    })),
    updateTournament: (tournamentId, updates) => set((state) => ({
      tournaments: state.tournaments.map(tournament => 
        tournament.id === tournamentId ? { ...tournament, ...updates } : tournament
      )
    })),
    joinTournament: (tournamentId) => set((state) => ({
      userTournaments: [...state.userTournaments, tournamentId]
    })),
    leaveTournament: (tournamentId) => set((state) => ({
      userTournaments: state.userTournaments.filter(id => id !== tournamentId)
    }))
  }),
  {
    name: 'tournaments-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ userTournaments: state.userTournaments })
  }
))

// Matchmaking Store
export const useMatchmakingStore = create<MatchmakingState>()(persist(
  (set) => ({
    isSearching: false,
    currentTicket: null,
    preferences: {
      gameMode: 'classic',
      region: 'na',
      rank: 'bronze',
      language: 'es',
      microphone: true
    },
    setSearching: (searching) => set({ isSearching: searching }),
    setCurrentTicket: (ticket) => set({ currentTicket: ticket }),
    updatePreferences: (preferences) => set((state) => ({
      preferences: { ...state.preferences, ...preferences }
    }))
  }),
  {
    name: 'matchmaking-storage',
    storage: createJSONStorage(() => localStorage)
  }
))

// App Store
export const useAppStore = create<AppState>()(
  (set) => ({
    isOnline: true,
    pendingOperations: [],
    setOnline: (online) => set({ isOnline: online }),
    addPendingOperation: (operation) => set((state) => ({
      pendingOperations: [...state.pendingOperations, operation]
    })),
    removePendingOperation: (operationId) => set((state) => ({
      pendingOperations: state.pendingOperations.filter(op => op.id !== operationId)
    })),
    clearPendingOperations: () => set({ pendingOperations: [] })
  })
)