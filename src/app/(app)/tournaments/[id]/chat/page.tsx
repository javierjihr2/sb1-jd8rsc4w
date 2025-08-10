
"use client"

import { useState, useEffect, useRef } from "react"
import { notFound, useRouter } from "next/navigation"
import { tournaments, playerProfile, registeredTeams } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/lib/types"
import Link from "next/link"

export default function TournamentChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const tournament = tournaments.find(t => t.id === params.id);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect runs once to initialize the chat with a system message.
    // The restriction logic has been removed for demonstration purposes.
    if (tournament) {
        setMessages([
            { 
                sender: 'other', 
                text: `¡Bienvenidos al chat del torneo "${tournament.name}"!\n\n**Detalles del Evento:**\n- **Fecha y Hora:** ${tournament.date}\n- **Premio Total:** ${tournament.prize}\n- **Modo:** ${tournament.mode}\n\n**Info Importante:**\n- Por favor, mantén una comunicación respetuosa.\n- Las reglas completas se pueden encontrar en la página del torneo.\n\n**Equipos Inscritos (hasta ahora):**\n${registeredTeams.map((team, i) => `${i + 1}. ${team.name} [${team.id}]`).join('\n')}\n\n¡Mucha suerte a todos los participantes!` 
            },
        ]);
    }
  }, [tournament]);
  
   useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!tournament) {
    notFound();
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

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href={`/tournaments/${params.id}`}>
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
                <div className="h-[calc(100vh-300px)] flex flex-col">
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
    </div>
  )
}
