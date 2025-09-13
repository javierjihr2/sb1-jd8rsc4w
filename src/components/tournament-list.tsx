"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, Trophy, Users, MapPin, Gamepad2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Tournament } from "@/lib/types"
import { tournaments as mockTournaments } from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { TournamentRegistrationDialog } from "./tournament-registration-dialog"

interface TournamentListProps {
  showCreateButton?: boolean
  onCreateTournament?: () => void
  limit?: number
  game?: string
}

export function TournamentList({ 
  showCreateButton = false, 
  onCreateTournament,
  limit,
  game 
}: TournamentListProps) {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [registeredTournaments, setRegisteredTournaments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTournaments()
  }, [game, limit])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      
      // Por ahora usamos datos mock, pero esto se puede reemplazar con la API real
      let filteredTournaments = mockTournaments.filter(t => 
        t.status === 'Próximamente' || t.status === 'Abierto'
      )
      
      if (game) {
        filteredTournaments = filteredTournaments.filter(t => 
          t.type?.toLowerCase().includes(game.toLowerCase())
        )
      }
      
      if (limit) {
        filteredTournaments = filteredTournaments.slice(0, limit)
      }
      
      setTournaments(filteredTournaments)
      
      // Cargar registros del usuario si está autenticado
      if (user) {
        // Aquí se cargarían los registros reales del usuario
        // Por ahora simulamos algunos registros
        const userRegistrations = new Set(['t1', 't3'])
        setRegisteredTournaments(userRegistrations)
      }
    } catch (error) {
      console.error('Error loading tournaments:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los torneos. Inténtalo de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (tournamentId: string, success: boolean) => {
    if (success) {
      setRegisteredTournaments(prev => new Set([...prev, tournamentId]))
      toast({
        title: "Inscripción exitosa",
        description: "Te has inscrito al torneo correctamente.",
      })
    }
  }

  const handleCancelRegistration = async (tournamentId: string) => {
    try {
      // Aquí se llamaría a la función real de cancelación
      // await cancelTournamentRegistration(tournamentId, user.id)
      
      setRegisteredTournaments(prev => {
        const newSet = new Set(prev)
        newSet.delete(tournamentId)
        return newSet
      })
      
      toast({
        title: "Registro cancelado",
        description: "Has cancelado tu inscripción al torneo.",
      })
    } catch (error) {
      console.error('Error cancelling registration:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la inscripción. Inténtalo de nuevo.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Próximamente':
        return <Badge variant="secondary">Próximamente</Badge>
      case 'Inscripciones Abiertas':
        return <Badge variant="default">Inscripciones Abiertas</Badge>
      case 'En Progreso':
        return <Badge variant="destructive">En Progreso</Badge>
      case 'Finalizado':
        return <Badge variant="outline">Finalizado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'competitivo':
        return <Trophy className="h-4 w-4" />
      case 'scrim':
        return <Gamepad2 className="h-4 w-4" />
      case 'wow':
        return <Star className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {showCreateButton && (
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Torneos</h2>
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" /> {/* Icon */}
                      <Skeleton className="h-6 w-3/4" /> {/* Title */}
                    </div>
                    <Skeleton className="h-4 w-1/2" /> {/* Description */}
                  </div>
                  <Skeleton className="h-6 w-20" /> {/* Status badge */}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  {/* Tournament details */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                
                {/* Description */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                
                {/* Maps badges */}
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Skeleton className="h-10 w-full" /> {/* Action button */}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCreateButton && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Torneos</h2>
          <Button onClick={onCreateTournament}>
            <Trophy className="h-4 w-4 mr-2" />
            Crear Torneo
          </Button>
        </div>
      )}
      
      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay torneos disponibles</h3>
            <p className="text-muted-foreground text-center">
              {game 
                ? `No se encontraron torneos para ${game}` 
                : "No hay torneos programados en este momento"}
            </p>
            {showCreateButton && (
              <Button className="mt-4" onClick={onCreateTournament}>
                Crear el primer torneo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => {
            const isRegistered = registeredTournaments.has(tournament.id)
            const isRegistrationOpen = tournament.status === 'Abierto'
            
            return (
              <Card key={tournament.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getTypeIcon(tournament.type)}
                        {tournament.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tournament.type} • {tournament.mode}
                      </CardDescription>
                    </div>
                    {getStatusBadge(tournament.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {tournament.date ? format(new Date(tournament.date), "PPP", { locale: es }) : 'Fecha por confirmar'}
                    </div>
                    
                    {tournament.startTime && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {tournament.startTime}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {tournament.region}
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tournament.maxTeams} equipos máximo
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      {tournament.prize}
                    </div>
                  </div>
                  
                  {tournament.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                  
                  {tournament.maps && tournament.maps.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tournament.maps.slice(0, 3).map((map, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {map}
                        </Badge>
                      ))}
                      {tournament.maps.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tournament.maps.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-4">
                  {!user ? (
                    <Button className="w-full" disabled>
                      Inicia sesión para inscribirte
                    </Button>
                  ) : isRegistered ? (
                    <div className="w-full space-y-2">
                      <Badge variant="default" className="w-full justify-center py-2">
                        ✓ Inscrito
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleCancelRegistration(tournament.id)}
                      >
                        Cancelar inscripción
                      </Button>
                    </div>
                  ) : isRegistrationOpen ? (
                    <TournamentRegistrationDialog
                      tournament={tournament}
                      onRegistrationComplete={(success) => handleRegistration(tournament.id, success)}
                      trigger={
                        <Button className="w-full">
                          Inscribirse
                        </Button>
                      }
                    />
                  ) : (
                    <Button className="w-full" disabled>
                      Inscripciones cerradas
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}