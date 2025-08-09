
"use client"

import { useState } from "react"
import { notFound } from "next/navigation"
import { tournaments, playerProfile, teamMates, registeredTeams } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Trophy, Shield, MessageSquare, PlusCircle } from "lucide-react"

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const tournament = tournaments.find(t => t.id === params.id)
  const [selectedTeammates, setSelectedTeammates] = useState<Set<string>>(new Set())
  const [isRegistered, setIsRegistered] = useState(false);

  if (!tournament) {
    notFound()
  }

  const handleSelectTeammate = (teammateId: string) => {
    const newSelection = new Set(selectedTeammates);
    if (newSelection.has(teammateId)) {
      newSelection.delete(teammateId);
    } else {
      const requiredPlayers = tournament.mode === 'Dúo' ? 1 : 3;
      if (newSelection.size < requiredPlayers) {
        newSelection.add(teammateId);
      } else {
        toast({
          variant: "destructive",
          title: "Equipo Completo",
          description: `Solo puedes seleccionar ${requiredPlayers} compañero(s) para el modo ${tournament.mode}.`,
        });
      }
    }
    setSelectedTeammates(newSelection);
  }
  
  const handleRegisterTeam = () => {
    const requiredPlayers = tournament.mode === 'Dúo' ? 1 : 3;
    if (selectedTeammates.size !== requiredPlayers && tournament.mode !== 'Solo') {
       toast({
          variant: "destructive",
          title: "Compañeros Faltantes",
          description: `Debes seleccionar ${requiredPlayers} compañero(s) para inscribirte.`,
        });
        return;
    }
    
    setIsRegistered(true);
    toast({
      title: "¡Inscripción Exitosa!",
      description: `Tu equipo ha sido inscrito en el torneo "${tournament.name}".`,
    })
  }

  const canRegister = tournament.status === 'Abierto';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Detalles del Torneo */}
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2">{tournament.region}</Badge>
              <CardTitle className="text-3xl">{tournament.name}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {tournament.date}</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4"/> Modo {tournament.mode}</span>
                <span className="flex items-center gap-2 text-primary font-bold"><Trophy className="h-4 w-4"/> {tournament.prize}</span>
              </CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground">
                    Prepárate para la batalla en el torneo {tournament.name}. Equipos de toda la región {tournament.region} competirán por la gloria y un premio de {tournament.prize}.
                </p>
                <div className="mt-4 flex gap-2">
                    <Button disabled={!canRegister}>
                        <MessageSquare className="mr-2 h-4 w-4"/>
                        Acceder al Chat del Torneo
                    </Button>
                </div>
             </CardContent>
          </Card>
          
           {/* Equipos Inscritos */}
          <Card>
            <CardHeader>
              <CardTitle>Equipos Inscritos</CardTitle>
              <CardDescription>Los equipos que ya están listos para competir.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {registeredTeams.map(team => (
                <div key={team.id} className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-bold">{team.name}</h3>
                  <div className="flex -space-x-2 overflow-hidden mt-2">
                    {team.players.map(player => (
                      <Avatar key={player.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                        <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character"/>
                        <AvatarFallback>{player.name.substring(0,1)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Panel de Inscripción */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Inscribir Escuadra</CardTitle>
              <CardDescription>
                {canRegister ? "Selecciona tu equipo y prepárate." : "Las inscripciones están cerradas."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {tournament.mode !== 'Solo' && canRegister && (
                    <div>
                        <h4 className="font-semibold mb-2">Tu Escuadra</h4>
                        <div className="space-y-3">
                           {/* Jugador Principal */}
                            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character"/>
                                        <AvatarFallback>{playerProfile.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{playerProfile.name} (Tú)</p>
                                        <p className="text-xs text-muted-foreground">{playerProfile.rank}</p>
                                    </div>
                                </div>
                                 <Badge variant="default">Líder</Badge>
                            </div>
                            
                            <h4 className="font-semibold pt-4">Selecciona tus Compañeros</h4>
                             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                               {teamMates.map(teammate => (
                                 <div key={teammate.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                                    <Checkbox 
                                        id={`teammate-${teammate.id}`} 
                                        onCheckedChange={() => handleSelectTeammate(teammate.id)}
                                        checked={selectedTeammates.has(teammate.id)}
                                    />
                                    <Label htmlFor={`teammate-${teammate.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={teammate.avatarUrl} data-ai-hint="gaming character"/>
                                            <AvatarFallback>{teammate.name.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{teammate.name}</p>
                                            <p className="text-xs text-muted-foreground">{teammate.rank}</p>
                                        </div>
                                    </Label>
                                </div>
                               ))}
                            </div>
                        </div>
                    </div>
                )}
              
                <Button onClick={handleRegisterTeam} className="w-full" disabled={!canRegister || isRegistered}>
                    {isRegistered ? 'Inscrito' : canRegister ? `Inscribir ${tournament.mode}` : 'Inscripciones Cerradas'}
                </Button>
                 {isRegistered && <p className="text-sm text-center text-green-600">¡Tu equipo está listo para la batalla!</p>}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
