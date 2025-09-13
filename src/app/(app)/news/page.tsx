
"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Heart, MessageSquare, Calendar, Search, Filter } from 'lucide-react'
import { useAuth } from '@/app/auth-provider'
import { useRouter } from 'next/navigation'
import type { NewsArticle } from '@/lib/types'
import { useNews, useLikeArticle } from '@/hooks/use-news'

export default function NewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set())

  const categories = ['all', 'eSports', 'Updates', 'Events', 'Guides']

  // Usar hooks de React Query
  const { data: articles = [], isLoading: loading } = useNews(
    selectedCategory === 'all' ? undefined : selectedCategory,
    20
  )
  const likeArticleMutation = useLikeArticle()

  const handleLike = async (articleId: string) => {
    if (!user) return
    
    try {
      await likeArticleMutation.mutateAsync(articleId)
      
      // Actualizar estado local
      setLikedArticles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(articleId)) {
          newSet.delete(articleId)
        } else {
          newSet.add(articleId)
        }
        return newSet
      })
    } catch (error) {
      console.error('Error liking article:', error)
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleReadMore = (articleId: string) => {
    router.push(`/news/${articleId}`)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Noticias y Actualizaciones
        </h1>
        <p className="text-muted-foreground">
          Mantente al día con las últimas noticias del mundo gaming
        </p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Filter className="h-4 w-4 mt-3 text-muted-foreground" />
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category === 'all' ? 'Todas' : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Lista de artículos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">{article.category}</Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(article.date).toLocaleDateString()}</span>
                  {article.author && (
                    <>
                      <span>•</span>
                      <span>{article.author}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views || 0}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(article.id)
                      }}
                      className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                        likedArticles.has(article.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${likedArticles.has(article.id) ? 'fill-current' : ''}`} />
                      <span>{article.likes || 0}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{article.comments?.length || 0}</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReadMore(article.id)
                    }}
                  >
                    Leer más
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron artículos</p>
            <p className="text-sm">Intenta con otros términos de búsqueda o categoría</p>
          </div>
        </div>
      )}
    </div>
  )
}
