"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPendingConnectionRequests, acceptConnectionRequest, rejectConnectionRequest, playerProfile } from "@/lib/data"
import type { ConnectionRequest, Match } from "@/lib/types"
import { MatchModal } from "@/components/match-modal"
import { useRouter } from "next/navigation"

interface ConnectionRequestsProps {
  onMatchCreated?: (match: Match) => void
}

export function ConnectionRequests({ onMatchCreated }: ConnectionRequestsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [newMatch, setNewMatch] = useState<Match | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const pendingRequests = await getPendingConnectionRequests(playerProfile.id)
      setRequests(pendingRequests)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (request: ConnectionRequest) => {
    try {
      const result = await acceptConnectionRequest(request.id)
      
      if (result.success && result.match) {
        setNewMatch(result.match)
        setShowMatchModal(true)
        onMatchCreated?.(result.match)
        
        toast({
          title: "¡MATCH! 🎉",
          description: `¡Ahora puedes chatear con ${request.fromUser.name}!`,
        })
        
        // Recargar solicitudes
        loadRequests()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la solicitud.",
        variant: "destructive"
      })
    }
  }

  const handleReject = async (request: ConnectionRequest) => {
    try {
      await rejectConnectionRequest(request.id)
      
      toast({
        title: "Solicitud rechazada",
        description: `Solicitud de ${request.fromUser.name} rechazada.`,
      })
      
      // Recargar solicitudes
      loadRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive"
      })
    }
  }

  const handleStartChat = () => {
    if (!newMatch) return
    
    setShowMatchModal(false)
    router.push('/chats')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitudes Pendientes
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitudes Pendientes
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes solicitudes pendientes</p>
              <p className="text-sm">¡Ve al matchmaking para encontrar jugadores!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.fromUser.avatarUrl} alt={request.fromUser.name || request.fromUser.displayName || 'Usuario'} />
                      <AvatarFallback>{(request.fromUser.name || request.fromUser.displayName || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{request.fromUser.name || request.fromUser.displayName || 'Usuario'}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{request.fromUser.rank}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        match={newMatch}
        onStartChat={handleStartChat}
      />
    </>
  )
}