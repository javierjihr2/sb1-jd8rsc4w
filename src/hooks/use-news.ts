import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore, useAppStore } from '../store'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useEffect, useState } from 'react'
import type { NewsArticle } from '../lib/types'
import { getNewsArticles, likeNewsArticle } from '../lib/database'

const functions = getFunctions()

// Query Keys
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: string) => [...newsKeys.lists(), { filters }] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const
}

// Hook para obtener noticias
export function useNews(category?: string, limitCount = 20) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedArticles = await getNewsArticles(limitCount, category)
        setArticles(fetchedArticles)
      } catch (err) {
        setError(err as Error)
        console.error('Error loading articles:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadArticles()
  }, [category, limitCount])

  return {
    data: articles,
    isLoading,
    error,
    refetch: () => {
      const loadArticles = async () => {
        try {
          setIsLoading(true)
          const fetchedArticles = await getNewsArticles(limitCount, category)
          setArticles(fetchedArticles)
        } catch (err) {
          setError(err as Error)
        } finally {
          setIsLoading(false)
        }
      }
      loadArticles()
    }
  }
}

// Hook para dar like a un artículo
export function useLikeArticle() {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { isOnline, addPendingOperation } = useAppStore()

  return useMutation({
    mutationFn: async (articleId: string) => {
      if (!user) throw new Error('Usuario no autenticado')
      
      const result = await likeNewsArticle(articleId, user.uid)
      if (!result.success) {
        throw new Error('Error al dar like al artículo')
      }
      return result
    },
    onMutate: async (articleId) => {
      if (!isOnline) {
        addPendingOperation({
          id: `like-article-${articleId}-${Date.now()}`,
          type: 'likeArticle',
          data: { articleId },
          timestamp: Date.now()
        })
      }
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con noticias
      queryClient.invalidateQueries({ queryKey: newsKeys.all })
    }
  })
}

// Hook para obtener un artículo específico
export function useNewsArticle(articleId: string) {
  return useQuery({
    queryKey: newsKeys.detail(articleId),
    queryFn: async () => {
      // Aquí podrías implementar una función para obtener un artículo específico
      // Por ahora, retornamos null ya que no existe esa función en database.ts
      return null
    },
    enabled: !!articleId
  })
}