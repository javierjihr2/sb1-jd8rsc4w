"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { tournaments, playerProfile, registeredTeams, getRegistrationStatus, updateRegistrationStatus, countryFlags, reserveTeams, tournamentMessageTemplate as globalTournamentMessageTemplate } from "@/lib/data"
import type { PlayerProfile } from "@/lib/types"
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
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, ArrowLeft, KeyRound, UserPlus, Link as LinkIcon, Clock, Lock, Pencil, Bot, PauseCircle, Shield, Zap, Target, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/auth-provider"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk"

const participants = registeredTeams.flatMap(team => team.players);

interface TournamentChatClientProps {
  tournamentId: string;
}

export default function TournamentChatClient({ tournamentId }: TournamentChatClientProps) {
  const tournament = tournaments.find(t => t.id === tournamentId);
  const { toast } = useToast();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRoomInfoDialogOpen, setRoomInfoDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditListDialogOpen, setIsEditListDialogOpen] = useState(false);
  const [listContent, setListContent] = useState("");
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [filteredParticipants, setFilteredParticipants] = useState(participants);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [tournamentMessageTemplate, setTournamentMessageTemplate] = useState([
    { id: 'info', title: 'Información General', content: 'Información importante del torneo.' },
    { id: 'rules', title: 'Reglas del Torneo', content: 'Recuerden seguir todas las reglas del torneo.' },
    { id: 'schedule', title: 'Horarios', content: 'Revisen los horarios actualizados del torneo.' },
    { id: 'maps', title: 'Mapas', content: 'Los mapas para este torneo han sido confirmados.' }
  ]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isCustomMessageMode, setIsCustomMessageMode] = useState(false);
  const [isMessagePaused, setIsMessagePaused] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<PlayerProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const welcomeTimeoutsRef = useRef<number[]>([]);
  const mentionTimeoutRef = useRef<number | null>(null);

  // Load current profile from localStorage with multiple sources
  useEffect(() => {
    const loadProfile = () => {
      try {
        if (!user?.uid) return
        
        // Try to load from multiple sources for maximum reliability
        const keys = [
          `profile_${user.uid}`,
          `profile_backup_${user.uid}`,
          `pending_profile_${user.uid}`,
          'currentProfile' // Legacy fallback
        ]
        
        let mostRecentProfile = null
        let mostRecentTimestamp = 0
        
        for (const key of keys) {
          try {
            const saved = localStorage.getItem(key)
            if (saved) {
              const profile = JSON.parse(saved)
              const timestamp = profile.lastModified || profile.lastUpdate || 0
              if (timestamp > mostRecentTimestamp) {
                mostRecentTimestamp = timestamp
                mostRecentProfile = profile
              }
            }
          } catch (error) {
            console.warn(`Error loading profile from ${key}:`, error)
          }
        }
        
        if (mostRecentProfile) {
          setCurrentProfile(mostRecentProfile)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    
    loadProfile()
    
    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.uid && (
        e.key === `profile_${user.uid}` ||
        e.key === `profile_backup_${user.uid}` ||
        e.key === `pending_profile_${user.uid}` ||
        e.key === 'currentProfile'
      )) {
        loadProfile()
      }
    }
    
    const handleProfileUpdate = () => {
      loadProfile()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup welcome message timeouts
      welcomeTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      // Cleanup mention timeout
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current);
      }
    };
  }, []);

  if (!tournament) {
    return <div>Torneo no encontrado</div>;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send welcome messages when entering tournament chat
  useEffect(() => {
    if (!tournament) return;

    const welcomeMessages = [
      {
        id: `welcome-${Date.now()}`,
        text: `🎯 ¡Bienvenido al chat del torneo ${tournament.name}!`,
        sender: 'Sistema PUBG',
        timestamp: new Date(),
        isSystemMessage: true,
        avatar: '',
        isAdmin: false
      },
      {
        id: `info-${Date.now() + 1}`,
        text: `📅 Fecha: ${tournament.date} | 🎮 Modo: ${tournament.mode} | 🏆 Premio: ${tournament.prize}`,
        sender: 'Sistema PUBG',
        timestamp: new Date(),
        isSystemMessage: true,
        avatar: '',
        isAdmin: false
      },
      {
        id: `rules-${Date.now() + 2}`,
        text: `⚡ Recuerda seguir las reglas del torneo. Mantén un comportamiento respetuoso y deportivo.`,
        sender: 'Sistema PUBG',
        timestamp: new Date(),
        isSystemMessage: true,
        avatar: '',
        isAdmin: false
      }
    ];

    // Add welcome messages with delay to simulate real-time entry
    welcomeMessages.forEach((message, index) => {
      const timeoutId = setTimeout(() => {
        setMessages(prev => [...prev, message]);
      }, (index + 1) * 1000) as unknown as number;
      welcomeTimeoutsRef.current.push(timeoutId);
    });

    // Show toast notification
     toast({
       title: "🎮 Conectado al chat del torneo",
       description: `Has entrado al chat de ${tournament.name}`,
     });

     // Send periodic tournament reminders
     const reminderInterval = setInterval(() => {
       const reminderMessages = [
         `🔥 Recordatorio: El torneo ${tournament.name} está en curso. ¡Mantente atento a las actualizaciones!`,
         `⏰ Verifica los horarios del torneo en la información de la sala.`,
         `🎯 Asegúrate de tener tu equipo listo y configurado para el torneo.`,
         `🏆 ¡Que gane el mejor! Recuerda jugar limpio y respetar a tus oponentes.`
       ];

       const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
       
       const reminderMsg = {
         id: `reminder-${Date.now()}`,
         text: randomMessage,
         sender: 'Sistema PUBG',
         timestamp: new Date(),
         isSystemMessage: true,
         avatar: '',
         isAdmin: false
       };

       setMessages(prev => [...prev, reminderMsg]);
     }, 300000) as unknown as number; // Send reminder every 5 minutes

     // Cleanup interval on component unmount
     return () => {
       clearInterval(reminderInterval);
     };
   }, [tournament, toast]);

  const handleSendMessage = () => {
    if (newMessage.trim() && !isChatLocked) {
      const message: Message = {
         id: Date.now().toString(),
         text: newMessage,
         sender: currentProfile?.name || playerProfile.name || 'Usuario',
         timestamp: new Date(),
         avatar: currentProfile?.avatarUrl || playerProfile.avatar,
         isAdmin: false
       };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMention = (participant: any) => {
    const beforeCursor = newMessage.substring(0, cursorPosition);
    const afterCursor = newMessage.substring(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newText = beforeCursor.substring(0, lastAtIndex) + `@${participant.name} ` + afterCursor;
      setNewMessage(newText);
      setShowMentionPopover(false);
      setMentionQuery("");
      
      mentionTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastAtIndex + participant.name.length + 2;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          inputRef.current.focus();
        }
      }, 0) as unknown as number;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    
    setNewMessage(value);
    setCursorPosition(position);
    
    const beforeCursor = value.substring(0, position);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && lastAtIndex === beforeCursor.length - 1) {
      setShowMentionPopover(true);
      setMentionQuery("");
      setFilteredParticipants(participants);
    } else if (lastAtIndex !== -1) {
      const query = beforeCursor.substring(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentionPopover(false);
      } else {
        setMentionQuery(query);
        const filtered = participants.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredParticipants(filtered);
        setShowMentionPopover(true);
      }
    } else {
      setShowMentionPopover(false);
    }
  };

  const handleAddUser = () => {
    toast({
      title: "Usuario agregado",
      description: "El usuario ha sido agregado al chat del torneo.",
    });
    setAddUserDialogOpen(false);
  };

  const handleSaveList = () => {
    toast({
      title: "Lista guardada",
      description: "La lista ha sido actualizada correctamente.",
    });
    setIsEditListDialogOpen(false);
  };

  const handleLockToggle = () => {
    setIsChatLocked(!isChatLocked);
    toast({
      title: isChatLocked ? "Chat desbloqueado" : "Chat bloqueado",
      description: isChatLocked ? "Los usuarios pueden enviar mensajes." : "Solo los administradores pueden enviar mensajes.",
    });
  };

  const handleSendTemplate = () => {
    if (isCustomMessageMode && customMessage.trim()) {
       const message: Message = {
         id: Date.now().toString(),
         text: customMessage,
         sender: "Sistema",
         timestamp: new Date(),
         avatar: "/placeholder.svg",
         isAdmin: true,
         isSystemMessage: true
       };
      setMessages([...messages, message]);
      setCustomMessage("");
    } else if (selectedTemplate) {
      const template = tournamentMessageTemplate.find(t => t.id === selectedTemplate);
      if (template) {
         const message: Message = {
           id: Date.now().toString(),
           text: template.content,
           sender: "Sistema",
           timestamp: new Date(),
           avatar: "/placeholder.svg",
           isAdmin: true,
           isSystemMessage: true
         };
        setMessages([...messages, message]);
      }
    }
    
    setIsTemplateDialogOpen(false);
    setSelectedTemplate("");
    setIsCustomMessageMode(false);
    
    toast({
      title: "Mensaje enviado",
      description: "El mensaje de información del torneo ha sido enviado.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
      {/* Header - PUBG Style */}
      <div className="flex items-center justify-between p-4 border-b border-orange-500/30 bg-gradient-to-r from-slate-900/95 to-orange-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href={`/tournaments/${tournamentId}`}>
            <Button variant="ghost" size="sm" className="hover:bg-orange-500/20 text-orange-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-orange-400 rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                {tournament.name}
              </h1>
              <p className="text-sm text-orange-300 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Chat del torneo - {participants.length} participantes
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:text-white">
                <Bot className="h-4 w-4 mr-2" />
                Mensajes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-orange-300 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Enviar Mensaje de Información
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  Selecciona un mensaje predefinido o escribe uno personalizado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="custom-mode"
                    checked={isCustomMessageMode}
                    onCheckedChange={setIsCustomMessageMode}
                    className="data-[state=checked]:bg-orange-500"
                  />
                  <Label htmlFor="custom-mode" className="text-orange-300">Mensaje personalizado</Label>
                </div>
                
                {isCustomMessageMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="custom-message" className="text-orange-300">Mensaje personalizado</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Escribe tu mensaje aquí..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                      className="bg-slate-800/50 border-orange-500/30 text-white placeholder:text-slate-400"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="template" className="text-orange-300">Seleccionar plantilla</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="bg-slate-800/50 border-orange-500/30 text-white">
                        <SelectValue placeholder="Selecciona una plantilla" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-orange-500/30">
                        {tournamentMessageTemplate.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-white hover:bg-orange-500/20">
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && (
                      <div className="p-3 bg-slate-800/50 border border-orange-500/30 rounded-md">
                        <p className="text-sm text-slate-300">
                          {tournamentMessageTemplate.find(t => t.id === selectedTemplate)?.content}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSendTemplate}
                  disabled={(!selectedTemplate && !isCustomMessageMode) || (isCustomMessageMode && !customMessage.trim())}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  Enviar Mensaje
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLockToggle}
            className={`bg-slate-800/50 border-orange-500/30 hover:bg-orange-500/20 hover:text-white ${
              isChatLocked ? 'text-red-400' : 'text-orange-300'
            }`}
          >
            {isChatLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Desbloquear
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Bloquear
              </>
            )}
          </Button>
          
          <Dialog open={isRoomInfoDialogOpen} onOpenChange={setRoomInfoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:text-white">
                <KeyRound className="h-4 w-4 mr-2" />
                Info Sala
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-orange-300 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Información de la Sala
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  Detalles del chat del torneo {tournament.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-orange-300">Participantes</Label>
                  <p className="text-sm text-slate-300">{participants.length} jugadores registrados</p>
                </div>
                <div>
                  <Label className="text-orange-300">Estado del Chat</Label>
                  <p className="text-sm text-slate-300">
                    {isChatLocked ? "Bloqueado - Solo administradores" : "Abierto - Todos pueden participar"}
                  </p>
                </div>
                <div>
                  <Label className="text-orange-300">Torneo</Label>
                  <p className="text-sm text-slate-300">{tournament.name}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-orange-300 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Agregar Usuario
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  Invita a un usuario al chat del torneo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-orange-300">Nombre de usuario</Label>
                  <Input id="username" placeholder="Ingresa el nombre de usuario" className="bg-slate-800/50 border-orange-500/30 text-white placeholder:text-slate-400" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">Agregar Usuario</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages Area - PUBG Style */}
      <div className="flex-1 p-4 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-orange-300 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 text-orange-400" />
                <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn(
                  "flex gap-3",
                  message.isSystemMessage && "justify-center"
                )}>
                  {!message.isSystemMessage && (
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/30">
                      <AvatarImage src={message.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white">{message.sender[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "flex-1 space-y-1",
                    message.isSystemMessage && "max-w-md"
                  )}>
                    {!message.isSystemMessage && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-orange-300">{message.sender}</span>
                        {message.isAdmin && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">Admin</Badge>
                        )}
                        <span className="text-xs text-slate-400">
                           {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString() : new Date(message.timestamp || Date.now()).toLocaleTimeString()}
                         </span>
                      </div>
                    )}
                    <div className={cn(
                      "rounded-lg p-3 text-sm",
                      message.isSystemMessage 
                        ? "bg-gradient-to-r from-slate-800/80 to-orange-900/40 border border-orange-500/30 text-orange-300 text-center" 
                        : "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/30 backdrop-blur-sm"
                    )}>
                      {message.isSystemMessage && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-orange-400" />
                          <span className="font-medium">Información del Torneo</span>
                        </div>
                      )}
                      <p className={message.isSystemMessage ? "text-orange-300" : "text-white"}>{message.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - PUBG Style */}
      <div className="p-4 border-t border-orange-500/30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isChatLocked ? "Chat bloqueado - Solo administradores pueden escribir" : "Escribe un mensaje... (usa @ para mencionar)"}
                disabled={isChatLocked}
                className="pr-12 bg-slate-800/50 border-orange-500/30 text-white placeholder:text-slate-400 focus:border-orange-400 focus:ring-orange-400/20"
              />
              {showMentionPopover && filteredParticipants.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-background border rounded-md shadow-lg z-50">
                  <Command className="max-h-48">
                    <CommandList>
                      <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                      <CommandGroup>
                        {filteredParticipants.slice(0, 5).map((participant) => (
                          <CommandItem
                            key={participant.id}
                            onSelect={() => handleMention(participant)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{participant.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{participant.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isChatLocked}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-none"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}