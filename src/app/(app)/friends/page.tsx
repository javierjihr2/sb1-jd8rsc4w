
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { recentChats } from "@/lib/data"
import { UserPlus, MessageSquare, UserX, Search } from "lucide-react"

const friends = [
  ...recentChats.slice(1).map(c => ({...c, online: c.id.charCodeAt(1) % 2 === 0 })),
  { id: 'f1', name: 'GamerX_Treme', avatarUrl: 'https://placehold.co/40x40/FF6347/FFFFFF.png', unread: false, message: 'placeholder', online: true },
  { id: 'f2', name: 'ProSlayer_99', avatarUrl: 'https://placehold.co/40x40/4682B4/FFFFFF.png', unread: false, message: 'placeholder', online: false },
]

const friendRequests: {id: string, name: string, avatarUrl: string}[] = [
  { id: 'fr1', name: 'NoobMaster69', avatarUrl: 'https://placehold.co/40x40/6A5ACD/FFFFFF.png' },
]

export default function FriendsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Amigos</h1>
          <p className="text-muted-foreground">Gestiona tus conexiones y encuentra nuevos jugadores.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar amigos..." className="pl-8" />
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Añadir Amigo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todos los amigos</TabsTrigger>
          <TabsTrigger value="pending">Solicitudes pendientes <Badge className="ml-2 bg-primary text-primary-foreground">{friendRequests.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Amigos</CardTitle>
              <CardDescription>Tu red de compañeros de equipo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {friends.map(friend => (
                <Card key={friend.id} className="p-4 flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={friend.avatarUrl} data-ai-hint="gaming character"/>
                      <AvatarFallback>{friend.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    {friend.online && <span className="absolute bottom-1 right-1 block h-4 w-4 rounded-full bg-green-500 border-2 border-card" />}
                  </div>
                  <p className="font-semibold mt-2">{friend.name}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive"><UserX className="h-4 w-4"/></Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Amistad</CardTitle>
              <CardDescription>Acepta o rechaza las solicitudes para unirte a nuevos equipos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {friendRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.avatarUrl} data-ai-hint="gaming character"/>
                      <AvatarFallback>{request.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{request.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Aceptar</Button>
                    <Button size="sm" variant="ghost">Rechazar</Button>
                  </div>
                </div>
              ))}
               {friendRequests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tienes solicitudes pendientes.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
