"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Sparkles, Trophy, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  match: Match | null
  onStartChat: () => void
}

export function MatchModal({ isOpen, onClose, match, onStartChat }: MatchModalProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!match) return null

  const handleStartChat = () => {
    setIsAnimating(true)
    timeoutRef.current = setTimeout(() => {
      onStartChat()
      onClose()
      router.push('/chats')
    }, 500) as unknown as number
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse",
                isAnimating && "animate-ping"
              )} />
              <div className="relative bg-background rounded-full p-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            ¡HAZ HECHO MATCH!
          </DialogTitle>
          
          <div className="text-lg font-semibold text-center">
            <span className="text-blue-600">PUBG MOBILE</span>
            <br />
            <span className="text-green-600">¡LISTOS PARA JUGAR!</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del match */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-blue-500">
                <AvatarImage src={match.user1.avatarUrl} alt={match.user1.name || match.user1.displayName || match.user1.username} />
                <AvatarFallback>{(match.user1.name || match.user1.displayName || match.user1.username || 'U')[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm">{match.user1.name || match.user1.displayName || match.user1.username}</p>
              <Badge variant="secondary" className="text-xs">{match.user1.rank}</Badge>
            </div>
            
            <div className="flex flex-col items-center">
              <Sparkles className="h-8 w-8 text-yellow-500 animate-bounce" />
              <span className="text-xs font-medium text-muted-foreground mt-1">MATCH</span>
            </div>
            
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-green-500">
                <AvatarImage src={match.user2.avatarUrl} alt={match.user2.name || match.user2.displayName || match.user2.username} />
                <AvatarFallback>{(match.user2.name || match.user2.displayName || match.user2.username || 'U')[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm">{match.user2.name || match.user2.displayName || match.user2.username}</p>
              <Badge variant="secondary" className="text-xs">{match.user2.rank}</Badge>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Ahora pueden jugar juntos y chatear</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ¡Ambos se enviaron solicitudes de conexión!
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button 
              onClick={handleStartChat}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              disabled={isAnimating}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {isAnimating ? 'Iniciando Chat...' : 'Iniciar Chat'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
              disabled={isAnimating}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}