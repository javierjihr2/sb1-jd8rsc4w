"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Trophy, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { getMatches, getUserProfile } from "@/lib/database"
import { useAuth } from "@/app/auth-provider"
import { addChat } from "@/lib/data"
import type { Match } from "@/lib/types"


export function MatchesView() {
  const router = useRouter()
  const { user } = useAuth()

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadMatches()
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    try {
      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadMatches = async () => {
    if (!user) return
    try {
      const userMatches = await getMatches(user.uid)
      setMatches(userMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (match: Match) => {
    if (!user || !userProfile) return
    
    const otherUser = match.user1Id === user.uid ? {
      id: match.user2Id,
      name: match.user2.name || match.user2.displayName || match.user2.username || 'Usuario',
      avatarUrl: match.user2.avatarUrl
    } : {
      id: match.user1Id,
      name: match.user1.name || match.user1.displayName || match.user1.username || 'Usuario',
      avatarUrl: match.user1.avatarUrl
    }
    
    // Crear chat ID único
    const chatId = `chat_${[user.uid, otherUser.id].sort().join('_')}`
    
    // Agregar chat
    addChat({
      id: chatId,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      unread: false,
      lastMessageTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [{
        sender: 'system',
        text: `¡Match confirmado! Ahora pueden chatear y jugar juntos.`
      }]
    })
    
    router.push('/chats')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Mis Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Mis Matches
          {matches.length > 0 && (
            <Badge variant="secondary">{matches.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tienes matches aún</p>
            <p className="text-sm">¡Ve al matchmaking para encontrar jugadores!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              if (!user || !userProfile) return null
              
              const otherUser = match.user1Id === user.uid ? {
                id: match.user2Id,
                name: match.user2.name || match.user2.displayName || match.user2.username || 'Usuario',
                avatarUrl: match.user2.avatarUrl,
                rank: match.user2.rank
              } : {
                id: match.user1Id,
                name: match.user1.name || match.user1.displayName || match.user1.username || 'Usuario',
                avatarUrl: match.user1.avatarUrl,
                rank: match.user1.rank
              }
              
              return (
                <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatares de ambos usuarios */}
                    <div className="flex items-center -space-x-2">
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage src={match.user1.avatarUrl} alt={match.user1.name || match.user1.displayName || match.user1.username} />
                        <AvatarFallback>{(match.user1.name || match.user1.displayName || match.user1.username || 'U')[0]}</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage src={match.user2.avatarUrl} alt={match.user2.name || match.user2.displayName || match.user2.username} />
                        <AvatarFallback>{(match.user2.name || match.user2.displayName || match.user2.username || 'U')[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        Match con {otherUser.name}
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{otherUser.rank}</Badge>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartChat(match)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chatear
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}