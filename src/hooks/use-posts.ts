import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore, usePostsStore, useAppStore } from '../store'
import { createFeedPost, likeFeedPost, unlikeFeedPost, addCommentToPost as addComment, addBookmark, removeBookmark } from '../lib/database'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { FeedPost, Comment } from '../lib/types'
import { useEffect, useState } from 'react'

const functions = getFunctions()

// Query Keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  comments: (postId: string) => [...postKeys.detail(postId), 'comments'] as const
}

// Hooks para Posts
export function usePosts() {
  const { user } = useUserStore()
  const { posts, setPosts } = usePostsStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Suscripción en tiempo real a los posts
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const postsQuery = query(
      collection(db, 'feedPosts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(postsQuery, 
      (snapshot) => {
        try {
          const newPosts: FeedPost[] = []
          snapshot.forEach((doc) => {
            newPosts.push({ id: doc.id, ...doc.data() } as FeedPost)
          })
          setPosts(newPosts)
          setIsLoading(false)
          setError(null)
        } catch (err) {
          console.error('Error processing posts:', err)
          setError('Error al cargar publicaciones')
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Error in posts subscription:', err)
        setError('Error de conexión')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user, setPosts])

  return {
    posts,
    isLoading,
    error
  }
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { addPost } = usePostsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (data: { content: string; imageUrl?: string; tags?: string[] }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const createPost = httpsCallable(functions, 'createPost')
      const result = await createPost(data)
      return result.data as FeedPost
    },
    onMutate: async (data) => {
      // Optimistic update
      const tempPost: FeedPost = {
        id: `temp-${Date.now()}`,
        author: {
          id: user?.uid || '',
          displayName: user?.displayName || 'Usuario',
          username: user?.displayName || 'usuario',
          avatarUrl: user?.photoURL || '',
          bio: '',
          region: 'US',
          language: 'es',
          mic: false,
          roles: ['Jugador'],
          rankTier: 'Bronce',
          stats: { kda: 0, wins: 0, matches: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          name: user?.displayName || 'Usuario',
          email: user?.email || '',
          level: 1
        },
        timestamp: new Date().toISOString(),
        content: data.content,
        imageUrl: data.imageUrl,
        likes: 0,
        comments: 0,
        shares: 0,
        commentsList: [],
        likedBy: [],
        sharedBy: [],
        interactions: [],
        createdAt: new Date().toISOString()
      }
      
      addPost(tempPost)
      
      if (!isOnline) {
        addPendingOperation({
          id: tempPost.id,
          type: 'createPost',
          data,
          timestamp: Date.now()
        })
      }
      
      return { tempPost }
    },
    onSuccess: (newPost, variables, context) => {
      // Reemplazar el post temporal con el real
      if (context?.tempPost) {
        const { updatePost, removePost } = usePostsStore.getState()
        removePost(context.tempPost.id)
        addPost(newPost)
      }
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
    onError: (error, variables, context) => {
      // Revertir optimistic update en caso de error
      if (context?.tempPost) {
        const { removePost } = usePostsStore.getState()
        removePost(context.tempPost.id)
      }
    }
  })
}

export function useLikePost() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { optimisticLike, optimisticUnlike } = usePostsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const toggleLike = httpsCallable(functions, 'toggleLike')
      const result = await toggleLike({ postId })
      return result.data
    },
    onMutate: async ({ postId, isLiked }) => {
      if (!user) return
      
      // Optimistic update
      if (isLiked) {
        optimisticUnlike(postId, user.uid)
      } else {
        optimisticLike(postId, user.uid)
      }
      
      if (!isOnline) {
        addPendingOperation({
          id: `like-${postId}-${Date.now()}`,
          type: 'toggleLike',
          data: { postId },
          timestamp: Date.now()
        })
      }
      
      return { postId, isLiked, userId: user.uid }
    },
    onError: (error, { postId, isLiked }, context) => {
      // Revertir optimistic update
      if (context?.userId) {
        if (isLiked) {
          optimisticLike(postId, context.userId)
        } else {
          optimisticUnlike(postId, context.userId)
        }
      }
    }
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { updatePost } = usePostsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const addCommentFn = httpsCallable(functions, 'addComment')
      const result = await addCommentFn({ postId, content })
      return result.data as Comment
    },
    onMutate: async ({ postId, content }) => {
      if (!user) return
      
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        postId,
        author: {
          id: user.uid,
          displayName: user.displayName || 'Usuario',
          username: user.displayName || 'usuario',
          avatarUrl: user.photoURL || '',
          bio: '',
          region: 'US',
          language: 'es',
          mic: false,
          roles: ['Jugador'],
          rankTier: 'Bronce',
          stats: { kda: 0, wins: 0, matches: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          name: user.displayName || 'Usuario',
          email: user.email || '',
          level: 1
        },
        text: content,
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      }
      
      // Optimistic update
      const { posts } = usePostsStore.getState()
      const post = posts.find(p => p.id === postId)
      if (post) {
        updatePost(postId, {
          commentsList: [...(post.commentsList || []), tempComment],
          comments: (post.comments || 0) + 1
        })
      }
      
      if (!isOnline) {
        addPendingOperation({
          id: tempComment.id,
          type: 'addComment',
          data: { postId, content },
          timestamp: Date.now()
        })
      }
      
      return { tempComment, postId }
    },
    onSuccess: (newComment, { postId }, context) => {
      // Reemplazar comentario temporal con el real
      if (context?.tempComment) {
        const { posts } = usePostsStore.getState()
        const post = posts.find(p => p.id === postId)
        if (post) {
          const updatedComments = post.commentsList?.map(comment => 
            comment.id === context.tempComment.id ? newComment : comment
          ) || []
          updatePost(postId, { commentsList: updatedComments })
        }
      }
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) })
    },
    onError: (error, { postId }, context) => {
      // Revertir optimistic update
      if (context?.tempComment) {
        const { posts } = usePostsStore.getState()
        const post = posts.find(p => p.id === postId)
        if (post) {
          const updatedComments = post.commentsList?.filter(comment => 
            comment.id !== context.tempComment.id
          ) || []
          updatePost(postId, {
            commentsList: updatedComments,
            comments: Math.max(0, (post.comments || 0) - 1)
          })
        }
      }
    }
  })
}

export function useBookmarkPost() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { toggleBookmark } = usePostsStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const bookmarkPost = httpsCallable(functions, isBookmarked ? 'unbookmarkPost' : 'bookmarkPost')
      const result = await bookmarkPost({ postId })
      return result.data
    },
    onMutate: async ({ postId, isBookmarked }) => {
      // Optimistic update
      toggleBookmark(postId)
      
      if (!isOnline) {
        addPendingOperation({
          id: `bookmark-${postId}-${Date.now()}`,
          type: isBookmarked ? 'unbookmarkPost' : 'bookmarkPost',
          data: { postId },
          timestamp: Date.now()
        })
      }
      
      return { postId, isBookmarked }
    },
    onError: (error, { postId }, context) => {
      // Revertir optimistic update
      toggleBookmark(postId)
    }
  })
}