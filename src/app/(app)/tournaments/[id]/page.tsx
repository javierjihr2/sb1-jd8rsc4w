
"use client"

import { useState, useEffect, useRef } from "react"
import { notFound, useRouter } from "next/navigation"
import { tournaments, playerProfile, teamMates, registeredTeams, getRegistrationStatus, updateRegistrationStatus } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Trophy, MessageSquare, PlusCircle, AlertCircle, Send, Flag, UserPlus, FileText, Info, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message, RegistrationRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const tournament = tournaments.find(t => t.id === params.id)
  
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [countryCode, setCountryCode] = useState(playerProfile.countryCode || "");
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'pending' | 'approved' | 'rejected'>('not_registered');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const currentStatus = getRegistrationStatus(params.id);
    setRegistrationStatus(currentStatus);
    setIsMounted(true);
  }, [params.id]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus = getRegistrationStatus(params.id);
      setRegistrationStatus(currentStatus);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [params.id]);
  
  if (!tournament) {
    notFound()
  }
  
  const handleRegisterTeam = () => {
    if (!teamName || !teamTag) {
        toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, completa el nombre y el tag del equipo." });
        return;
    }
    
    const newRequest: RegistrationRequest = {
        id: `req-${Date.now()}`,
        teamName,
        teamTag,
        countryCode,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        status: 'Pendiente',
        players: [
            { id: playerProfile.id, name: playerProfile.name, avatarUrl: playerProfile.avatarUrl }
        ]
    };
    
    const existingRequests = JSON.parse(localStorage.getItem('tournament_requests') || '[]');
    localStorage.setItem('tournament_requests', JSON.stringify([...existingRequests, newRequest]));

    updateRegistrationStatus(tournament.id, 'pending');
    setRegistrationStatus('pending');

    toast({
      title: "Solicitud Enviada",
      description: `La solicitud del equipo "${teamName}" está pendiente de aprobación.`,
    })
  }
  
  const getButtonState = () => {
    switch (registrationStatus) {
      case 'pending':
        return { text: 'Solicitud Pendiente', disabled: true };
      case 'approved':
        return { text: 'Inscripción Aprobada', disabled: true };
      case 'rejected':
        return { text: 'Solicitud Rechazada', disabled: true };
      case 'not_registered':
      default:
        return { text: `Inscribir Equipo`, disabled: tournament.status !== 'Abierto' };
    }
  }

  const buttonState = getButtonState();

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
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
                <Button asChild className="mt-4">
                    <Link href={`/tournaments/${tournament.id}/chat`}>
                        <MessageSquare className="mr-2"/>
                        Ir a la Sala de Chat del Torneo
                        <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
             </CardContent>
          </Card>

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
        
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary"/> Inscripción al Torneo</CardTitle>
              <CardDescription>
                {tournament.status === 'Abierto' ? "Completa los datos de tu equipo para registrarte." : "Las inscripciones están cerradas."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="team-name">Nombre del Equipo</Label>
                    <Input id="team-name" placeholder="Ej: Furia Nocturna" value={teamName} onChange={e => setTeamName(e.target.value)} disabled={registrationStatus !== 'not_registered'}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="team-tag">Tag del Equipo</Label>
                    <Input id="team-tag" placeholder="Ej: FN" value={teamTag} onChange={e => setTeamTag(e.target.value)} disabled={registrationStatus !== 'not_registered'}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="team-country">País del Equipo</Label>
                    <Select onValueChange={setCountryCode} value={countryCode} disabled={registrationStatus !== 'not_registered'}>
                        <SelectTrigger id="team-country">
                            <SelectValue placeholder="Selecciona el país de tu equipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AR">Argentina</SelectItem>
                            <SelectItem value="BO">Bolivia</SelectItem>
                            <SelectItem value="BR">Brasil</SelectItem>
                            <SelectItem value="CA">Canadá</SelectItem>
                            <SelectItem value="CL">Chile</SelectItem>
                            <SelectItem value="CO">Colombia</SelectItem>
                            <SelectItem value="CR">Costa Rica</SelectItem>
                            <SelectItem value="EC">Ecuador</SelectItem>
                            <SelectItem value="SV">El Salvador</SelectItem>
                            <SelectItem value="US">Estados Unidos</SelectItem>
                            <SelectItem value="GT">Guatemala</SelectItem>
                            <SelectItem value="HN">Honduras</SelectItem>
                            <SelectItem value="MX">México</SelectItem>
                            <SelectItem value="PA">Panamá</SelectItem>
                            <SelectItem value="PY">Paraguay</SelectItem>
                            <SelectItem value="PE">Perú</SelectItem>
                            <SelectItem value="PR">Puerto Rico</SelectItem>
                            <SelectItem value="DO">República Dominicana</SelectItem>
                            <SelectItem value="UY">Uruguay</SelectItem>
                            <SelectItem value="VE">Venezuela</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {tournament.mode !== 'Solo' && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="font-semibold text-sm">Tú estás registrando a tu equipo.</p>
                      <p className="text-xs text-muted-foreground">Una vez que la solicitud sea aprobada, podrás invitar a tus compañeros desde el chat del torneo.</p>
                  </div>
                )}
              
                <Button onClick={handleRegisterTeam} className="w-full" disabled={buttonState.disabled}>
                    {buttonState.text}
                </Button>

                 {registrationStatus === 'approved' && <p className="text-sm text-center text-green-600">¡Inscripción aprobada! Ya puedes acceder al chat del torneo.</p>}
                 {registrationStatus === 'rejected' && <p className="text-sm text-center text-red-600 flex items-center justify-center gap-1"><AlertCircle className="h-4 w-4"/> Tu solicitud ha sido rechazada.</p>}
                 {registrationStatus === 'pending' && <p className="text-sm text-center text-amber-600">Tu solicitud está pendiente de aprobación por un administrador.</p>}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
