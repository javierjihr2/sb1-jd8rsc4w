"use client"

import { useState, useEffect, useRef } from "react"
import { notFound, useRouter, useParams } from "next/navigation"
import { tournaments, playerProfile, teamMates, registeredTeams as initialRegisteredTeams, getRegistrationStatus, updateRegistrationStatus, reserveTeams as initialReserveTeams, myApprovedRegistrations, addApprovedRegistration, removeApprovedRegistration } from "@/lib/data"
import { registerForTournament } from '@/lib/tournament-system';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Trophy, MessageSquare, PlusCircle, AlertCircle, Send, Flag, UserPlus, FileText, Info, ArrowRight, LogOut, Loader, ArrowLeft, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message, RegistrationRequest, Team } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function TournamentDetailClient({ tournamentId }: { tournamentId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const tournament = tournaments.find(t => t.id === tournamentId)
  
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [countryCode, setCountryCode] = useState(playerProfile.countryCode || "");
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'pending' | 'approved' | 'rejected' | 'reserve'>('not_registered');
  const [isMounted, setIsMounted] = useState(false);
  
  const [_registeredTeams, setRegisteredTeams] = useState(initialRegisteredTeams);
  const [_reserveTeams, setReserveTeams] = useState(initialReserveTeams);


  useEffect(() => {
    const currentStatus = getRegistrationStatus(tournamentId);
    setRegistrationStatus(currentStatus);
    setIsMounted(true);
  }, [tournamentId]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus = getRegistrationStatus(tournamentId);
      setRegistrationStatus(currentStatus);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [tournamentId]);

  if (!tournament) {
    return notFound();
  }

  const handleRegistration = async () => {
    if (!teamName.trim() || !teamTag.trim() || !countryCode) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Crear los datos del equipo con toda la información del usuario
      const teamData = {
        teamName: teamName.trim(),
        teamTag: teamTag.trim(),
        countryCode,
        playerName: playerProfile.name,
        playerEmail: playerProfile.email,
        playerAvatarUrl: playerProfile.avatarUrl,
        playerGameId: playerProfile.gameId,
        playerRank: playerProfile.rank,
        playerLevel: playerProfile.level,
        tournamentName: tournament?.name || 'Torneo'
      };

      // Registrar en la base de datos
      const result = await registerForTournament(
        tournamentId,
        playerProfile.id,
        teamData.playerName || playerProfile.username,
        teamData.teamName,
        [playerProfile.id]
      );
      
      if (result.success) {
        updateRegistrationStatus(tournamentId, 'pending');
        setRegistrationStatus('pending');
        
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de inscripción ha sido enviada y está pendiente de aprobación.",
        });
      } else {
        throw new Error('Error al registrar en la base de datos');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud.",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = () => {
    updateRegistrationStatus(tournamentId, 'not_registered');
    setRegistrationStatus('not_registered');
    
    toast({
      title: "Inscripción cancelada",
      description: "Has cancelado tu inscripción al torneo.",
    });
  };

  const getStatusBadge = () => {
    switch (registrationStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rechazado</Badge>;
      case 'reserve':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Reserva</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{tournament.name}</CardTitle>
              <CardDescription className="text-lg">{tournament.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tournament.status === 'Abierto' ? 'default' : 'secondary'}>
                {tournament.status}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-semibold">{tournament.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Premio</p>
                <p className="font-semibold">{tournament.prize}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Modo</p>
                <p className="font-semibold">{tournament.mode}</p>
              </div>
            </div>
            {tournament.startTime && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Hora de inicio</p>
                  <p className="font-semibold">{tournament.startTime} hrs</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Flag className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Región</p>
                <p className="font-semibold">{tournament.region}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-semibold">{tournament.type}</p>
              </div>
            </div>
          </div>

          {tournament.maps && tournament.maps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Mapas del torneo</h3>
              <div className="flex flex-wrap gap-2">
                {tournament.maps.map((map, index) => (
                  <Badge key={index} variant="outline">{map}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Section */}
      {tournament.status === 'Abierto' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Inscripción al Torneo
            </CardTitle>
            <CardDescription>
              {registrationStatus === 'not_registered' 
                ? 'Completa el formulario para inscribirte al torneo'
                : registrationStatus === 'pending'
                ? 'Tu solicitud está pendiente de aprobación'
                : registrationStatus === 'approved'
                ? 'Estás inscrito en este torneo'
                : registrationStatus === 'rejected'
                ? 'Tu solicitud fue rechazada'
                : 'Estás en la lista de reserva'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {registrationStatus === 'not_registered' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Nombre del Equipo</Label>
                    <Input
                      id="team-name"
                      placeholder="Ej: Alpha Squad"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-tag">Tag del Equipo</Label>
                    <Input
                      id="team-tag"
                      placeholder="Ej: [ALPHA]"
                      value={teamTag}
                      onChange={(e) => setTeamTag(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries({
                        'MX': '🇲🇽 México',
                        'US': '🇺🇸 Estados Unidos',
                        'CA': '🇨🇦 Canadá',
                        'AR': '🇦🇷 Argentina',
                        'BR': '🇧🇷 Brasil',
                        'CO': '🇨🇴 Colombia',
                        'CL': '🇨🇱 Chile',
                        'PE': '🇵🇪 Perú',
                        'VE': '🇻🇪 Venezuela'
                      }).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRegistration} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </Button>
              </>
            )}
            
            {(registrationStatus === 'pending' || registrationStatus === 'approved') && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="destructive" onClick={handleWithdraw}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cancelar Inscripción
                </Button>
                {registrationStatus === 'approved' && (
                  <Button asChild>
                    <Link href={`/tournaments/${tournament.id}/chat`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Acceder al Chat
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      {tournament.streamLink && (
        <Card>
          <CardHeader>
            <CardTitle>Transmisión en Vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer">
                Ver Stream
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}