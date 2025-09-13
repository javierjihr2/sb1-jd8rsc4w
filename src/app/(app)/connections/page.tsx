"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionRequests } from "@/components/connection-requests"
import { MatchesView } from "@/components/matches-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Trophy, Users, Heart } from "lucide-react"
import type { Match } from "@/lib/types"

export default function ConnectionsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleMatchCreated = (match: Match) => {
    // Forzar actualización de ambas pestañas
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Mis Conexiones
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus solicitudes de conexión y matches realizados
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matches</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conexiones</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas principales */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Solicitudes Pendientes
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Mis Matches
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
          <ConnectionRequests 
            key={`requests-${refreshKey}`}
            onMatchCreated={handleMatchCreated} 
          />
        </TabsContent>
        
        <TabsContent value="matches" className="space-y-4">
          <MatchesView key={`matches-${refreshKey}`} />
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Heart className="h-5 w-5" />
            ¿Cómo funciona el sistema de Match?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-2">
          <p>• <strong>Envía solicitudes:</strong> Dale al botón de conectar en el matchmaking</p>
          <p>• <strong>Recibe solicitudes:</strong> Otros jugadores pueden enviarte solicitudes</p>
          <p>• <strong>¡Haz Match!</strong> Cuando ambos se envían solicitudes, se crea un match automáticamente</p>
          <p>• <strong>Chatea:</strong> Una vez que hagan match, pueden chatear y jugar juntos</p>
        </CardContent>
      </Card>
    </div>
  )
}