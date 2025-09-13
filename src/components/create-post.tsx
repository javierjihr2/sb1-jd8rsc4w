"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Image as ImageIcon, Hash, X, Send, Loader2 } from "lucide-react"
import { useCreatePost } from "@/hooks/use-posts"
import { useUserStore } from "@/store"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface CreatePostProps {
  className?: string
}

export function CreatePost({ className }: CreatePostProps) {
  const { user } = useUserStore()
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const createPostMutation = useCreatePost()
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  const handleSubmit = async () => {
    if (!user || (!content.trim() && !imageFile)) return
    
    try {
      await createPostMutation.mutateAsync({
        content: content.trim(),
        imageUrl: imagePreview || undefined,
        tags
      })
      
      // Reset form
      setContent("")
      setTags([])
      setNewTag("")
      removeImage()
      setShowDialog(false)
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }
  
  const isSubmitDisabled = !content.trim() && !imageFile
  
  if (!user) {
    return null
  }
  
  return (
    <>
      {/* Trigger compacto para el feed */}
      <Card className={cn("w-full max-w-2xl mx-auto mb-6 shadow-sm hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {(user.displayName || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setShowDialog(true)}
            >
              ¿Qué estás pensando, {user.displayName?.split(' ')[0] || 'Usuario'}?
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Hash className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog para crear post */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {(user.displayName || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user.displayName || 'Usuario'}</h3>
                <p className="text-sm text-muted-foreground">Crear publicación</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Textarea para contenido */}
            <Textarea
              placeholder="¿Qué estás pensando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-none shadow-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
              maxLength={2000}
            />
            
            {/* Preview de imagen */}
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover max-h-96"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Input para agregar tags */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Agregar etiqueta"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  className="pl-10"
                  maxLength={20}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 5}
              >
                Agregar
              </Button>
            </div>
            
            {tags.length >= 5 && (
              <p className="text-sm text-muted-foreground">Máximo 5 etiquetas permitidas</p>
            )}
            
            {/* Contador de caracteres */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{content.length}/2000 caracteres</span>
              {content.length > 1800 && (
                <span className="text-orange-500">Límite próximo</span>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
                >
                  <Camera className="h-5 w-5" />
                  <span>Foto</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={createPostMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled || createPostMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>{createPostMutation.isPending ? 'Publicando...' : 'Publicar'}</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}