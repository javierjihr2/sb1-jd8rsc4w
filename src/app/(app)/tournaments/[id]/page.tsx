
"use client"

import { useState, useEffect, useRef } from "react"
import { notFound } from "next/navigation"
import { tournaments, playerProfile, teamMates, registeredTeams, getRegistrationStatus, updateRegistrationStatus } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Trophy, MessageSquare, PlusCircle, AlertCircle, Send, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message, RegistrationRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

// Datos de ejemplo para el chat del torneo
const initialTournamentMessages: Message[] = [
    { sender: 'other', text: '¡Equipo, listos! La primera partida empieza en 30 minutos. ¿Todos conectados?' },
    { sender: 'other', text: 'Confirmado. ¿Cuál es la estrategia para el primer mapa? ¿Caemos en Georgopol?' },
    { sender: 'me', text: 'Sí, caigamos en Georgopol Sur, en los contenedores. Aseguremos el loot rápido y controlemos el puente.' },
    { sender: 'other', text: 'Entendido. Yo me encargo de la cobertura con el francotirador si lo encuentro.' },
];

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const tournament = tournaments.find(t => t.id === params.id)
  
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [countryCode, setCountryCode] = useState(playerProfile.countryCode || "");
  const [selectedTeammates, setSelectedTeammates] = useState<Set<string>>(new Set())
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'pending' | 'approved' | 'rejected'>('not_registered');
  const [isMounted, setIsMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>(initialTournamentMessages);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simular la obtención del estado inicial después de que el componente se monte
    const currentStatus = getRegistrationStatus(tournament?.id || '');
    setRegistrationStatus(currentStatus);
    if(currentStatus === 'approved'){
        setShowChat(true); // Mostrar chat si ya está aprobado
    }
    setIsMounted(true); // Asegurar que la re-hidratación coincida con el estado del servidor
  }, [tournament?.id]);
  
  useEffect(() => {
    // Este efecto se ejecuta cuando otra pestaña del navegador (por ejemplo, admin) cambia el estado
    const handleStorageChange = () => {
      const currentStatus = getRegistrationStatus(tournament?.id || '');
      setRegistrationStatus(currentStatus);
       if(currentStatus === 'approved'){
        setShowChat(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [tournament?.id]);
  
   useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    if (!teamName || !teamTag) {
        toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, completa el nombre y el tag del equipo." });
        return;
    }

    const requiredPlayers = tournament.mode === 'Dúo' ? 1 : 3;
    if (selectedTeammates.size !== requiredPlayers && tournament.mode !== 'Solo') {
       toast({
          variant: "destructive",
          title: "Compañeros Faltantes",
          description: `Debes seleccionar ${requiredPlayers} compañero(s) para inscribirte.`,
        });
        return;
    }
    
    // Simular la creación de una nueva solicitud de registro
    const newRequest: RegistrationRequest = {
        id: `req-${Date.now()}`,
        teamName,
        teamTag,
        countryCode,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        status: 'Pendiente',
        players: [
            playerProfile, 
            ...teamMates.filter(tm => selectedTeammates.has(tm.id))
        ]
    };
    
    // En una app real, esto se enviaría al backend. Aquí lo guardamos en localStorage.
    const existingRequests = JSON.parse(localStorage.getItem('tournament_requests') || '[]');
    localStorage.setItem('tournament_requests', JSON.stringify([...existingRequests, newRequest]));

    updateRegistrationStatus(tournament.id, 'pending');
    setRegistrationStatus('pending');

    toast({
      title: "Solicitud Enviada",
      description: `La solicitud del equipo "${teamName}" está pendiente de aprobación.`,
    })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      sender: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };
  
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
    return null; // Evitar el desajuste de hidratación
  }

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
                {registrationStatus === 'approved' && !showChat && (
                    <div className="mt-4 flex gap-2">
                        <Button onClick={() => setShowChat(true)}>
                            <MessageSquare className="mr-2 h-4 w-4"/>
                            Acceder al Chat del Torneo
                        </Button>
                    </div>
                 )}
             </CardContent>
          </Card>
          
          {showChat && (
            <Card>
                <CardHeader>
                    <CardTitle>Chat del Torneo</CardTitle>
                    <CardDescription>Comunícate con tu equipo y planea tu estrategia.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex flex-col">
                        <ScrollArea className="flex-1 mb-4">
                            <div className="p-4 space-y-4 text-sm">
                                {messages.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex gap-3 items-end ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                                        ref={index === messages.length - 1 ? lastMessageRef : null}
                                    >
                                        {msg.sender !== 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="gaming character"/><AvatarFallback>T</AvatarFallback></Avatar>}
                                        <div className={`p-3 rounded-xl max-w-md ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            {msg.text}
                                        </div>
                                         {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character"/><AvatarFallback>Yo</AvatarFallback></Avatar>}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input 
                                placeholder="Escribe un mensaje táctico..." 
                                className="flex-1 bg-background" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <Button type="submit" size="icon">
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
          )}

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
                                        disabled={registrationStatus !== 'not_registered'}
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

    