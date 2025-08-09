
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Code, UserPlus, Newspaper, Check, X, Users } from "lucide-react"
import { initialRegistrationRequests } from "@/lib/data"
import type { RegistrationRequest } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<RegistrationRequest[]>(initialRegistrationRequests)

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Perfil Creado",
      description: "El perfil de desarrollador ha sido creado con éxito.",
    })
  }

  const handleCreateArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Artículo Creado",
      description: "El nuevo artículo de noticias ha sido publicado.",
    })
  }

  const handleRequest = (requestId: string, status: "Aprobado" | "Rechazado") => {
    setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req))
    toast({
        title: `Solicitud ${status}`,
        description: `El equipo ha sido ${status.toLowerCase()} para el torneo.`,
    })
  }


  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona los perfiles, solicitudes y configuraciones de la aplicación.</p>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Gestionar Solicitudes de Torneos
                    </CardTitle>
                    <CardDescription>
                        Acepta o rechaza las solicitudes de inscripción a torneos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requests.map(request => (
                        <div key={request.id} className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                                <p className="font-bold text-lg">{request.teamName}</p>
                                <p className="text-sm text-muted-foreground">{request.tournamentName}</p>
                                <div className="flex -space-x-2 overflow-hidden mt-2">
                                    {request.players.map(player => (
                                    <Avatar key={player.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-background">
                                        <AvatarImage src={player.avatarUrl} data-ai-hint="gaming character"/>
                                        <AvatarFallback>{player.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="sm:text-right">
                                {request.status === 'Pendiente' ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleRequest(request.id, 'Aprobado')}>
                                            <Check className="h-4 w-4 mr-1"/>Aprobar
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleRequest(request.id, 'Rechazado')}>
                                            <X className="h-4 w-4 mr-1"/>Rechazar
                                        </Button>
                                    </div>
                                ) : (
                                    <p className={`font-semibold ${request.status === 'Aprobado' ? 'text-green-600' : 'text-red-600'}`}>
                                        Estado: {request.status}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-4">No hay solicitudes pendientes.</p>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Crear Perfil
              </CardTitle>
              <CardDescription>
                Añade un nuevo perfil con un rol específico al sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateProfile}>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de Usuario</Label>
                    <Input id="name" placeholder="Ej: SuperDev" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="dev@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select required>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key="developer" value="developer">Desarrollador</SelectItem>
                            <SelectItem key="creator" value="creator">Creador de Contenido</SelectItem>
                            <SelectItem key="admin" value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Crear Perfil
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Crear Artículo
              </CardTitle>
              <CardDescription>
                Publica un nuevo artículo en la sección de noticias.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateArticle}>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="article-title">Título</Label>
                  <Input id="article-title" placeholder="Ej: Nueva Actualización 3.4" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="article-summary">Resumen</Label>
                  <Textarea id="article-summary" placeholder="Un breve resumen del artículo..." required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="article-category">Categoría</Label>
                  <Select required>
                      <SelectTrigger id="article-category">
                          <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem key="updates" value="updates">Actualizaciones</SelectItem>
                          <SelectItem key="events" value="events">Eventos</SelectItem>
                          <SelectItem key="esports" value="esports">eSports</SelectItem>
                          <SelectItem key="guides" value="guides">Guías</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Publicar Artículo
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
