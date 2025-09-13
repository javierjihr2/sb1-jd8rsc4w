"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Trophy, MapPin, Gamepad2, Eye, Settings, Crown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TournamentRegistrationDialog } from "@/components/tournament-registration-dialog"
import { Tournament, TournamentRegistration } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface TournamentDetailsProps {
  tournament: Tournament
  onBack?: () => void
}

interface Participant {
  id: string
  name: string
  avatar?: string
  teamName?: string
  isLeader: boolean
  registrationDate: string
  status: 'confirmed' | 'waitlist'
}

export function TournamentDetails({ tournament, onBack }: TournamentDetailsProps) {
  const { user } = useAuth()
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data para participantes
  useEffect(() => {
    const mockParticipants: Participant[] = [
      {
        id: '1',
        name: 'ProGamer123',
        teamName: 'Los Conquistadores',
        isLeader: true,
        registrationDate: '2024-01-15',
        status: 'confirmed'
      },
      {
        id: '2',
        name: 'SnipeKing',
        teamName: 'Dúo Dinámico',
        isLeader: true,
        registrationDate: '2024-01-16',
        status: 'confirmed'
      },
      {
        id: '3',
        name: 'TacticalMaster',
        teamName: 'Elite Squad',
        isLeader: true,
        registrationDate: '2024-01-17',
        status: 'waitlist'
      }
    ]
    
    setParticipants(mockParticipants)
    setIsLoading(false)
  }, [tournament.id])

  const isRegistered = userRegistration !== null
  const registrationProgress = tournament.maxTeams ? ((tournament.registeredTeams || 0) / tournament.maxTeams) * 100 : 0
  const spotsRemaining = tournament.maxTeams ? tournament.maxTeams - (tournament.registeredTeams || 0) : 0
  const isRegistrationOpen = tournament.status === 'Próximamente' && spotsRemaining > 0

  const handleRegistrationComplete = (success: boolean) => {
    if (success) {
      // Simular registro exitoso
      setUserRegistration({
        id: 'user-reg-1',
        tournamentId: tournament.id,
        userId: user?.uid || 'current-user',
        username: user?.displayName || 'Usuario Actual',
        teamName: 'Mi Equipo',
        status: spotsRemaining > 1 ? 'registered' : 'waitlisted',
        registrationDate: new Date(),
        teamMembers: []
      })
    }
  }

  const handleCancelRegistration = async () => {
    try {
      // Simular cancelación
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUserRegistration(null)
      toast({
        title: "Inscripción cancelada",
        description: "Tu inscripción ha sido cancelada exitosamente.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la inscripción. Inténtalo de nuevo.",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTournamentIcon = (type: string) => {
    switch (type) {
      case 'Competitivo':
        return <Trophy className="h-5 w-5" />
      case 'Scrims':
        return <Gamepad2 className="h-5 w-5" />
      case 'WoW':
        return <Crown className="h-5 w-5" />
      default:
        return <Users className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Próximamente':
        return 'bg-blue-500'
      case 'En Progreso':
        return 'bg-green-500'
      case 'Finalizado':
        return 'bg-gray-500'
      case 'Cancelado':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            ← Volver
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(tournament.status)}>
            {tournament.status}
          </Badge>
          <Badge variant="outline">{tournament.type}</Badge>
        </div>
      </div>

      {/* Información principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                {getTournamentIcon(tournament.type)}
                {tournament.name}
              </CardTitle>
              <CardDescription className="text-base">
                {tournament.description || 'Torneo de PUBG Mobile'}
              </CardDescription>
            </div>
            {tournament.prize && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Premio</p>
                <p className="text-2xl font-bold text-primary">{tournament.prize}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{formatDate(tournament.date)}</p>
                <p className="text-xs text-muted-foreground">Fecha</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{formatTime(tournament.startTime || '')}</p>
                <p className="text-xs text-muted-foreground">Hora de inicio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{tournament.mode}</p>
                <p className="text-xs text-muted-foreground">Modo de juego</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{tournament.region}</p>
                <p className="text-xs text-muted-foreground">Región</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Progreso de inscripciones */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Inscripciones</h3>
              <span className="text-sm text-muted-foreground">
                {tournament.registeredTeams || 0}/{tournament.maxTeams} equipos
              </span>
            </div>
            <Progress value={registrationProgress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{spotsRemaining} espacios disponibles</span>
              <span>{tournament.maxReserves} reservas máximas</span>
            </div>
          </div>

          {/* Mapas */}
          {tournament.maps && tournament.maps.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Mapas del Torneo</h3>
              <div className="flex flex-wrap gap-2">
                {tournament.maps.map((map, index) => (
                  <Badge key={index} variant="secondary">
                    {map}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Transmisión en vivo */}
          {tournament.streamLink && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Eye className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Transmisión en vivo disponible</span>
              <Button size="sm" variant="outline" asChild>
                <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer">
                  Ver Stream
                </a>
              </Button>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            {!isRegistered && isRegistrationOpen && (
              <TournamentRegistrationDialog
                tournament={tournament}
                trigger={
                  <Button className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Inscribirse
                  </Button>
                }
                onRegistrationComplete={handleRegistrationComplete}
              />
            )}
            
            {isRegistered && (
              <div className="flex gap-2 flex-1">
                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Inscrito como {userRegistration?.status === 'waitlisted' ? 'reserva' : 'participante'}
                  </p>
                  {userRegistration?.teamName && (
                    <p className="text-xs text-green-600">Equipo: {userRegistration.teamName}</p>
                  )}
                </div>
                <Button variant="outline" onClick={handleCancelRegistration}>
                  Cancelar
                </Button>
              </div>
            )}
            
            {!isRegistrationOpen && (
              <Button disabled className="flex-1">
                {tournament.status === 'Cerrado' ? 'Torneo Finalizado' : 'Inscripciones Cerradas'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs con información adicional */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="bracket">Fixture</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participantes Registrados</CardTitle>
              <CardDescription>
                Lista de equipos y jugadores inscritos en el torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="w-24 h-4 bg-muted rounded" />
                        <div className="w-16 h-3 bg-muted rounded" />
                      </div>
                      <div className="w-16 h-6 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{participant.name}</p>
                          {participant.isLeader && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {participant.teamName && (
                          <p className="text-sm text-muted-foreground">
                            {participant.teamName}
                          </p>
                        )}
                      </div>
                      <Badge variant={participant.status === 'confirmed' ? 'default' : 'secondary'}>
                        {participant.status === 'confirmed' ? 'Confirmado' : 'Lista de espera'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aún no hay participantes registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reglas del Torneo</CardTitle>
              <CardDescription>
                Información importante sobre las reglas y formato del torneo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {tournament.description ? (
                  <div className="whitespace-pre-wrap">{tournament.description}</div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Reglas Generales</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Todos los participantes deben estar presentes 15 minutos antes del inicio</li>
                      <li>No se permiten modificaciones o hacks de ningún tipo</li>
                      <li>El comportamiento antideportivo resultará en descalificación</li>
                      <li>Las decisiones de los organizadores son finales</li>
                    </ul>
                    
                    <h4 className="font-semibold">Formato del Torneo</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Modo: {tournament.mode}</li>
                      <li>Región: {tournament.region}</li>
                      <li>Mapas: {tournament.maps?.join(', ') || 'Por determinar'}</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bracket" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixture del Torneo</CardTitle>
              <CardDescription>
                Bracket y programación de partidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>El fixture se publicará una vez que se completen las inscripciones</p>
                <p className="text-sm mt-2">Revisa esta sección antes del inicio del torneo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}