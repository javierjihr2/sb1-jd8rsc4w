
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { recentChats as initialChats } from "@/lib/data"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Chat } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const router = useRouter();

  const handleSelectChat = (chat: Chat) => {
    // Marcar como leído
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: false } : c));
    // Navegar a la página individual del chat
    router.push(`/chats/${chat.id}`);
  }




  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-120px)]">
      <Card className="h-full flex flex-col">
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
                  className="flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectChat(chat)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="gaming character" />
                    <AvatarFallback>{chat.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{chat.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{chat.messages[chat.messages.length - 1]?.text}</p>
                  </div>
                  <div className="flex flex-col items-end text-xs">
                     {chat.unread && <span className="h-2.5 w-2.5 rounded-full bg-primary mb-1" />}
                     <span className="text-muted-foreground">{chat.lastMessageTimestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
}

