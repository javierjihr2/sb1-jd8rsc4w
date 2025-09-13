"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/auth-provider"
import { Send, ImageIcon, Sticker, X, Smile, Camera, Upload, BarChart3, Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { createFeedPost } from "@/lib/database"
import type { FeedPost, Poll, PollOption, PlayerProfile } from "@/lib/types"

interface CreatePostDialogProps {
  onPostCreated?: (post: FeedPost) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
  "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
  "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
  "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾",
  "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿",
  "😾", "🔥", "💯", "💪", "👍", "👎", "👌", "✌️", "🤞", "🤟",
  "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚",
  "🖐", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💅",
  "🎮", "🕹️", "🎯", "🎲", "🎪", "🎨", "🎭", "🎪", "🎨", "🎭"
]

const stickers = [
  { id: 1, emoji: "🎮", label: "Gaming" },
  { id: 2, emoji: "🏆", label: "Victory" },
  { id: 3, emoji: "💪", label: "Strong" },
  { id: 4, emoji: "🔥", label: "Fire" },
  { id: 5, emoji: "⚡", label: "Lightning" },
  { id: 6, emoji: "💯", label: "Perfect" },
  { id: 7, emoji: "🎯", label: "Target" },
  { id: 8, emoji: "🚀", label: "Rocket" },
  { id: 9, emoji: "💎", label: "Diamond" },
  { id: 10, emoji: "👑", label: "Crown" },
  { id: 11, emoji: "🎊", label: "Party" },
  { id: 12, emoji: "🌟", label: "Star" },
  { id: 13, emoji: "💥", label: "Boom" },
  { id: 14, emoji: "🎪", label: "Fun" },
  { id: 15, emoji: "🎨", label: "Art" },
  { id: 16, emoji: "🎭", label: "Drama" }
]

export function CreatePostDialog({ onPostCreated, trigger, open, onOpenChange }: CreatePostDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<PlayerProfile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timeoutRef = useRef<number | null>(null)

  // Load current profile from localStorage
  useEffect(() => {
    const loadProfile = () => {
      if (!user?.uid) return
      
      // Try to load from multiple sources for maximum reliability
      const keys = [
        `profile_${user.uid}`,
        `profile_backup_${user.uid}`,
        `pending_profile_${user.uid}`,
        'currentProfile' // Legacy fallback
      ]
      
      let mostRecentProfile = null
      let mostRecentTimestamp = 0
      
      for (const key of keys) {
        try {
          const saved = localStorage.getItem(key)
          if (saved) {
            const profile = JSON.parse(saved)
            const timestamp = profile.lastModified || profile.lastUpdate || 0
            if (timestamp > mostRecentTimestamp) {
              mostRecentTimestamp = timestamp
              mostRecentProfile = profile
            }
          }
        } catch (error) {
          console.warn(`Error loading profile from ${key}:`, error)
        }
      }
      
      if (mostRecentProfile) {
        setCurrentProfile(mostRecentProfile)
      }
    }
    
    loadProfile()
    
    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.uid && (e.key === `profile_${user.uid}` || e.key === 'currentProfile')) {
        loadProfile()
      }
    }
    
    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId } = event.detail || {}
      if (userId === user?.uid) {
        loadProfile()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [user?.uid])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 10MB.",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      
      // Set cursor position after emoji
      timeoutRef.current = setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0) as unknown as number
    } else {
      setContent(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleStickerSelect = (sticker: typeof stickers[0]) => {
    handleEmojiSelect(sticker.emoji)
    setShowStickerPicker(false)
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ''])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) {
      toast({
        title: "Error",
        description: "La encuesta debe tener una pregunta y al menos 2 opciones.",
        variant: "destructive"
      })
      return
    }

    const pollData: Poll = {
      id: `poll_${Date.now()}`,
      question: pollQuestion.trim(),
      options: pollOptions
        .filter(opt => opt.trim())
        .map((opt, index) => ({
          id: `option_${index}`,
          text: opt.trim(),
          votes: 0,
          votedBy: []
        })),
      totalVotes: 0,
      allowMultiple: allowMultipleVotes
    }

    setPoll(pollData)
    setShowPollCreator(false)
  }

  const removePoll = () => {
    setPoll(null)
    setPollQuestion('')
    setPollOptions(['', ''])
    setAllowMultipleVotes(false)
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear una publicación.",
        variant: "destructive"
      })
      return
    }

    if (!content.trim() && !selectedImage && !poll) {
      toast({
        title: "Error",
        description: "Escribe algo, agrega una imagen o crea una encuesta para publicar.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const postData = {
        author: {
          id: user.uid,
          displayName: currentProfile?.displayName || user.displayName || 'Usuario',
          username: currentProfile?.username || user.displayName || 'usuario',
          avatarUrl: currentProfile?.avatarUrl || user.photoURL || '',
          bio: currentProfile?.bio || '',
          region: currentProfile?.region || 'US',
          language: currentProfile?.language || 'es',
          mic: currentProfile?.mic || false,
          roles: currentProfile?.roles || ['Jugador'],
          rankTier: currentProfile?.rankTier || 'Bronce',
          stats: currentProfile?.stats || { kda: 0, wins: 0, matches: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          // Campos adicionales para compatibilidad
          name: currentProfile?.name || user.displayName || 'Usuario',
          email: user.email || '',
          level: currentProfile?.level || 1,
          rank: currentProfile?.rank || 'Bronce',
          countryCode: currentProfile?.countryCode || 'US',
          role: 'Jugador' as const,
          location: currentProfile?.location || { lat: 0, lon: 0 },
          favoriteWeapons: currentProfile?.favoriteWeapons || [],
          playSchedule: currentProfile?.playSchedule || 'Flexible',
          favoriteMap: currentProfile?.favoriteMap || 'Erangel'
        },
        content: content.trim(),
        imageUrl: selectedImage || undefined,
        poll: poll || undefined,
        timestamp: 'Ahora',
        likes: 0,
        comments: 0,
        shares: 0,
        commentsList: [],
        likedBy: [],
        sharedBy: [],
        interactions: []
      }

      const result = await createFeedPost(postData)
      
      if (result.success) {
        const newPost: FeedPost = {
          id: result.id!,
          ...postData
        }
        
        onPostCreated?.(newPost)
        
        toast({
          title: "¡Publicación creada!",
          description: "Tu publicación se ha compartido exitosamente."
        })
        
        // Reset form
        setContent("")
        setSelectedImage(null)
        removePoll()
        setIsOpen(false)
      } else {
        throw new Error("Error al crear la publicación")
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la publicación. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Crear Publicación
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Publicación</DialogTitle>
          <DialogDescription>
            Comparte tus logros, pensamientos o encuentra compañeros de equipo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="¿Qué estás pensando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {content.length}/500
            </div>
          </div>

          {selectedImage && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Image
                    src={selectedImage}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="w-full h-auto max-h-[300px] object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-10 gap-2 max-h-[200px] overflow-y-auto">
                  {emojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-muted"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sticker Picker */}
          {showStickerPicker && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto">
                  {stickers.map((sticker) => (
                    <Button
                      key={sticker.id}
                      variant="ghost"
                      className="h-16 flex flex-col gap-1 hover:bg-muted"
                      onClick={() => handleStickerSelect(sticker)}
                    >
                      <span className="text-2xl">{sticker.emoji}</span>
                      <span className="text-xs text-muted-foreground">{sticker.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Poll Creator */}
          {showPollCreator && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Crear Encuesta</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPollCreator(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Pregunta</label>
                    <Textarea
                      placeholder="¿Cuál es tu pregunta?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="mt-1"
                      maxLength={200}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Opciones</label>
                    <div className="space-y-2 mt-1">
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Opción ${index + 1}`}
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                            maxLength={100}
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePollOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {pollOptions.length < 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addPollOption}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar opción
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowMultiple"
                      checked={allowMultipleVotes}
                      onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="allowMultiple" className="text-sm">
                      Permitir múltiples respuestas
                    </label>
                  </div>
                  
                  <Button onClick={createPoll} className="w-full">
                    Crear Encuesta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Poll Preview */}
          {poll && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Encuesta</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removePoll}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <h4 className="font-medium mb-3">{poll.question}</h4>
                
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <span className="text-sm">{option.text}</span>
                    </div>
                  ))}
                </div>
                
                {poll.allowMultiple && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Se permiten múltiples respuestas
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Agregar imagen"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker)
                setShowStickerPicker(false)
              }}
              title="Agregar emoji"
              className={cn(showEmojiPicker && "bg-muted")}
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowStickerPicker(!showStickerPicker)
                setShowEmojiPicker(false)
              }}
              title="Agregar sticker"
              className={cn(showStickerPicker && "bg-muted")}
            >
              <Sticker className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPollCreator(!showPollCreator)
                setShowEmojiPicker(false)
                setShowStickerPicker(false)
              }}
              title="Crear encuesta"
              className={cn(showPollCreator && "bg-muted")}
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !selectedImage)}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}