"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { recentChats as initialChats } from "@/lib/data"
import { getChatMessages } from "@/lib/database"
import { 
  subscribeToMessages, 
  sendMessageRealtime, 
  subscribeToTypingIndicators, 
  setTypingIndicator,
  subscribeToConnectionStatus,
  cleanupChatListeners 
} from "@/lib/realtime-chat"
import { Send, Mic, Phone, Paperclip, File, ImageIcon as ImageIconLucide, User, Sticker, Settings2, ArrowLeft, Camera, Play, Pause } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Chat, Message } from "@/lib/types"
import { ChatThemeSettings } from "@/components/chat-theme-settings"
import { VoiceRecorder } from "@/components/voice-recorder"
import { CameraCapture } from "@/components/camera-capture"
import { AudioCall } from "@/components/audio-call"
import { PermissionsDialog } from "@/components/permissions-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

interface ChatClientProps {
  chatId: string
}

export default function ChatClient({ chatId }: ChatClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { permissions, requestAllPermissions } = usePermissions()
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [chatTheme, setChatTheme] = useState('bg-chat-default')
  const [customBg, setCustomBg] = useState<string | null>(null)
  const customBgInputRef = useRef<HTMLInputElement>(null)
  const [isAudioCallOpen, setIsAudioCallOpen] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioContextEnabled, setAudioContextEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  
  // Encontrar el chat actual
  const currentChat = chats.find(chat => chat.id === chatId)

  // Configurar listeners en tiempo real
  useEffect(() => {
    if (!chatId) return

    setLoading(true)
    
    // Suscribirse a mensajes en tiempo real
    const unsubscribeMessages = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages)
      setLoading(false)
    })
    
    // Suscribirse a indicadores de escritura
    const unsubscribeTyping = subscribeToTypingIndicators(chatId, (users) => {
      setTypingUsers(users)
    })
    
    // Suscribirse al estado de conexión
    const unsubscribeConnection = subscribeToConnectionStatus((online) => {
      setIsOnline(online)
      if (online) {
        toast({
          title: "Conectado",
          description: "Conexión restablecida"
        })
      } else {
        toast({
          title: "Sin conexión",
          description: "Trabajando en modo offline",
          variant: "destructive"
        })
      }
    })

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()
      unsubscribeConnection()
    }
  }, [chatId, toast])

  // Limpiar recursos de audio al desmontar el componente
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [])

  // Manejar indicador de escritura
  const handleTyping = async () => {
    if (!chatId) return
    
    // Limpiar timeout anterior
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Activar indicador de escritura
    await setTypingIndicator(chatId, 'current-user-id', true)
    
    // Configurar timeout para desactivar después de 3 segundos
    const timeout = setTimeout(async () => {
      await setTypingIndicator(chatId, 'current-user-id', false)
      setTypingTimeout(null)
    }, 3000) as unknown as number
    
    setTypingTimeout(timeout)
  }

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      cleanupChatListeners()
    }
  }, [typingTimeout])

  // Función para habilitar el contexto de audio en dispositivos móviles
  const enableAudioContext = async () => {
    try {
      // Crear un audio silencioso para activar el contexto de audio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      silentAudio.volume = 0
      await silentAudio.play()
      silentAudio.pause()
      setAudioContextEnabled(true)
      
      toast({
        title: "Audio habilitado",
        description: "Ahora puedes reproducir mensajes de voz.",
      })
    } catch (error) {
      console.error('Error enabling audio context:', error)
    }
  }
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentChat) return

    try {
      // Detener indicador de escritura
      await setTypingIndicator(chatId, 'current-user-id', false)
      
      // Enviar mensaje usando el sistema en tiempo real
      const result = await sendMessageRealtime(chatId, 'current-user-id', {
        text: message,
        content: message,
        sender: 'current-user-id'
      })

      if (result.success) {
        // Limpiar el input
        setMessage("")
        
        if (isOnline) {
          toast({
            title: "Mensaje enviado",
            description: "Tu mensaje ha sido enviado correctamente."
          })
        } else {
          toast({
            title: "Mensaje guardado",
            description: "Se enviará cuando recuperes la conexión."
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje. Se reintentará automáticamente.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  }

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (!currentChat) return

    const newMessage = {
      id: Date.now().toString(),
      sender: 'me' as const,
      text: `🎤 Mensaje de voz (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      content: `🎤 Mensaje de voz (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      timestamp: new Date(),
      type: 'voice' as const,
      audioBlob
    }

    const updatedChats = chats.map(chat => {
      if (chat.id === currentChat.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessageTimestamp: newMessage.timestamp instanceof Date ? newMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : newMessage.timestamp,
        }
      }
      return chat
    })

    setChats(updatedChats)
    setShowVoiceRecorder(false)
  }

  const handleSendImage = (imageBlob: Blob, imageUrl: string) => {
    if (!currentChat) return

    const newMessage = {
      id: Date.now().toString(),
      sender: 'me' as const,
      text: '📷 Imagen',
      content: '📷 Imagen',
      timestamp: new Date(),
      type: 'image' as const,
      imageUrl,
      imageBlob
    }

    const updatedChats = chats.map(chat => {
      if (chat.id === currentChat.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessageTimestamp: newMessage.timestamp instanceof Date ? newMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : newMessage.timestamp,
        }
      }
      return chat
    })

    setChats(updatedChats)
    setShowCameraCapture(false)
  }

  const handlePlayAudio = async (message: any) => {
    if (!message.audioBlob) {
      toast({
        title: "Error",
        description: "No hay audio disponible para reproducir.",
        variant: "destructive"
      })
      return
    }

    // Verificar si el contexto de audio está habilitado en dispositivos móviles
    if (!audioContextEnabled && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      toast({
        title: "Habilitar audio",
        description: "Toca 'Habilitar Audio' para reproducir mensajes de voz.",
        variant: "default"
      })
      return
    }

    // Mostrar confirmación antes de reproducir
    const shouldPlay = window.confirm(`¿Deseas reproducir este mensaje de voz de ${currentChat?.name || 'Usuario'}?`)
    if (!shouldPlay) {
      return
    }

    // Si ya se está reproduciendo este audio, pausarlo
    if (playingAudioId === message.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        setPlayingAudioId(null)
      }
      return
    }

    // Pausar cualquier audio que se esté reproduciendo y limpiar URL anterior
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    try {
      // Crear URL del blob
      const audioUrl = URL.createObjectURL(message.audioBlob)
      audioUrlRef.current = audioUrl
      
      // Crear elemento de audio con configuraciones mejoradas
      const audio = new Audio()
      audio.preload = 'auto'
      audio.controls = false
      
      // Configurar para dispositivos móviles
      audio.setAttribute('playsinline', 'true')
      audio.setAttribute('webkit-playsinline', 'true')
      
      audioRef.current = audio
      setPlayingAudioId(message.id)

      // Configurar eventos
      audio.onloadstart = () => {
        console.log('Audio loading started')
      }

      audio.oncanplay = () => {
        console.log('Audio can start playing')
      }

      audio.onended = () => {
         setPlayingAudioId(null)
         if (audioUrlRef.current) {
           URL.revokeObjectURL(audioUrlRef.current)
           audioUrlRef.current = null
         }
         audioRef.current = null
       }
 
       audio.onerror = (e) => {
         console.error('Audio error:', e)
         setPlayingAudioId(null)
         if (audioUrlRef.current) {
           URL.revokeObjectURL(audioUrlRef.current)
           audioUrlRef.current = null
         }
         audioRef.current = null
         toast({
           title: "Error de reproducción",
           description: "No se pudo reproducir el mensaje de voz. Verifica que tu dispositivo soporte la reproducción de audio.",
           variant: "destructive"
         })
       }

      audio.onpause = () => {
        if (playingAudioId === message.id) {
          setPlayingAudioId(null)
        }
      }

      // Asignar la fuente después de configurar los eventos
      audio.src = audioUrl
      
      // Intentar cargar el audio
      await audio.load()
      
      // Reproducir con manejo de errores mejorado
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        await playPromise
      }
      
    } catch (error) {
       console.error('Error playing audio:', error)
       setPlayingAudioId(null)
       
       if (audioRef.current) {
         audioRef.current = null
       }
       
       if (audioUrlRef.current) {
         URL.revokeObjectURL(audioUrlRef.current)
         audioUrlRef.current = null
       }
       
       toast({
         title: "Error de reproducción",
         description: "No se pudo reproducir el mensaje de voz. Intenta tocar la pantalla primero para habilitar el audio.",
         variant: "destructive"
       })
     }
  }

  const handleVoiceRecorderClick = () => {
    if (!permissions.microphone) {
      setShowPermissionsDialog(true)
      return
    }
    setShowVoiceRecorder(true)
  }

  const handleCameraClick = () => {
    if (!permissions.camera) {
      setShowPermissionsDialog(true)
      return
    }
    setShowCameraCapture(true)
  }
  
  const lastMessageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentChat?.messages])
  
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string
        setCustomBg(result)
        setChatTheme('') // Desactivar tema predefinido
      }
      reader.readAsDataURL(file)
    }
     e.target.value = '' // Reset para poder subir la misma imagen de nuevo
  }
  
  const handleThemeSelection = (themeValue: string) => {
      setCustomBg(null) // Desactivar fondo personalizado
      setChatTheme(themeValue)
  }

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Chat no encontrado</p>
          <Link href="/chats">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a chats
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <Card className="h-full flex flex-col overflow-hidden">
        {/* Header del chat */}
        <CardHeader className="p-4 border-b flex flex-row items-center gap-3 z-10 bg-card/80 backdrop-blur-sm">
          <Link href="/chats">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <Avatar>
            <AvatarImage src={currentChat.avatarUrl} alt={currentChat.name} data-ai-hint="gaming character"/>
            <AvatarFallback>{currentChat.name.substring(0,2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle>{currentChat.name}</CardTitle>
            <p className="text-xs text-green-500">En línea</p>
          </div>
          <div className="flex items-center gap-1">

             <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsAudioCallOpen(true)}
            >
              <Phone className="h-5 w-5"/>
            </Button>
            <input type="file" accept="image/*" ref={customBgInputRef} className="hidden" onChange={handleCustomBgUpload} />
             <ChatThemeSettings setTheme={handleThemeSelection} onUploadClick={() => customBgInputRef.current?.click()}>
                <Button variant="ghost" size="icon">
                    <Settings2 className="h-5 w-5"/>
                </Button>
             </ChatThemeSettings>
          </div>
        </CardHeader>
        
        {/* Área de mensajes */}
        <div className={cn("flex-1 relative", chatTheme)} style={{ backgroundImage: customBg ? `url(${customBg})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
            <ScrollArea className="h-full absolute inset-0">
                <CardContent className="p-4 space-y-4 text-sm ">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-muted-foreground">Cargando mensajes...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="text-muted-foreground">No hay mensajes aún. ¡Envía el primero!</div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                    <div 
                        key={msg.id || index} 
                        className={`flex gap-2 items-end ${msg.sender === 'current-user-id' ? 'justify-end' : 'justify-start'}`}
                        ref={index === messages.length - 1 ? lastMessageRef : null}
                    >
                         {msg.sender !== 'current-user-id' && <Avatar className="h-6 w-6"><AvatarImage src={currentChat?.avatarUrl}/><AvatarFallback>{currentChat?.name?.substring(0,1) || 'U'}</AvatarFallback></Avatar>}
                        <div className={`p-3 rounded-xl max-w-md shadow-md ${msg.sender === 'current-user-id' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'}`}>
                          {(msg as any).type === 'image' && (msg as any).imageUrl ? (
                            <div className="space-y-2">
                              <div className="relative w-48 h-32 rounded-lg overflow-hidden">
                                <Image
                                  src={(msg as any).imageUrl}
                                  alt="Imagen enviada"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <p className="text-xs opacity-75">{msg.text}</p>
                            </div>
                          ) : (msg as any).type === 'voice' ? (
                            <div className="flex items-center gap-2 min-w-32">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-white/20"
                                onClick={() => handlePlayAudio(msg as any)}
                              >
                                {playingAudioId === (msg as any).id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="text-xs">{msg.text}</span>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                    </div>
                    ))}
                    {/* Indicador de escritura */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground animate-pulse">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span>
                          {typingUsers.length === 1 
                            ? `${typingUsers[0]} está escribiendo...`
                            : `${typingUsers.slice(0, -1).join(', ')} y ${typingUsers[typingUsers.length - 1]} están escribiendo...`
                          }
                        </span>
                      </div>
                    )}
                  </>
                )}
                </CardContent>
            </ScrollArea>
        </div>
        
        {/* Botón para habilitar audio en dispositivos móviles */}
        {!audioContextEnabled && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
          <div className="p-4 border-t bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Audio deshabilitado
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300">
                  Habilita el audio para reproducir mensajes de voz
                </p>
              </div>
              <Button
                size="sm"
                onClick={enableAudioContext}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Habilitar Audio
              </Button>
            </div>
          </div>
        )}
        
        {/* Input de mensaje */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-card flex items-center gap-2 z-10">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button type="button" size="icon" variant="ghost">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleCameraClick}>
                        <Camera className="mr-2" />
                        <span>Cámara</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <ImageIconLucide className="mr-2" />
                        <span>Galería</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <File className="mr-2" />
                        <span>Documento</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem>
                        <User className="mr-2" />
                        <span>Contacto</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <input type="file" ref={fileInputRef} className="hidden" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button type="button" size="icon" variant="ghost">
                        <Sticker className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Stickers</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>😂 Reacciones</DropdownMenuItem>
                    <DropdownMenuItem>🏆 Gaming</DropdownMenuItem>
                    <DropdownMenuItem>🎉 Celebración</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

          <Input 
            placeholder="Escribe un mensaje..." 
            className="flex-1 bg-background rounded-full px-4" 
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              handleTyping()
            }}
          />
           <Button type="button" size="icon" variant="ghost" onClick={handleVoiceRecorderClick}>
            <Mic className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </Card>

      {/* Diálogos para grabación de voz y captura de cámara */}
      <Dialog open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grabar Mensaje de Voz</DialogTitle>
          </DialogHeader>
          <VoiceRecorder
            onSendVoiceMessage={handleSendVoiceMessage}
            maxDuration={120}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCameraCapture} onOpenChange={setShowCameraCapture}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Capturar Imagen</DialogTitle>
          </DialogHeader>
          <CameraCapture
            onSendImage={handleSendImage}
            maxWidth={1280}
            maxHeight={720}
            quality={0.8}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de permisos */}
      <PermissionsDialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
      />
      
      {/* Componente de llamada de audio */}
      <AudioCall
        isOpen={isAudioCallOpen}
        onClose={() => setIsAudioCallOpen(false)}
        contactName={currentChat.name}
        contactAvatar={currentChat.avatarUrl}
        isIncoming={isIncomingCall}
        onAnswer={() => setIsIncomingCall(false)}
        onDecline={() => {
          setIsIncomingCall(false)
          setIsAudioCallOpen(false)
        }}
      />
    </div>
  )
}