
"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { tournaments, playerProfile, registeredTeams, getRegistrationStatus, updateRegistrationStatus, countryFlags, reserveTeams } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, ArrowLeft, KeyRound, UserPlus, Link as LinkIcon, Clock, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const participants = registeredTeams.flatMap(team => team.players);

export default function TournamentChatPage() {
  const params = useParams();
  const id = params.id as string;
  const tournament = tournaments.find(t => t.id === id);
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRoomInfoDialogOpen, setRoomInfoDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Form state for room info
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [startTime, setStartTime] = useState("");
  const [streamLink, setStreamLink] = useState(tournament?.streamLink || "");
  const [selectedMapForInfo, setSelectedMapForInfo] = useState("");

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOrganizer = playerProfile.role === 'Admin' || playerProfile.role === 'Creator';
  
  const generateWelcomeMessage = (isUpdate = false) => {
    if (!tournament) return "";
    
    let registeredCount = registeredTeams.length;
    let slotsList = `01.- ENTRADA\n02.- ENTRADA\n`;
    const maxSlots = tournament.maxTeams || 25; // Defaulting to 25 if not set
    
    for (let i = 3; i <= maxSlots; i++) {
        const teamIndex = i - 3;
        const slotNumber = i.toString().padStart(2, '0');
        const team = registeredTeams[teamIndex];
        slotsList += `${slotNumber}.- ${team ? `_${team.name.toUpperCase()}_` : ''}\n`;
    }

    const mapsList = tournament.maps && tournament.maps.length > 0 
        ? tournament.maps.map((map) => `📍 ${map}`).join('\n')
        : 'Mapas no definidos.';
    
    const timeZoneFlag = tournament.timeZone ? countryFlags[tournament.timeZone] || '' : '';
    const infoSendText = tournament.infoSendTime ? `⏰ ID: ${tournament.infoSendTime} minutos antes` : '';
    const maxWithdrawalText = tournament.maxWithdrawalTime ? `🚫 Bajas hasta: ${tournament.maxWithdrawalTime} hrs ${timeZoneFlag}` : '';

    const messageHeader = isUpdate 
        ? `════ **LISTA DE EQUIPOS ACTUALIZADA** ════`
        : `══════════════════\n**${tournament.name.toUpperCase()}**\n══════════════════`;
        
    const reserveText = tournament.maxReserves && tournament.maxReserves > 0 
        ? `\n📋 **Reservas Disponibles:** ${tournament.maxReserves - reserveTeams.length}/${tournament.maxReserves}`
        : '';
        
    return `
${messageHeader}
_Organizado por: ${playerProfile.name} 🥷_

🗓️ **Fecha:** ${tournament.date}
⏰ **Comienza:** ${tournament.startTime || 'Hora no definida'} hrs ${timeZoneFlag}
${infoSendText}
${maxWithdrawalText}

🗺️ **Mapas:**
${mapsList}

👥 **Equipos Inscritos (${registeredCount}/${maxSlots - 2}):**
${slotsList.trim()}
${reserveText}

${tournament.streamLink ? `\n📺 **Transmisión:**\n${tournament.streamLink}` : ''}

_Por favor, mantengan una comunicación respetuosa. ¡Mucha suerte a todos!_
`.trim().replace(/\n\n\n/g, '\n\n');
  }

  useEffect(() => {
    setIsMounted(true);
    if (tournament && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([{ sender: 'other', text: welcomeMessage }]);
    }
  }, [tournament?.id, isMounted]);
  
  useEffect(() => {
    const handleTournamentUpdate = () => {
       const updateMessage = generateWelcomeMessage(true);
        setMessages(prev => [
            ...prev,
            { sender: 'other', text: updateMessage },
        ]);
    };
    window.addEventListener('tournamentUpdated', handleTournamentUpdate);
    return () => window.removeEventListener('tournamentUpdated', handleTournamentUpdate);
  }, []);


   useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
   useEffect(() => {
    if (inputRef.current) {
        const lastChar = newMessage.slice(-1);
        setShowMentionPopover(lastChar === '@');
    }
   }, [newMessage]);


  if (!tournament) {
    return null;
  }

  const handleSendMessage = (e: React.FormEvent, textOverride?: string) => {
    e.preventDefault();
    const messageText = textOverride || newMessage;
    if (!messageText.trim()) return;

    const message: Message = {
      sender: 'me',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, message]);
    if (!textOverride) setNewMessage("");
  };
  
  const handleSendRoomInfo = (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedMapForInfo) {
          toast({ variant: 'destructive', title: "Error", description: "Por favor, selecciona el mapa para el cual estás enviando la información." });
          return;
      }
      
      const timeZoneFlag = tournament.timeZone ? countryFlags[tournament.timeZone] || '' : '';

      const formattedMessage = `
══════════════════
**SALA PRIVADA - MAPA: ${selectedMapForInfo.toUpperCase()}**
══════════════════
_Organizado por: ${playerProfile.name} 🥷_

🔑 **Detalles de la Sala:**
• **Mapa:** ${selectedMapForInfo}
• **ID:** \`${roomId}\`
• **CONTRASEÑA:** \`${roomPassword}\`
• **COMIENZA:** ${startTime} hrs ${timeZoneFlag}

${streamLink ? `\n📺 **Transmisión:**\n${streamLink}` : ''}
`;
      
      handleSendMessage(e, formattedMessage.trim().replace(/\n\n\n/g, '\n\n'));

      // Reset form and close dialog
      setRoomId("");
      setRoomPassword("");
      setStartTime("");
      setStreamLink(tournament.streamLink || "");
      setSelectedMapForInfo("");
      setRoomInfoDialogOpen(false);
      toast({ title: "Datos de la Sala Enviados", description: "La información ha sido publicada en el chat del torneo." });
  }

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const userName = formData.get('user-name');
      toast({ title: "Usuario Añadido", description: `${userName} ha sido añadido a la sala.` });
      setAddUserDialogOpen(false);
  }

  const handleMentionSelect = (name: string) => {
      setNewMessage(prev => `${prev}${name.replace(/\s/g, '_')} `);
      setShowMentionPopover(false);
      inputRef.current?.focus();
  }

  const renderMessageText = (text: string) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, i) => {
      if (i % 2 !== 0) { // It's a mention
        return <strong key={i} className="bg-primary/20 text-primary px-1 rounded-sm">@{part}</strong>;
      }
      return part;
    });
  }


  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href={`/tournaments/${id}`}>
                <ArrowLeft className="mr-2"/>
                Volver a Detalles del Torneo
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Chat del Torneo: {tournament.name}</CardTitle>
                <CardDescription>Comunícate con tu equipo y otros participantes.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isOrganizer && (
                    <Card className="mb-4 bg-muted/50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg">Panel del Organizador</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4 items-center">
                            <Dialog open={isRoomInfoDialogOpen} onOpenChange={setRoomInfoDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Enviar Datos de Sala
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Enviar Información de la Sala</DialogTitle>
                                        <DialogDescription>Rellena los campos para notificar a los participantes.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSendRoomInfo} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="map-select">Mapa Correspondiente</Label>
                                            <Select onValueChange={setSelectedMapForInfo} value={selectedMapForInfo} required>
                                                <SelectTrigger id="map-select">
                                                    <SelectValue placeholder="Selecciona el mapa"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tournament.maps?.map(map => <SelectItem key={map} value={map}>{map}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="room-id">ID de la Sala</Label>
                                            <Input id="room-id" value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Ej: 1234567" required/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="room-password">Contraseña</Label>
                                            <Input id="room-password" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} placeholder="Ej: 1234" required/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="start-time">Hora de Inicio</Label>
                                            <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="stream-link">Enlace de Transmisión (Opcional)</Label>
                                            <Input id="stream-link" value={streamLink} onChange={e => setStreamLink(e.target.value)} placeholder="https://twitch.tv/..." />
                                        </div>
                                         <DialogFooter>
                                            <Button type="submit">Enviar Información</Button>
                                         </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                             <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                                <DialogTrigger asChild>
                                     <Button variant="outline">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Añadir Participante
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Añadir Participante Manualmente</DialogTitle>
                                        <DialogDescription>Busca a un jugador por su ID o nombre para añadirlo al torneo.</DialogDescription>
                                    </DialogHeader>
                                     <form onSubmit={handleAddUser} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="user-name">ID o Nombre del Jugador</Label>
                                            <Input id="user-name" name="user-name" placeholder="Ej: 5123456789 o Player1_Pro" required />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Añadir</Button>
                                        </DialogFooter>
                                     </form>
                                </DialogContent>
                            </Dialog>
                             <div className="flex items-center space-x-2">
                                <Switch id="lock-chat" checked={isChatLocked} onCheckedChange={setIsChatLocked} />
                                <Label htmlFor="lock-chat">Cerrar Inscripciones y Chat</Label>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <div className="h-[800px] flex flex-col">
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
                                        {renderMessageText(msg.text)}
                                    </div>
                                     {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src={playerProfile.avatarUrl} data-ai-hint="gaming character"/><AvatarFallback>Yo</AvatarFallback></Avatar>}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                         <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
                            <PopoverTrigger asChild>
                               <Input 
                                    ref={inputRef}
                                    placeholder={isChatLocked && !isOrganizer ? "El chat está cerrado por el organizador." : "Escribe un mensaje táctico o usa @ para mencionar..."}
                                    className="flex-1 bg-background" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isChatLocked && !isOrganizer}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-1">
                                <CommandList>
                                    <ScrollArea className="h-48">
                                    {participants.map(p => (
                                        <CommandItem key={p.id} onSelect={() => handleMentionSelect(p.name)} className="flex items-center gap-2 cursor-pointer">
                                             <Avatar className="h-6 w-6"><AvatarImage src={p.avatarUrl}/><AvatarFallback>{p.name.substring(0,1)}</AvatarFallback></Avatar>
                                            <span>{p.name}</span>
                                        </CommandItem>
                                    ))}
                                    </ScrollArea>
                                </CommandList>
                            </PopoverContent>
                        </Popover>
                        <Button type="submit" size="icon" disabled={isChatLocked && !isOrganizer}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}

// Minimal Command components for the popover
const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
));
CommandList.displayName = "CommandList";

const CommandItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onSelect: () => void }>(({ className, onSelect, ...props }, ref) => (
  <div ref={ref} onClick={onSelect} className={cn("flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer", className)} {...props} />
));
CommandItem.displayName = "CommandItem";
