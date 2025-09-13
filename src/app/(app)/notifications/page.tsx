"use client"

import { useState } from "react"
import { Bell, X, Check, Clock, Users, Trophy, MessageSquare, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: 'match' | 'tournament' | 'chat' | 'system'
  timestamp: Date
  read: boolean
  actionUrl?: string
}

// Notificaciones extendidas para la página completa
const allNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nuevo Match Encontrado',
    message: 'Se encontró un equipo para tu partida de PUBG Mobile. El jugador "ProGamer123" está buscando un compañero para ranked.',
    type: 'match',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: '/matchmaking'
  },
  {
    id: '2',
    title: 'Torneo Disponible',
    message: 'Nuevo torneo "Battle Royale Championship" disponible. Premio: $500 USD. Inscripciones abiertas hasta mañana.',
    type: 'tournament',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionUrl: '/tournaments'
  },
  {
    id: '3',
    title: 'Mensaje Nuevo',
    message: 'Tienes un nuevo mensaje en el chat del equipo "Squad Alpha". El líder ha compartido estrategias para el próximo match.',
    type: 'chat',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/chats'
  },
  {
    id: '4',
    title: 'Match Confirmado',
    message: 'Tu match con "EliteSniper" ha sido confirmado para las 8:00 PM. Prepárate para la batalla.',
    type: 'match',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/matchmaking'
  },
  {
    id: '5',
    title: 'Actualización del Sistema',
    message: 'Nueva función de análisis de jugador disponible. Descubre tus estadísticas detalladas y mejora tu gameplay.',
    type: 'system',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/player-analysis'
  },
  {
    id: '6',
    title: 'Invitación a Torneo',
    message: 'Has sido invitado al torneo "Pro League Season 3". Acepta la invitación antes del viernes.',
    type: 'tournament',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/tournaments'
  },
  {
    id: '7',
    title: 'Nuevo Seguidor',
    message: '"MasterPlayer99" ahora te sigue. Revisa su perfil y considera hacer match.',
    type: 'system',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/profile'
  },
  {
    id: '8',
    title: 'Chat Grupal Activo',
    message: 'El chat "PUBG Masters" tiene 15 mensajes nuevos. Únete a la conversación sobre las nuevas estrategias.',
    type: 'chat',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/chats'
  }
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'match':
      return <Users className="h-5 w-5 text-blue-500" />
    case 'tournament':
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 'chat':
      return <MessageSquare className="h-5 w-5 text-green-500" />
    case 'system':
      return <Bell className="h-5 w-5 text-purple-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
  }
}

const getTypeLabel = (type: Notification['type']) => {
  switch (type) {
    case 'match':
      return 'Match'
    case 'tournament':
      return 'Torneo'
    case 'chat':
      return 'Chat'
    case 'system':
      return 'Sistema'
    default:
      return 'Otro'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Ahora'
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} hora${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''}`
  return `Hace ${Math.floor(diffInMinutes / 1440)} día${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''}`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(allNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || notification.type === filterType
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unread' && !notification.read) ||
                      (activeTab === 'read' && notification.read)
    
    return matchesSearch && matchesType && matchesTab
  })
  
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Mantente al día con tus matches, torneos y mensajes
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>
      
      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="match">Matches</SelectItem>
                <SelectItem value="tournament">Torneos</SelectItem>
                <SelectItem value="chat">Chats</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">No leídas ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Leídas ({notifications.length - unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || activeTab !== 'all'
                  ? 'No se encontraron notificaciones con los filtros aplicados.'
                  : 'Cuando tengas nuevas notificaciones, aparecerán aquí.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !notification.read && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          !notification.read && "font-bold"
                        )}>
                          {notification.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Link 
                          href={notification.actionUrl}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalles →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {filteredNotifications.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          </p>
        </div>
      )}
    </div>
  )
}