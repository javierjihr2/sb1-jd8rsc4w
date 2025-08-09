
"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { recentChats as initialChats } from "@/lib/data"
import { Search, Send, Mic, Phone, Video, Settings, Paperclip, File, Image as ImageIcon, User, Sticker } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Chat } from "@/lib/types"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChat, setSelectedChat] = useState<Chat>(chats[0]);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Marcar como leído
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: false } : c));
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const newMessage = {
      sender: 'me' as const,
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat(prev => prev ? updatedChats.find(c => c.id === prev.id)! : null);
    setMessage("");
  };
  
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.messages]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
      {/* Chat List */}
      <Card className="col-span-1 flex flex-col">
        <CardHeader className="p-4 border-b">
          <CardTitle>Chats</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar chats..." className="pl-8 bg-background" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="p-0">
            <div className="flex flex-col">
              {chats.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedChat?.id === chat.id ? 'bg-muted' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="gaming character" />
                    <AvatarFallback>{chat.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{chat.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{chat.messages[chat.messages.length - 1]?.text}</p>
                  </div>
                  {chat.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Chat Window */}
      <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
        {selectedChat ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedChat.avatarUrl} alt={selectedChat.name} data-ai-hint="gaming character"/>
                <AvatarFallback>{selectedChat.name.substring(0,2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{selectedChat.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5"/>
                </Button>
                 <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5"/>
                </Button>
                 <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5"/>
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="p-4 space-y-4 bg-background/50 text-sm">
                {selectedChat.messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        ref={index === selectedChat.messages.length - 1 ? lastMessageRef : null}
                    >
                        <div className={`p-3 rounded-xl max-w-md ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.text}
                        </div>
                    </div>
                ))}
                </CardContent>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-card flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button type="button" size="icon" variant="outline">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="mr-2" />
                            <span>Foto o Video</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                            <File className="mr-2" />
                            <span>Documento</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem>
                            <User className="mr-2" />
                            <span>Contacto</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <input type="file" ref={fileInputRef} className="hidden" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button type="button" size="icon" variant="outline">
                            <Sticker className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Stickers</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>😂 Reacciones</DropdownMenuItem>
                        <DropdownMenuItem>🏆 Gaming</DropdownMenuItem>
                        <DropdownMenuItem>🎉 Celebración</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

              <Input 
                placeholder="Escribe un mensaje..." 
                className="flex-1 bg-background" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
               <Button type="button" size="icon" variant="outline">
                <Mic className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Selecciona un chat para empezar a conversar</p>
          </div>
        )}
      </Card>
    </div>
  )
}
