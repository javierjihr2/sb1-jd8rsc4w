"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Bookmark, Send, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { FeedPost as FeedPostType } from "@/lib/types"
import { useLikePost, useAddComment, useBookmarkPost } from "@/hooks/use-posts"
import { useUserStore, usePostsStore } from "@/store"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"

interface FeedPostProps {
  post: FeedPostType
}

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useUserStore()
  const { bookmarkedPosts } = usePostsStore()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  
  const likePostMutation = useLikePost()
  const addCommentMutation = useAddComment()
  const bookmarkPostMutation = useBookmarkPost()
  
  const isLiked = post.likedBy?.includes(user?.uid || '') || false
  const isBookmarked = bookmarkedPosts.includes(post.id)
  
  const handleLike = () => {
    if (!user) return
    likePostMutation.mutate({ postId: post.id, isLiked })
  }
  
  const handleBookmark = () => {
    if (!user) return
    bookmarkPostMutation.mutate({ postId: post.id, isBookmarked })
  }
  
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return
    
    try {
      await addCommentMutation.mutateAsync({ postId: post.id, content: newComment.trim() })
      setNewComment("")
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author.displayName || post.author.username}`,
          text: post.content,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-12 w-12 ring-2 ring-primary/10 hover:ring-primary/30 transition-all cursor-pointer">
                <AvatarImage src={post.author.avatar} alt={post.author.displayName || post.author.username} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.author.id}`} className="hover:underline">
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                  {post.author.displayName || post.author.username}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es }) : 'Hace un momento'}
              </p>
            </div>
          </div>
          
          {user?.uid === post.author.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Contenido del post */}
        <div className="mb-4">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          

        </div>
        
        {/* Imagen del post */}
        {post.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={600}
              height={400}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        {/* Estadísticas */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 px-1">
          <span>{post.likes || 0} me gusta</span>
          <span>{post.commentsList?.length || 0} comentarios</span>
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likePostMutation.isPending}
              className={cn(
                "flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 transition-colors",
                isLiked && "text-red-600 bg-red-50"
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              <span>Me gusta</span>
            </Button>
            
            <Dialog open={showComments} onOpenChange={setShowComments}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>Comentar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Comentarios</DialogTitle>
                </DialogHeader>
                
                {/* Lista de comentarios */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {post.commentsList && post.commentsList.length > 0 ? (
                    post.commentsList.map((comment) => (
                      <div key={comment.id} className="flex space-x-3 p-3 rounded-lg bg-muted/30">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar} alt={comment.author.displayName || comment.author.username} />
                          <AvatarFallback className="text-xs">
                            {(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{comment.author.displayName || comment.author.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es }) : 'Hace un momento'}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay comentarios aún</p>
                  )}
                </div>
                
                {/* Agregar comentario */}
                {user && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback className="text-xs">
                        {(user.displayName || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          <span>Comentar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span>Compartir</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkPostMutation.isPending}
            className={cn(
              "flex items-center space-x-2 hover:bg-yellow-50 hover:text-yellow-600 transition-colors",
              isBookmarked && "text-yellow-600 bg-yellow-50"
            )}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
            <span>Guardar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}