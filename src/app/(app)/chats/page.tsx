
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { recentChats } from "@/lib/data"
import { Search, Send, Mic, Phone, Video, Settings, Paperclip, File, Image, User, Sticker } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export default function ChatsPage() {
  const selectedChat = recentChats[0]; // Placeholder for selected chat logic

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
        <CardContent className="p-0 flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {recentChats.map((chat) => (
              <div key={chat.id} className={`flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 ${chat.id === selectedChat.id ? 'bg-muted' : ''}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="gaming character" />
                  <AvatarFallback>{chat.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{chat.message}</p>
                </div>
                {chat.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </CardContent>
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
            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto bg-background text-sm">
              {/* Example messages */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-xl max-w-md">
                  Hola, ¿listos para el torneo? 🏆
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-xl max-w-md">
                  ¡Claro! Ya estoy calentando. 🔥
                </div>
              </div>
               <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-xl max-w-md">
                  {selectedChat.message}
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-card flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button size="icon" variant="outline">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem>
                            <Image className="mr-2" />
                            <span>Foto o Video</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <File className="mr-2" />
                            <span>Documento</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <User className="mr-2" />
                            <span>Contacto</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button size="icon" variant="outline">
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

              <Input placeholder="Escribe un mensaje..." className="flex-1 bg-background" />
               <Button size="icon" variant="outline">
                <Mic className="h-5 w-5" />
              </Button>
              <Button size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
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
