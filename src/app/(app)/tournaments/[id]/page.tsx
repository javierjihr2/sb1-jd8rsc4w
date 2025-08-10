
"use client"

import { useState, useEffect, useRef } from "react"
import { notFound } from "next/navigation"
import { tournaments, playerProfile, teamMates, registeredTeams, getRegistrationStatus, updateRegistrationStatus } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, Trophy, MessageSquare, PlusCircle, AlertCircle, Send, Flag, UserPlus, FileText, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message, RegistrationRequest } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TournamentDetailPage({ params: { id } }: { params: { id: string } }) {
  const { toast } = useToast();
  const tournament = tournaments.find(t => t.id === id)
  
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [countryCode, setCountryCode] = useState(playerProfile.countryCode || "");
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'pending' | 'approved' | 'rejected'>('not_registered');
  const [isMounted, setIsMounted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simular la obtención del estado inicial después de que el componente se monte
    const currentStatus = getRegistrationStatus(id);
    setRegistrationStatus(currentStatus);
    setIsMounted(true);
    
    // Si la inscripción está aprobada, se inicializa el chat con el mensaje del sistema
    if (currentStatus === 'approved' && tournament) {
       setMessages([
          { sender: 'other', text: `¡Bienvenidos al chat del torneo "${tournament.name}"!\n\n**Detalles del Evento:**\n- **Fecha:** ${tournament.date}\n- **Premio:** ${tournament.prize}\n\n**Info Importante:**\n- Por favor, mantén una comunicación respetuosa.\n- Las reglas completas se pueden encontrar en el enlace del torneo.\n\n**Equipos Inscritos:**\n${registeredTeams.map((team, i) => `${i + 1}. ${team.name} [${team.id}]`).join('\n')}\n\n¡Mucha suerte a todos!` },
       ]);
    }
  }, [id, tournament]);
  
  useEffect(() => {
    // Este efecto se ejecuta cuando otra pestaña (ej. admin) cambia el estado en localStorage
    const handleStorageChange = () => {
      const currentStatus = getRegistrationStatus(id);
      setRegistrationStatus(currentStatus);
      if(currentStatus === 'approved' && !messages.length && tournament){
         setMessages([
          { sender: 'other', text: `¡Bienvenidos al chat del torneo "${tournament.name}"!` },
         ]);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, messages.length, tournament]);
  
   useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    return null; // Evitar el desajuste de hidratación en el primer render
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
             </CardContent>
          </Card>
          
          {registrationStatus === 'approved' && (
            <Card className="animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Chat del Torneo</CardTitle>
                    <CardDescription>Comunícate con tu equipo y otros participantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] flex flex-col">
                        <ScrollArea className="flex-1 mb-4 border rounded-lg p-4 bg-muted/50">
                            <div className="space-y-4 text-sm">
                                {messages.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex gap-3 items-end ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                                        ref={index === messages.length - 1 ? lastMessageRef : null}
                                    >
                                        {msg.sender !== 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="gaming character"/><AvatarFallback>S</AvatarFallback></Avatar>}
                                        <div className={`p-3 rounded-xl max-w-md whitespace-pre-wrap ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
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
                  <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="font-semibold text-sm">Tú estás registrando a tu equipo.</p>
                      <p className="text-xs text-muted-foreground">Una vez que la solicitud sea aprobada, podrás invitar a tus compañeros desde el chat del torneo.</p>
                  </div>
                )}
              
                <Button onClick={handleRegisterTeam} className="w-full" disabled={buttonState.disabled}>
                    {buttonState.text}
                </Button>

                 {registrationStatus === 'approved' && <p className="text-sm text-center text-green-600">¡Inscripción aprobada! Ya puedes acceder al chat del torneo arriba.</p>}
                 {registrationStatus === 'rejected' && <p className="text-sm text-center text-red-600 flex items-center justify-center gap-1"><AlertCircle className="h-4 w-4"/> Tu solicitud ha sido rechazada.</p>}
                 {registrationStatus === 'pending' && <p className="text-sm text-center text-amber-600">Tu solicitud está pendiente de aprobación por un administrador.</p>}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
